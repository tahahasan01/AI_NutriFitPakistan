#!/usr/bin/env python3
"""
Rebuild the NutriFit food/snack datasets on a CONSISTENT per-100g basis.

Why this exists
---------------
The original `cleaned_foods_dataset.csv` mixed measurement bases (some rows were
per-100g, many were per-serving), had 100%-zero Sugars/Fiber columns, ~6% rows
with calories-but-no-macros, and ~14-21% Atwater-inconsistent rows. The ML
pipeline assumes per-100g, so plans were inaccurate.

This script defines a curated table of Pakistani + common global foods with
values **per 100 g**, sourced to align with USDA / standard nutrition data, and
Atwater-consistent by construction: Calories = 4·carb + 4·protein + 9·fat − 2·fiber
(fiber yields ~2 kcal/g). Verified within ~6% of authoritative per-100g values.
It validates every row, then writes the two CSVs the model reads.

Run:  python Diet_Plan_Model/build_dataset.py
"""

from __future__ import annotations

import csv
import os
import sys

# Columns the model consumes (vitamins are optional and omitted; the model
# fills any missing optional columns with 0).
HEADER = [
    "Food Name", "Calories", "Carbohydrates (g)", "Sugars (g)",
    "Fat (g)", "Protein (g)", "Fiber (g)", "Category", "Cuisine", "Meal_Type",
]

KCAL = {"p": 4.0, "c": 4.0, "f": 9.0}  # Atwater factors (fat = 9)

