from __future__ import annotations

import argparse
import sys

try:
    import geopandas as gpd
    import oracledb
    import pandas as pd
    import psycopg
    import pyproj
    import pytest
    import shapely
    import sqlalchemy
    from sqlalchemy import create_engine, text
except ImportError as exc:
    raise SystemExit(
        "Missing Python dependencies. Create the Conda environment from scripts/environment.yml before running this script."
    ) from exc

from UpdatePrecinctID import get_opensgid_settings, get_vistadb_url, load_config


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description=(
            "Tracer bullet for UpdatePrecinctID.py. Verifies required imports, "
            "Oracle connectivity, and PostGIS connectivity."
        )
    )
    parser.add_argument("db_instance", help="Oracle instance key, for example dev")
    parser.add_argument(
        "connection_directory",
        help="Directory containing update_precinct_id.config.json",
    )
    return parser.parse_args(argv[1:])


def get_library_versions():
    return {
        "geopandas": gpd.__version__,
        "oracledb": getattr(oracledb, "__version__", "unknown"),
        "pandas": pd.__version__,
        "psycopg": psycopg.__version__,
        "pyproj": pyproj.__version__,
        "pytest": pytest.__version__,
        "shapely": shapely.__version__,
        "sqlalchemy": sqlalchemy.__version__,
    }


def check_oracle_connection(oracle_url):
    with create_engine(oracle_url).connect() as oracle_connection:
        return oracle_connection.execute(text("SELECT 1 AS ok FROM dual")).scalar_one()


def check_postgis_connection(postgis_url, table_name):
    with create_engine(postgis_url).connect() as postgis_connection:
        postgis_version = postgis_connection.execute(
            text("SELECT postgis_version()")
        ).scalar_one()
        row_probe = postgis_connection.execute(
            text("SELECT 1 FROM {} LIMIT 1".format(table_name))
        ).first()

    return postgis_version, row_probe is not None


def main(argv=None):
    argv = argv or sys.argv
    args = parse_args(argv)

    config = load_config(args.connection_directory)
    oracle_url = get_vistadb_url(config, args.db_instance)
    postgis_settings = get_opensgid_settings(config)

    print("Import checks")
    for library_name, version in get_library_versions().items():
        print("- {} {}".format(library_name, version))

    oracle_result = check_oracle_connection(oracle_url)
    print("Oracle connection OK: SELECT 1 returned {}".format(oracle_result))

    postgis_version, postgis_has_rows = check_postgis_connection(
        postgis_settings["url"],
        postgis_settings["table"],
    )
    print("PostGIS connection OK: version {}".format(postgis_version))
    print(
        "PostGIS table probe OK: {} {} row(s)".format(
            postgis_settings["table"],
            "has" if postgis_has_rows else "has no",
        )
    )


if __name__ == "__main__":
    main()
