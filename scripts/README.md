# Script Utilities

## UpdatePrecinctID.py

`UpdatePrecinctID.py` exports precinct information for one county and one or more residence IDs. The script preserves the legacy command-line interface and writes records in the same JSON-like output format used by the ArcPy version.

### Environment

Install Miniconda: <https://repo.anaconda.com/miniconda/>

- all users
- clear package cache upon completion

Add the following to the system PATH:

- `C:\ProgramData\miniconda3`
- `C:\ProgramData\miniconda3\Scripts`
- `C:\ProgramData\miniconda3\Library\bin`

Run `conda init` and restart the terminal to enable `conda activate` commands.

Create the Conda environment from the `scripts\` directory using the environment file:

```bash
conda env create -f environment.yml
conda activate vista-precinct
```

If the environment already exists and `environment.yml` changes, update it with:

```bash
conda env update -f environment.yml --prune
```

The environment uses `conda-forge` for the geospatial stack.

### Tracer Bullet

Use the tracer bullet script to verify that the environment can import all required libraries and connect to both databases before running the full precinct export:

```bash
python trace_update_precinct_id.py dev .\connections
```

The tracer script checks:

- imports for `geopandas`, `oracledb`, `pandas`, `psycopg`, `pyproj`, `pytest`, `shapely`, and `sqlalchemy`
- an Oracle `SELECT 1 FROM dual`
- a PostGIS `postgis_version()` query
- a one-row probe against the configured ballot-area table

### Command-Line Interface

The script keeps the same positional arguments as the original implementation:

```bash
python UpdatePrecinctID.py <db_instance> <connection_directory> <export_file> <county_num> <residence_ids>
```

Example:

```bash
python UpdatePrecinctID.py dev .\connections .\test.json 5 103659758,241232647,183503633,1210072,448721614
```

Arguments:

- `db_instance`: Oracle instance key to read from the config file, for example `dev`.
- `connection_directory`: directory that contains the sidecar config file.
- `export_file`: output file path. The script appends records to this file.
- `county_num`: county identifier used in the Oracle residence query.
- `residence_ids`: comma-separated residence IDs.

If not enough arguments are provided, the script prompts for the missing values interactively.

### Configuration

The script no longer reads `.sde` files. Instead, it loads a JSON config file named `update_precinct_id.config.json` from the supplied `connection_directory`.

Place that file in the connections folder that you pass on the command line. Use `connections/update_precinct_id.config.example.json` as the starting template for the sidecar config file.

Expected config shape:

```json
{
  "vistadb": {
    "instances": {
      "dev": {
        "url": "oracle+oracledb://oracle_username:oracle_password@oracle-host:1521/?service_name=ORACLE_SERVICE_NAME"
      }
    }
  },
  "opensgid": {
    "url": "postgresql+psycopg://postgis_username:postgis_password@postgis-host:5432/postgis_database",
    "table": "political.vista_ballot_areas",
    "geometry_column": "shape"
  }
}
```

Where credentials go:

- Put the full database connection URL directly in the config file using `url`.
- The username and password are part of that URL.
- Because the credentials are stored in plain text, keep `update_precinct_id.config.json` out of source control.

Connection URL notes:

- Oracle uses the SQLAlchemy `oracle+oracledb://...` URL form.
- PostGIS uses the SQLAlchemy `postgresql+psycopg://...` URL form.
- If the password contains special characters such as `@`, `:`, or `/`, URL-encode them before putting them in the connection string.

Notes:

- Each VistaDB instance may define `url` directly in the config file.
- The OpenSGID section should define `url` directly in the config file.
- `table` defaults to `political.vista_ballot_areas`.
- `geometry_column` defaults to `shape`.

### Data Flow

The script performs these steps:

1. Parse the CLI arguments or prompt for missing values.
2. Load connection settings from `update_precinct_id.config.json`.
3. Query `GV_VISTA.RESIDENCES` in Oracle for the requested county and residence IDs.
4. Create residence point geometries in `EPSG:26912` from the `X` and `Y` columns.
5. Query ballot polygons from PostGIS and transform them to `EPSG:26912`.
6. Run a left spatial join so each residence receives the matching precinct attributes.
7. Append output records in the legacy format.

### Output

The script writes records with these fields:

- `ResidenceID`
- `FullPrecinct`
- `Precinct`
- `SubPrecinct`
- `EffectiveDate`
- `RcvdDate`
- `AliasName`
- `Comments`

The order of output records is not guaranteed.