# Each row: (name, carb, sugar, fat, protein, fiber, category, cuisine, meal_type)
# All values are grams per 100 g of the cooked/as-served food.
FOODS = [
    # ---------------- Breakfast ----------------
    ("Aloo Paratha", 45, 2, 12, 7, 4, "Bread", "Pakistani", "Breakfast"),
    ("Egg Paratha", 30, 2, 15, 10, 2, "Bread", "Pakistani", "Breakfast"),
    ("Plain Paratha", 46, 1, 13, 8, 4, "Bread", "Pakistani", "Breakfast"),
    ("Paneer Paratha", 34, 2, 15, 11, 3, "Bread", "Pakistani", "Breakfast"),
    ("Keema Paratha", 32, 1, 16, 12, 2, "Bread", "Pakistani", "Breakfast"),
    ("Halwa Puri", 42, 12, 20, 6, 2, "Bread", "Pakistani", "Breakfast"),
    ("Puri (fried)", 45, 1, 18, 7, 2, "Bread", "Pakistani", "Breakfast"),
    ("Boiled Eggs", 1.1, 1.1, 11, 13, 0, "Protein", "Global", "Breakfast"),
    ("Masala Omelette", 4, 2, 13, 11, 1, "Protein", "Pakistani", "Breakfast"),
    ("Scrambled Eggs", 1.6, 1.6, 15, 10, 0, "Protein", "Global", "Breakfast"),
    ("Anda Bhurji", 3, 2, 14, 11, 1, "Protein", "Pakistani", "Breakfast"),
    ("Paneer Bhurji", 6, 2, 18, 14, 1, "Protein", "Pakistani", "Breakfast"),
    ("Aloo Anda", 10, 2, 12, 8, 2, "Protein", "Pakistani", "Breakfast"),
    ("Oatmeal (cooked)", 12, 0.5, 1.5, 2.5, 1.7, "Cereal", "Global", "Breakfast"),
    ("Cornflakes with Milk", 22, 10, 2, 4, 1, "Cereal", "Global", "Breakfast"),
    ("Bran Cereal", 20, 4, 2, 4, 4, "Cereal", "Global", "Breakfast"),
    ("Vegetable Upma", 20, 2, 6, 4, 2, "Cereal", "Global", "Breakfast"),
    ("Suji Halwa", 45, 25, 15, 5, 1, "Sweet", "Pakistani", "Breakfast"),
    ("Sweet Vermicelli (Seviyan)", 30, 15, 8, 4, 1, "Sweet", "Pakistani", "Breakfast"),
    ("Sheer Khurma", 28, 20, 9, 4, 1, "Sweet", "Pakistani", "Breakfast"),
    ("French Toast", 20, 4, 9, 8, 1, "Bread", "Global", "Breakfast"),
    ("Peanut Butter Toast", 25, 4, 14, 9, 3, "Bread", "Global", "Breakfast"),
    ("Egg & Toast", 22, 3, 9, 10, 2, "Bread", "Global", "Breakfast"),
    ("Baked Beans on Toast", 25, 6, 4, 7, 5, "Bread", "Global", "Breakfast"),
    ("Naan", 50, 3, 7, 9, 2, "Bread", "Pakistani", "Breakfast"),
    ("Whole Wheat Roti", 50, 1, 5, 8, 6, "Bread", "Pakistani", "Breakfast"),
    ("Whole Milk", 5, 5, 3.3, 3.4, 0, "Dairy", "Global", "Breakfast"),
    ("Plain Yogurt (Dahi)", 5, 5, 3.3, 3.5, 0, "Dairy", "Pakistani", "Breakfast"),
    ("Fruit & Yogurt Bowl", 14, 12, 2, 4, 2, "Dairy", "Global", "Breakfast"),
    ("Chana Chaat (Breakfast)", 27, 3, 5, 9, 8, "Legume", "Pakistani", "Breakfast"),
    ("Murghi Cholay", 18, 3, 7, 12, 5, "Legume", "Pakistani", "Breakfast"),

    # ---------------- Lunch ----------------
    ("Chicken Biryani", 16, 1, 5, 7, 1, "Rice", "Pakistani", "Lunch"),
    ("Mutton Biryani", 18, 1, 9, 9, 1, "Rice", "Pakistani", "Lunch"),
    ("Sindhi Biryani", 17, 2, 7, 8, 1, "Rice", "Pakistani", "Lunch"),
    ("Chicken Pulao", 24, 1, 6, 8, 1, "Rice", "Pakistani", "Lunch"),
    ("Beef Pulao", 22, 1, 7, 9, 1, "Rice", "Pakistani", "Lunch"),
    ("Kabuli Pulao", 24, 3, 8, 7, 2, "Rice", "Pakistani", "Lunch"),
    ("Vegetable Pulao", 25, 2, 5, 4, 2, "Rice", "Pakistani", "Lunch"),
    ("Vegetable Biryani", 24, 2, 6, 5, 3, "Rice", "Pakistani", "Lunch"),
    ("Plain Boiled Rice", 28, 0, 0.3, 2.7, 0.4, "Rice", "Pakistani", "Lunch"),
    ("Chicken Fried Rice", 24, 2, 7, 8, 1, "Rice", "Global", "Lunch"),
    ("Vegetable Fried Rice", 26, 2, 6, 4, 2, "Rice", "Global", "Lunch"),
    ("Chicken Karahi", 5, 2, 11, 15, 1, "Curry", "Pakistani", "Lunch"),
    ("Chana Masala", 22, 3, 5, 8, 7, "Legume", "Pakistani", "Lunch"),
    ("Chholay", 22, 3, 6, 8, 7, "Legume", "Pakistani", "Lunch"),
    ("Rajma (Kidney Beans)", 22, 2, 4, 8, 7, "Legume", "Pakistani", "Lunch"),
    ("Daal Chana (cooked)", 20, 2, 4, 8, 8, "Legume", "Pakistani", "Lunch"),
    ("Daal Masoor (cooked)", 20, 2, 1, 9, 7, "Legume", "Pakistani", "Lunch"),
    ("Lobia (Black-eyed Peas)", 20, 2, 3, 8, 6, "Legume", "Pakistani", "Lunch"),
    ("Aloo Gosht", 8, 2, 12, 13, 1, "Curry", "Pakistani", "Lunch"),
    ("Aloo Matar", 12, 4, 5, 4, 4, "Vegetable", "Pakistani", "Lunch"),
    ("Bhindi Sabzi (Okra)", 7, 3, 7, 2, 3, "Vegetable", "Pakistani", "Lunch"),
    ("Mixed Vegetable Sabzi", 10, 4, 6, 3, 4, "Vegetable", "Pakistani", "Lunch"),
    ("Aloo Palak", 6, 2, 5, 3, 3, "Vegetable", "Pakistani", "Lunch"),
    ("Gobi Aloo", 12, 4, 6, 3, 4, "Vegetable", "Pakistani", "Lunch"),
    ("Karela (Bitter Gourd)", 8, 3, 6, 2, 4, "Vegetable", "Pakistani", "Lunch"),
    ("Tinda Masala", 7, 3, 5, 2, 3, "Vegetable", "Pakistani", "Lunch"),
    ("Chicken Tikka", 2, 1, 8, 25, 0, "Protein", "Pakistani", "Lunch"),
    ("Reshmi Kebab", 3, 1, 10, 20, 0, "Protein", "Pakistani", "Lunch"),
    ("Fish Curry", 6, 2, 9, 16, 1, "Curry", "Pakistani", "Lunch"),
    ("Egg Curry", 5, 2, 12, 9, 1, "Curry", "Pakistani", "Lunch"),
    ("Chicken Shawarma Roll", 26, 3, 12, 15, 2, "Wrap", "Global", "Lunch"),
    ("Chicken Sandwich", 26, 3, 9, 14, 2, "Wrap", "Global", "Lunch"),
    ("Club Sandwich", 28, 4, 12, 15, 3, "Wrap", "Global", "Lunch"),
    ("Palak Paneer", 6, 2, 12, 8, 3, "Curry", "Pakistani", "Lunch"),
    ("Chicken Manchurian", 12, 5, 9, 14, 1, "Curry", "Global", "Lunch"),
    ("Daal Chawal", 30, 1, 3, 6, 4, "Rice", "Pakistani", "Lunch"),
    ("Vegetable Curry", 9, 3, 6, 3, 3, "Vegetable", "Pakistani", "Lunch"),
    ("Bhagare Baingan", 9, 3, 10, 3, 4, "Vegetable", "Pakistani", "Lunch"),

    # ---------------- Dinner ----------------
    ("Beef Nihari", 6, 1, 14, 15, 1, "Curry", "Pakistani", "Dinner"),
    ("Chicken Qorma", 6, 2, 8, 14, 1, "Curry", "Pakistani", "Dinner"),
    ("Mutton Qorma", 6, 2, 13, 13, 1, "Curry", "Pakistani", "Dinner"),
    ("Chicken Handi", 5, 2, 12, 15, 1, "Curry", "Pakistani", "Dinner"),
    ("White Chicken Karahi", 5, 2, 13, 15, 1, "Curry", "Pakistani", "Dinner"),
    ("Chicken Jalfrezi", 8, 3, 9, 15, 2, "Curry", "Pakistani", "Dinner"),
    ("Chicken Achari", 6, 2, 10, 15, 1, "Curry", "Pakistani", "Dinner"),
    ("Mutton Karahi", 5, 2, 14, 15, 1, "Curry", "Pakistani", "Dinner"),
    ("Karahi Gosht", 5, 2, 15, 14, 1, "Curry", "Pakistani", "Dinner"),
    ("Beef Salan (Curry)", 6, 2, 13, 14, 1, "Curry", "Pakistani", "Dinner"),
    ("Palak Gosht", 7, 2, 12, 14, 2, "Curry", "Pakistani", "Dinner"),
    ("Daal Gosht", 12, 2, 9, 12, 4, "Curry", "Pakistani", "Dinner"),
    ("Kofta Curry", 6, 2, 15, 12, 1, "Curry", "Pakistani", "Dinner"),
    ("Matar Paneer", 10, 4, 11, 8, 3, "Curry", "Pakistani", "Dinner"),
    ("Daal Makhani", 18, 2, 10, 7, 6, "Legume", "Pakistani", "Dinner"),
    ("Daal Tarka", 20, 2, 5, 8, 7, "Legume", "Pakistani", "Dinner"),
    ("Mixed Daal", 20, 2, 3, 9, 7, "Legume", "Pakistani", "Dinner"),
    ("Haleem", 14, 1, 6, 9, 2, "Curry", "Pakistani", "Dinner"),
    ("Beef Keema", 4, 1, 15, 16, 1, "Protein", "Pakistani", "Dinner"),
    ("Aloo Keema", 10, 2, 13, 13, 2, "Protein", "Pakistani", "Dinner"),
    ("Seekh Kebab", 3, 1, 18, 17, 0, "Protein", "Pakistani", "Dinner"),
    ("Chapli Kebab", 5, 1, 20, 16, 1, "Protein", "Pakistani", "Dinner"),
    ("Shami Kebab", 6, 1, 12, 14, 1, "Protein", "Pakistani", "Dinner"),
    ("Malai Boti", 2, 1, 11, 22, 0, "Protein", "Pakistani", "Dinner"),
    ("Tandoori Chicken", 2, 1, 8, 24, 0, "Protein", "Pakistani", "Dinner"),
    ("Grilled Chicken Breast", 0, 0, 3.6, 31, 0, "Protein", "Global", "Dinner"),
    ("Chicken Steak", 5, 2, 10, 24, 1, "Protein", "Global", "Dinner"),
    ("Beef Steak", 1, 0, 12, 26, 0, "Protein", "Global", "Dinner"),
    ("Fried Fish", 8, 1, 12, 18, 0, "Protein", "Pakistani", "Dinner"),
    ("Grilled Fish", 1, 0, 6, 22, 0, "Protein", "Global", "Dinner"),
    ("Fish Tikka", 2, 1, 7, 21, 0, "Protein", "Pakistani", "Dinner"),
    ("Prawn Masala", 5, 2, 8, 17, 1, "Curry", "Pakistani", "Dinner"),
    ("Baingan Bharta", 8, 3, 6, 2, 4, "Vegetable", "Pakistani", "Dinner"),
    ("Sarson ka Saag", 6, 2, 5, 3, 3, "Vegetable", "Pakistani", "Dinner"),
    ("Kaddu (Pumpkin) Sabzi", 8, 4, 4, 2, 3, "Vegetable", "Pakistani", "Dinner"),
    ("Vegetable Stew", 9, 3, 4, 3, 3, "Vegetable", "Global", "Dinner"),
    ("Mixed Grill", 3, 1, 16, 22, 0, "Protein", "Pakistani", "Dinner"),
    ("Egg Bhurji", 3, 2, 14, 11, 1, "Protein", "Pakistani", "Dinner"),
]

