"""Regression tests guarding food-dataset quality (per-100g, Atwater-consistent).

Pure stdlib (csv) so it runs anywhere, independent of the ML stack.
"""

import csv
import os

_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "Diet_Plan_Model")
_FOODS = os.path.join(_ROOT, "cleaned_foods_dataset.csv")
_SNACKS = os.path.join(_ROOT, "cleaned_snacks_dataset.csv")


def _rows(path):
    with open(path, encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def _atwater(r):
    return (4 * float(r["Carbohydrates (g)"]) + 4 * float(r["Protein (g)"])
            + 9 * float(r["Fat (g)"]) - 2 * float(r["Fiber (g)"]))


def test_datasets_are_atwater_consistent_and_per_100g():
    for path in (_FOODS, _SNACKS):
        rows = _rows(path)
        assert rows, f"{path} is empty"
        for r in rows:
            cal = float(r["Calories"])
            # Stored calories match the fiber-adjusted Atwater formula.
            assert abs(_atwater(r) - cal) <= 1.0, f"{r['Food Name']}: inconsistent calories"
            # No physically impossible rows (calories but no macros).
            macros = (float(r["Carbohydrates (g)"]), float(r["Fat (g)"]), float(r["Protein (g)"]))
            assert any(m > 0 for m in macros), f"{r['Food Name']}: all macros zero"
            # Per-100g sanity: nothing above ~750 kcal/100g (pure oil is ~884; we have none).
            assert 10 <= cal <= 750, f"{r['Food Name']}: calories {cal}/100g out of range"


def test_meal_type_coverage():
    from collections import Counter
    counts = Counter(r["Meal_Type"] for r in _rows(_FOODS))
    for meal in ("Breakfast", "Lunch", "Dinner"):
        assert counts.get(meal, 0) >= 8, f"too few {meal} items"
    assert all(r["Meal_Type"] == "Snack" for r in _rows(_SNACKS))
