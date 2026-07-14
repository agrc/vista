from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import pandas as pd


MODULE_PATH = Path(__file__).with_name("check_residence_county_id.py")
SPEC = spec_from_file_location("check_residence_county_id", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
MODULE = module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_create_residence_points_uses_xy_columns_and_target_crs():
    residences = pd.DataFrame(
        {
            "RESIDENCE_ID": [123],
            "COUNTY_ID": [1],
            "X": [425000],
            "Y": [4450000],
        }
    )

    points = MODULE.create_residence_points(residences)

    assert points.crs.to_string() == "EPSG:26912"
    assert points.geometry.iloc[0].x == 425000
    assert points.geometry.iloc[0].y == 4450000


def test_prepare_output_places_audit_fields_before_remaining_source_fields():
    joined_rows = pd.DataFrame(
        {
            "RESIDENCE_ID": [123, 456],
            "COUNTY_ID": [1, 2],
            "X": [425000, 426000],
            "Y": [4450000, 4451000],
            "ADDRESS": ["1 Main St", "2 Main St"],
            "corrected_county_id": [1, None],
            "index_right": [0, None],
            "geometry": [None, None],
        }
    )

    output = MODULE.prepare_output(joined_rows)

    assert list(output.columns) == [
        "residence_id",
        "current_county_id",
        "corrected_county_id",
        "X",
        "Y",
        "ADDRESS",
    ]
    assert output.iloc[0].to_dict() == {
        "residence_id": 123,
        "current_county_id": 1,
        "corrected_county_id": 1,
        "X": 425000,
        "Y": 4450000,
        "ADDRESS": "1 Main St",
    }
    assert output.iloc[1]["residence_id"] == 456
    assert output.iloc[1]["current_county_id"] == 2
    assert pd.isna(output.iloc[1]["corrected_county_id"])
    assert output.iloc[1]["X"] == 426000
    assert output.iloc[1]["Y"] == 4451000
    assert output.iloc[1]["ADDRESS"] == "2 Main St"


def test_filter_mismatched_residences_excludes_matching_and_unmatched_records():
    output_rows = pd.DataFrame(
        {
            "residence_id": [123, 456, 789, 987],
            "current_county_id": [1, 2, 3, 2],
            "corrected_county_id": ["01", "04", None, "02"],
        }
    )

    mismatches = MODULE.filter_mismatched_residences(output_rows)

    assert mismatches.to_dict("records") == [
        {
            "residence_id": 456,
            "current_county_id": 2,
            "corrected_county_id": "04",
        }
    ]


def test_write_output_uses_csv_headers_and_blanks_for_unmatched_counties(tmp_path):
    output_rows = pd.DataFrame(
        {
            "residence_id": [123],
            "current_county_id": [1],
            "corrected_county_id": [None],
            "ADDRESS": ["1 Main St"],
        }
    )

    export_path = MODULE.write_output(tmp_path / "audit.csv", output_rows)

    assert export_path.read_text(encoding="utf-8") == (
        "residence_id,current_county_id,corrected_county_id,ADDRESS\n123,1,,1 Main St\n"
    )


def test_summarize_results_reports_matches_unmatched_and_mismatches(capsys, tmp_path):
    output_rows = pd.DataFrame(
        {
            "residence_id": [123, 456, 789],
            "current_county_id": [2, 2, 3],
            "corrected_county_id": ["02", "04", None],
        }
    )

    MODULE.summarize_results(output_rows, 29, tmp_path / "audit.csv")

    assert capsys.readouterr().out == (
        "County ID audit complete\n"
        "CSV output: {}/audit.csv\n"
        "County boundaries loaded: 29\n"
        "Residences evaluated: 3\n"
        "Residences with a county polygon match: 2\n"
        "Residences without a county polygon match: 1\n"
        "Residences with an incorrect county ID: 1\n"
    ).format(tmp_path)