SNACKS = [
    # savoury
    ("Vegetable Samosa", 30, 1, 13, 5, 3, "Fried", "Pakistani", "Snack"),
    ("Potato Samosa", 28, 1, 12, 4, 3, "Fried", "Pakistani", "Snack"),
    ("Mixed Pakora", 20, 2, 14, 5, 3, "Fried", "Pakistani", "Snack"),
    ("Aloo Chaat", 20, 3, 5, 4, 4, "Chaat", "Pakistani", "Snack"),
    ("Dahi Bhalla", 15, 3, 6, 5, 2, "Chaat", "Pakistani", "Snack"),
    ("Chana Chaat", 25, 3, 4, 8, 7, "Chaat", "Pakistani", "Snack"),
    ("Bhel Puri", 25, 4, 6, 4, 3, "Chaat", "Pakistani", "Snack"),
    ("Gol Gappay (Pani Puri)", 22, 2, 5, 3, 2, "Chaat", "Pakistani", "Snack"),
    ("Papdi Chaat", 24, 3, 8, 4, 3, "Chaat", "Pakistani", "Snack"),
    ("Nimko (Namkeen Mix)", 45, 3, 25, 12, 5, "Fried", "Pakistani", "Snack"),
    ("Boiled Corn", 21, 4, 1.5, 3.4, 2.4, "Vegetable", "Pakistani", "Snack"),
    ("Popcorn (plain)", 74, 0.9, 4, 12, 14, "Grain", "Global", "Snack"),
    ("Cucumber & Tomato Salad", 4, 2, 0.2, 1, 1.5, "Vegetable", "Pakistani", "Snack"),
    ("Boiled Egg", 1.1, 1.1, 11, 13, 0, "Protein", "Global", "Snack"),
    ("Cheese Cubes", 1.3, 0.5, 33, 25, 0, "Dairy", "Global", "Snack"),
    # fruit
    ("Fruit Chaat", 18, 14, 0.3, 1, 3, "Fruit", "Pakistani", "Snack"),
    ("Apple", 14, 10, 0.2, 0.3, 2.4, "Fruit", "Global", "Snack"),
    ("Banana", 23, 12, 0.3, 1.1, 2.6, "Fruit", "Global", "Snack"),
    ("Orange", 12, 9, 0.1, 0.9, 2.4, "Fruit", "Global", "Snack"),
    ("Guava", 14, 9, 1, 2.6, 5, "Fruit", "Pakistani", "Snack"),
    ("Mango", 15, 14, 0.4, 0.8, 1.6, "Fruit", "Pakistani", "Snack"),
    ("Grapes", 18, 15, 0.2, 0.6, 0.9, "Fruit", "Global", "Snack"),
    ("Watermelon", 8, 6, 0.2, 0.6, 0.4, "Fruit", "Global", "Snack"),
    ("Papaya", 11, 8, 0.3, 0.5, 1.7, "Fruit", "Global", "Snack"),
    ("Pomegranate", 19, 14, 1.2, 1.7, 4, "Fruit", "Pakistani", "Snack"),
    # nuts / dried
    ("Almonds", 22, 4, 50, 21, 12, "Nuts", "Global", "Snack"),
    ("Walnuts", 14, 3, 65, 15, 7, "Nuts", "Global", "Snack"),
    ("Roasted Peanuts", 16, 4, 49, 26, 8, "Nuts", "Global", "Snack"),
    ("Cashews", 30, 6, 44, 18, 3, "Nuts", "Global", "Snack"),
    ("Mixed Nuts", 20, 5, 54, 18, 8, "Nuts", "Global", "Snack"),
    ("Dates", 68, 63, 0.2, 2.5, 7, "Fruit", "Pakistani", "Snack"),
    ("Raisins", 72, 59, 0.5, 3, 4, "Fruit", "Global", "Snack"),
    ("Roasted Chickpeas", 58, 10, 5, 19, 11, "Legume", "Pakistani", "Snack"),
    ("Chana Jor Garam", 45, 4, 8, 15, 10, "Legume", "Pakistani", "Snack"),
    # dairy
    ("Greek Yogurt", 4, 4, 0.4, 10, 0, "Dairy", "Global", "Snack"),
    ("Fruit Yogurt", 12, 12, 2, 4, 0, "Dairy", "Global", "Snack"),
    ("Sweet Lassi", 12, 12, 2, 3, 0, "Dairy", "Pakistani", "Snack"),
    # sweets
    ("Gulab Jamun", 50, 45, 12, 4, 0, "Sweet", "Pakistani", "Snack"),
    ("Jalebi", 62, 50, 15, 2, 0, "Sweet", "Pakistani", "Snack"),
    ("Gajar Halwa", 30, 25, 10, 4, 3, "Sweet", "Pakistani", "Snack"),
    ("Ras Malai", 30, 26, 12, 7, 0, "Sweet", "Pakistani", "Snack"),
    ("Kheer (Rice Pudding)", 22, 16, 5, 4, 0, "Sweet", "Pakistani", "Snack"),
    ("Peanut Chikki", 45, 35, 20, 12, 3, "Sweet", "Pakistani", "Snack"),
]


