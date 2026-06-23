from datetime import datetime
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import pandas as pd
import pytest


MODULE_PATH = Path(__file__).with_name("UpdatePrecinctID.py")
SPEC = spec_from_file_location("update_precinct_id", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
MODULE = module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_parse_residence_ids_preserves_numeric_input_order():
    assert MODULE.parse_residence_ids("'103659758','241232647','183503633'") == [
        103659758,
        241232647,
        183503633,
    ]


def test_parse_residence_ids_rejects_non_numeric_values():
    with pytest.raises(ValueError, match="comma-separated integers"):
        MODULE.parse_residence_ids("'103659758','abc'")


def test_format_output_record_matches_legacy_fixture_shape():
    row = pd.Series(
        {
            "residence_id": 1,
            "vistaid": "051001:SD2",
            "precinctid": "1001",
            "subprecinctid": "SD2",
            "effectivedate": datetime(2025, 5, 14, 0, 0, 0),
            "rcvddate": datetime(2025, 5, 14, 0, 0, 0),
            "aliasname": "Dutch John #1 SD2",
            "comments": " ",
        }
    )

    assert (
        MODULE.format_output_record(row)
        == '{"ResidenceID":1,"FullPrecinct":"051001:SD2","Precinct":"1001","SubPrecinct":"SD2","EffectiveDate":"2025-05-14 00:00:00","RcvdDate":"2025-05-14 00:00:00","AliasName":"Dutch John #1 SD2","Comments":" " },'
    )


def test_resolve_config_path_uses_connections_folder():
    assert MODULE.resolve_config_path(r"Y:\vista\scripts\connections") == Path(
        r"Y:\vista\scripts\connections\update_precinct_id.config.json"
    )
