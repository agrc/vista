from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

try:
    import geopandas as gpd
    import pandas as pd
    from sqlalchemy import bindparam, create_engine, text
except ImportError as exc:
    raise SystemExit(
        "Missing Python dependencies. Create the Conda environment from scripts/environment.yml before running this script."
    ) from exc

CONFIG_FILE_NAME = "update_precinct_id.config.json"
TARGET_CRS = "EPSG:26912"
COUNTY_ID_FIELD = "COUNTY_ID"
RESIDENCE_ID_FIELD = "residence_id"
X_FIELD = "x"
Y_FIELD = "y"
OUTPUT_FIELDS = (
    ("ResidenceID", RESIDENCE_ID_FIELD),
    ("FullPrecinct", "vistaid"),
    ("Precinct", "precinctid"),
    ("SubPrecinct", "subprecinctid"),
    ("EffectiveDate", "effectivedate"),
    ("RcvdDate", "rcvddate"),
    ("AliasName", "aliasname"),
    ("Comments", "comments"),
)
VALID_TABLE_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$")
VALID_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def prompt_for_argument(prompt_text):
    return input(prompt_text).strip()


def parse_cli_args(argv):
    try:
        return argv[1], argv[2], argv[3], argv[4], argv[5]
    except IndexError:
        db_instance = prompt_for_argument(
            "Database Instance (e.g. test, live, dev, etc..): "
        )
        connection_directory = prompt_for_argument(
            "Directory of the connection configuration file: "
        )
        export_file = prompt_for_argument("Export File: ")
        county_num = prompt_for_argument("County Number: ")
        residence_ids = prompt_for_argument(
            "Residence ID(s) (e.g. 4325151) or (e.g. 23489008,890235790,012340180): "
        )
        return db_instance, connection_directory, export_file, county_num, residence_ids


def parse_residence_ids(raw_value):
    residence_ids = []
    for value in raw_value.split(","):
        stripped_value = value.strip()
        if not stripped_value:
            continue
        if not stripped_value.isdigit():
            raise ValueError("Residence IDs must be comma-separated integers.")
        residence_ids.append(int(stripped_value))

    if not residence_ids:
        raise ValueError("At least one residence ID is required.")

    return residence_ids


def resolve_config_path(connection_directory):
    return Path(connection_directory) / CONFIG_FILE_NAME


def load_config(connection_directory):
    config_path = resolve_config_path(connection_directory)
    if not config_path.exists():
        raise FileNotFoundError(
            "Missing configuration file: {}. Create it in the connections folder before running the script.".format(
                config_path
            )
        )

    with config_path.open("r", encoding="utf-8") as config_file:
        return json.load(config_file)


def resolve_database_url(config_value, label):
    if not isinstance(config_value, dict):
        raise ValueError("{} configuration must be an object.".format(label))

    if config_value.get("url"):
        return config_value["url"]

    raise ValueError("{} configuration requires 'url'.".format(label))


def get_vistadb_url(config, db_instance):
    vistadb_instances = config.get("vistadb", {}).get("instances", {})
    if db_instance not in vistadb_instances:
        raise KeyError(
            "No VistaDB configuration found for database instance '{}'".format(
                db_instance
            )
        )

    return resolve_database_url(vistadb_instances[db_instance], "vistadb instance")


def get_opensgid_settings(config):
    opensgid_config = config.get("opensgid", {})
    table_name = opensgid_config.get("table", "political.vista_ballot_areas")
    geometry_column = opensgid_config.get("geometry_column", "shape")

    if not VALID_TABLE_PATTERN.match(table_name):
        raise ValueError("Invalid OpenSGID table name '{}'".format(table_name))

    if not VALID_IDENTIFIER_PATTERN.match(geometry_column):
        raise ValueError(
            "Invalid OpenSGID geometry column '{}'".format(geometry_column)
        )

    return {
        "url": resolve_database_url(opensgid_config, "opensgid"),
        "table": table_name,
        "geometry_column": geometry_column,
    }


def quote_identifier(identifier):
    return '"{}"'.format(identifier)


def quote_qualified_table_name(table_name):
    return ".".join(quote_identifier(part) for part in table_name.split("."))