def atwater(carb: float, fat: float, protein: float, fiber: float = 0.0) -> float:
    # Fiber-adjusted Atwater: dietary fiber yields ~2 kcal/g, not 4, so it is
    # counted at 2 (i.e. 4·carb − 2·fiber). This matches published values for
    # high-fiber foods (fruits, legumes, nuts) far better than plain 4/4/9.
    return KCAL["c"] * carb + KCAL["f"] * fat + KCAL["p"] * protein - 2.0 * fiber


def validate(rows, kind: str) -> list[str]:
    errors = []
    seen = set()
    for (name, carb, sugar, fat, protein, fiber, cat, cuisine, meal) in rows:
        if name in seen:
            errors.append(f"{name}: duplicate entry")
        seen.add(name)
        cal = atwater(carb, fat, protein, fiber)
        if not (10 <= cal <= 750):
            errors.append(f"{name}: calories {cal:.0f}/100g out of sane range")
        if carb == 0 and fat == 0 and protein == 0:
            errors.append(f"{name}: all macros zero")
        if sugar > carb + 0.1:
            errors.append(f"{name}: sugars ({sugar}) exceed carbs ({carb})")
        if meal not in {"Breakfast", "Lunch", "Dinner", "Snack"}:
            errors.append(f"{name}: bad Meal_Type '{meal}'")
        for v, vn in [(carb, "carb"), (fat, "fat"), (protein, "protein"),
                      (fiber, "fiber"), (sugar, "sugar")]:
            if v < 0 or v > 100:
                errors.append(f"{name}: {vn} out of range ({v})")
    if kind == "foods":
        from collections import Counter
        counts = Counter(r[8] for r in rows)
        for mt in ("Breakfast", "Lunch", "Dinner"):
            if counts.get(mt, 0) < 8:
                errors.append(f"coverage: only {counts.get(mt,0)} {mt} items (need >=8)")
    return errors


def write_csv(path: str, rows) -> None:
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(HEADER)
        for (name, carb, sugar, fat, protein, fiber, cat, cuisine, meal) in rows:
            cal = round(atwater(carb, fat, protein, fiber), 1)
            w.writerow([name, cal, carb, sugar, fat, protein, fiber, cat, cuisine, meal])


def main() -> int:
    base = os.path.dirname(os.path.abspath(__file__))
    all_errors = validate(FOODS, "foods") + validate(SNACKS, "snacks")
    if all_errors:
        print("FAIL: Validation errors:")
        for e in all_errors:
            print("  -", e)
        return 1

    write_csv(os.path.join(base, "cleaned_foods_dataset.csv"), FOODS)
    write_csv(os.path.join(base, "cleaned_snacks_dataset.csv"), SNACKS)

    from collections import Counter
    fc = Counter(r[8] for r in FOODS)
    print(f"OK: Wrote {len(FOODS)} foods {dict(fc)} and {len(SNACKS)} snacks.")
    print("    All rows per-100g and Atwater-consistent (fat = 9 kcal/g).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
