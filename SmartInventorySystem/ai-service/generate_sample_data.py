import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import json

def generate_sample_sales_data():
    """Generate sample sales data for AI training"""

    # Sample products
    products = [
        {"id": "prod_001", "name": "Rice 5kg", "category": "Food", "base_price": 250},
        {"id": "prod_002", "name": "Wheat Flour 2kg", "category": "Food", "base_price": 120},
        {"id": "prod_003", "name": "Sugar 1kg", "category": "Food", "base_price": 45},
        {"id": "prod_004", "name": "Milk 1L", "category": "Dairy", "base_price": 60},
        {"id": "prod_005", "name": "Bread Loaf", "category": "Bakery", "base_price": 35},
        {"id": "prod_006", "name": "Eggs 12pcs", "category": "Dairy", "base_price": 110},
        {"id": "prod_007", "name": "Cooking Oil 1L", "category": "Food", "base_price": 180},
        {"id": "prod_008", "name": "Tea 250g", "category": "Beverages", "base_price": 85},
        {"id": "prod_009", "name": "Coffee 200g", "category": "Beverages", "base_price": 150},
        {"id": "prod_010", "name": "Soap Bar", "category": "Personal Care", "base_price": 25}
    ]

    # Generate sales data for the last 6 months
    start_date = datetime.now() - timedelta(days=180)
    sales_data = []

    for i in range(180):  # 180 days
        current_date = start_date + timedelta(days=i)

        # Seasonal factors
        day_of_week = current_date.weekday()
        month = current_date.month

        # Weekend boost
        weekend_multiplier = 1.3 if day_of_week >= 5 else 1.0

        # Monthly seasonal patterns (higher sales in certain months)
        seasonal_multiplier = 1.0
        if month in [1, 2, 12]:  # Winter months - higher food sales
            seasonal_multiplier = 1.2
        elif month in [6, 7, 8]:  # Summer months - higher beverage sales
            seasonal_multiplier = 1.1

        for product in products:
            # Base sales probability
            base_probability = 0.3

            # Category-specific adjustments
            if product["category"] == "Food":
                base_probability = 0.4
            elif product["category"] == "Dairy":
                base_probability = 0.35
            elif product["category"] == "Beverages":
                base_probability = 0.25

            # Apply multipliers
            final_probability = base_probability * weekend_multiplier * seasonal_multiplier

            # Random sales quantity (0-10 units per day)
            if random.random() < final_probability:
                quantity = random.randint(1, 10)

                # Add some randomness to quantity based on product type
                if product["category"] == "Food":
                    quantity = max(1, int(quantity * 1.2))
                elif product["category"] == "Dairy":
                    quantity = max(1, int(quantity * 0.9))

                sales_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "category": product["category"],
                    "quantity_sold": quantity,
                    "unit_price": product["base_price"],
                    "total_revenue": quantity * product["base_price"],
                    "day_of_week": day_of_week,
                    "month": month,
                    "is_weekend": day_of_week >= 5
                })

    # Save to CSV and JSON
    df = pd.DataFrame(sales_data)
    df.to_csv("sample_sales_data.csv", index=False)

    # Also save as JSON for easy import
    with open("sample_sales_data.json", "w") as f:
        json.dump(sales_data, f, indent=2, default=str)

    print(f"Generated {len(sales_data)} sales records")
    print("Files saved: sample_sales_data.csv and sample_sales_data.json")

    return sales_data

if __name__ == "__main__":
    generate_sample_sales_data()
