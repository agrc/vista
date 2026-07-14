from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import geopandas as gpd
    import pandas as pd
    from sqlalchemy import create_engine
except ImportError as exc:
    raise SystemExit(
        "Missing Python dependencies. Create the Conda environment from scripts/environment.yml before running this script."
    ) from exc


CONFIG_FILE_NAME = "update_precinct_id.config.json"
TARGET_CRS = "EPSG:26912"
COUNTY_BOUNDARY_TABLE = "boundaries.county_boundaries"
VALID_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description=(
            "Compare residence COUNTY_ID values with the county boundary containing "
            "each residence coordinate."
        )
    )
    parser.add_argument("db_instance", help="Oracle instance key, for example dev")
    parser.add_argument(
        "connection_directory",
        help="Directory containing update_precinct_id.config.json",
    )
    parser.add_argument("export_file", help="CSV file to create")
    return parser.parse_args(argv[1:])


def load_config(connection_directory):
    config_path = Path(connection_directory) / CONFIG_FILE_NAME
    if not config_path.exists():
        raise FileNotFoundError(
            "Missing configuration file: {}. Create it in the connections folder before running the script.".format(
                config_path
            )
        )

    with config_path.open("r", encoding="utf-8") as config_file:
        return json.load(config_file)


def resolve_database_url(config_value, label):
    if not isinstance(config_value, dict) or not config_value.get("url"):
        raise ValueError("{} configuration requires 'url'.".format(label))

    return config_value["url"]


def get_vistadb_url(config, db_instance):
    instances = config.get("vistadb", {}).get("instances", {})
    if db_instance not in instances:
        raise KeyError(
            "No VistaDB configuration found for database instance '{}'".format(
                db_instance
            )
        )

    return resolve_database_url(instances[db_instance], "vistadb instance")


def get_opensgid_settings(config):
    opensgid_config = config.get("opensgid", {})
    geometry_column = opensgid_config.get("geometry_column", "shape")
    if not VALID_IDENTIFIER_PATTERN.match(geometry_column):
        raise ValueError(
            "Invalid OpenSGID geometry column '{}'".format(geometry_column)
        )

    return {
        "url": resolve_database_url(opensgid_config, "opensgid"),
        "geometry_column": geometry_column,
    }


def find_column(columns, expected_name):
    expected_name = expected_name.upper()
    for column in columns:
        if column.upper() == expected_name:
            return column

    raise KeyError("Missing expected residence column '{}'".format(expected_name))


def quote_identifier(identifier):
    return '"{}"'.format(identifier)


def quote_qualified_table_name(table_name):
    return ".".join(quote_identifier(part) for part in table_name.split("."))


def fetch_residences(vistadb_url):
    residence_query = """
        SELECT r.*
        FROM GV_VISTA.RESIDENCES r
        WHERE r.X IS NOT NULL
            AND r.Y IS NOT NULL
            AND r.X > 1
            AND r.Y > 1
    """

    print("Loading residences with valid X and Y coordinates from VistaDB")
    with create_engine(vistadb_url).connect() as oracle_connection:
        residences = pd.read_sql(residence_query, oracle_connection)

    if residences.empty:
        raise ValueError("No residences with valid X and Y coordinates were found.")

    return create_residence_points(residences)


def create_residence_points(residences):
    x_column = find_column(residences.columns, "X")
    y_column = find_column(residences.columns, "Y")
    return gpd.GeoDataFrame(
        residences,
        geometry=gpd.points_from_xy(residences[x_column], residences[y_column]),
        crs=TARGET_CRS,
    )


def fetch_county_boundaries(opensgid_settings):
    table_sql = quote_qualified_table_name(COUNTY_BOUNDARY_TABLE)
    geometry_column_sql = quote_identifier(opensgid_settings["geometry_column"])
    county_query = """
        SELECT
            countynbr AS corrected_county_id,
            ST_AsBinary(ST_Transform({geometry_column}, 26912)) AS geometry
        FROM {table_name}
    """.format(
        geometry_column=geometry_column_sql,
        table_name=table_sql,
    )

    print("Loading county boundaries from OpenSGID")
    with create_engine(opensgid_settings["url"]).connect() as postgis_connection:
        boundaries = gpd.read_postgis(
            county_query,
            postgis_connection,
            geom_col="geometry",
            crs=TARGET_CRS,
        )

    if boundaries.empty:
        raise ValueError("No county boundaries were found.")

    return boundaries


def spatially_join_residences(residences, county_boundaries):
    return gpd.sjoin(
        residences,
        county_boundaries,
        how="left",
        predicate="intersects",
    )


def prepare_output(joined_rows):
    residence_id_column = find_column(joined_rows.columns, "RESIDENCE_ID")
    county_id_column = find_column(joined_rows.columns, "COUNTY_ID")
    source_columns = [
        column
        for column in joined_rows.columns
        if column
        not in {
            residence_id_column,
            county_id_column,
            "geometry",
            "index_right",
            "corrected_county_id",
        }
    ]

    output = pd.DataFrame(
        {
            "residence_id": joined_rows[residence_id_column],
            "current_county_id": joined_rows[county_id_column],
            "corrected_county_id": joined_rows["corrected_county_id"],
        }
    )
    return pd.concat([output, joined_rows[source_columns]], axis=1)


def filter_mismatched_residences(output_rows):
    return output_rows.loc[county_id_mismatch_mask(output_rows)]


def county_id_mismatch_mask(output_rows):
    current_county_ids = pd.to_numeric(output_rows["current_county_id"], errors="raise")
    corrected_county_ids = pd.to_numeric(
        output_rows["corrected_county_id"], errors="raise"
    )
    return (
        current_county_ids.notna()
        & corrected_county_ids.notna()
        & (current_county_ids != corrected_county_ids)
    )


def write_output(export_file, output_rows):
    export_path = Path(export_file)
    export_path.parent.mkdir(parents=True, exist_ok=True)
    output_rows.to_csv(export_path, index=False, encoding="utf-8", na_rep="")
    return export_path


def summarize_results(output_rows, county_boundary_count, export_path):
    matched_count = output_rows["corrected_county_id"].notna().sum()
    unmatched_count = len(output_rows) - matched_count
    mismatch_count = county_id_mismatch_mask(output_rows).sum()

    print("County ID audit complete")
    print("CSV output: {}".format(export_path))
    print("County boundaries loaded: {}".format(county_boundary_count))
    print("Residences evaluated: {}".format(len(output_rows)))
    print("Residences with a county polygon match: {}".format(matched_count))
    print("Residences without a county polygon match: {}".format(unmatched_count))
    print("Residences with an incorrect county ID: {}".format(mismatch_count))


def main(argv=None):
    argv = argv or sys.argv
    args = parse_args(argv)
    config = load_config(args.connection_directory)

    residences = fetch_residences(get_vistadb_url(config, args.db_instance))
    county_boundaries = fetch_county_boundaries(get_opensgid_settings(config))
    joined_rows = spatially_join_residences(residences, county_boundaries)
    output_rows = prepare_output(joined_rows)
    export_path = write_output(
        args.export_file, filter_mismatched_residences(output_rows)
    )
    summarize_results(output_rows, len(county_boundaries), export_path)


if __name__ == "__main__":
    main()