def fetch_residences(vistadb_url, county_num, residence_ids):
    residence_query = text(
        """
        SELECT
            RESIDENCE_ID AS residence_id,
            X AS x,
            Y AS y
        FROM GV_VISTA.RESIDENCES
        WHERE COUNTY_ID = :county_num
            AND X IS NOT NULL
            AND Y IS NOT NULL
            AND X > 1
            AND Y > 1
            AND RESIDENCE_ID IN :residence_ids
        """
    ).bindparams(bindparam("residence_ids", expanding=True))

    print("Executing Oracle residence query for county {}".format(county_num))
    with create_engine(vistadb_url).connect() as oracle_connection:
        residences = pd.read_sql(
            residence_query,
            oracle_connection,
            params={"county_num": int(county_num), "residence_ids": residence_ids},
        )

    if residences.empty:
        raise ValueError(
            f"No residences found for county {county_num} with residence IDs {residence_ids}"
        )

    return gpd.GeoDataFrame(
        residences,
        geometry=gpd.points_from_xy(residences[X_FIELD], residences[Y_FIELD]),
        crs=TARGET_CRS,
    )


def fetch_ballot_areas(opensgid_settings, county_num):
    table_sql = quote_qualified_table_name(opensgid_settings["table"])
    geometry_column_sql = quote_identifier(opensgid_settings["geometry_column"])
    ballot_query = """
        SELECT
            vistaid,
            precinctid,
            subprecinctid,
            effectivedate,
            rcvddate,
            aliasname,
            comments,
            ST_AsBinary(ST_Transform({geometry_column}, 26912)) AS geometry
        FROM {table_name}
        WHERE countyid = %(county_num)s
    """.format(
        geometry_column=geometry_column_sql,
        table_name=table_sql,
    )

    print(
        "Loading ballot areas from OpenSGID table {}".format(opensgid_settings["table"])
    )
    with create_engine(opensgid_settings["url"]).connect() as postgis_connection:
        ballot_areas = gpd.read_postgis(
            ballot_query,
            postgis_connection,
            geom_col="geometry",
            crs=TARGET_CRS,
            params={"county_num": int(county_num)},
        )

    return ballot_areas


def spatially_join_residences(residences, ballot_areas):
    if residences.empty:
        return residences

    return gpd.sjoin(
        residences,
        ballot_areas,
        how="left",
        predicate="intersects",
    )


def normalize_output_value(value):
    if value is None or pd.isna(value):
        return ""

    if isinstance(value, pd.Timestamp):
        value = value.to_pydatetime()

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")

    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time()).strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    if isinstance(value, Decimal):
        if value == value.to_integral_value():
            return int(value)
        return str(value)

    if hasattr(value, "item"):
        value = value.item()

    return value


def format_output_record(row):
    parts = ["{"]
    for index, (output_name, source_name) in enumerate(OUTPUT_FIELDS):
        value = normalize_output_value(row.get(source_name))
        serialized_value = json.dumps(
            value if output_name != "ResidenceID" else int(value)
        )
        parts.append("{}:{}".format(json.dumps(output_name), serialized_value))
        if index < len(OUTPUT_FIELDS) - 1:
            parts.append(",")

    parts.append(" },")
    return "".join(parts)


def write_output(export_file, joined_rows):
    export_path = Path(export_file)
    export_path.parent.mkdir(parents=True, exist_ok=True)

    with export_path.open("a+", encoding="utf-8", newline="") as outfile:
        for _, row in joined_rows.iterrows():
            outfile.write(format_output_record(row))


def main(argv=None):
    argv = argv or sys.argv
    db_instance, connection_directory, export_file, county_num, raw_residence_ids = (
        parse_cli_args(argv)
    )
    residence_ids = parse_residence_ids(raw_residence_ids)
    config = load_config(connection_directory)
    vistadb_url = get_vistadb_url(config, db_instance)
    opensgid_settings = get_opensgid_settings(config)

    residences = fetch_residences(vistadb_url, county_num, residence_ids)
    ballot_areas = fetch_ballot_areas(opensgid_settings, county_num)
    joined_rows = spatially_join_residences(residences, ballot_areas)
    write_output(export_file, joined_rows)


if __name__ == "__main__":
    main()
