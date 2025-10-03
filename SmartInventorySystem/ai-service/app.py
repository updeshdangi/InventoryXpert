from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from statsmodels.tsa.arima.model import ARIMA
import joblib
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load sample data
def load_sample_data():
    with open('sample_sales_data.json', 'r') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    return df

# Train ARIMA model for a product
def train_model_for_product(df_product, order=(1,1,1)):
    if len(df_product) < 10:
        # If not enough data, use simple moving average
        df_product['quantity_sold'] = df_product['quantity_sold'].rolling(window=3, min_periods=1).mean()
        predictions = df_product['quantity_sold'].iloc[-1:].repeat(7).tolist()
        return predictions, "moving_average"
    
    try:
        model = ARIMA(df_product['quantity_sold'], order=order)
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=7)
        return forecast.tolist(), "arima"
    except:
        # Fallback to moving average
        df_product['quantity_sold'] = df_product['quantity_sold'].rolling(window=3, min_periods=1).mean()
        predictions = df_product['quantity_sold'].iloc[-1:].repeat(7).tolist()
        return predictions, "moving_average"

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    product_id = request.args.get('product_id')
    days = int(request.args.get('days', 7))
    
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    df = load_sample_data()
    product_data = df[df['product_id'] == product_id]
    
    if product_data.empty:
        return jsonify({"error": "No data found for this product"}), 404
    
    # Resample to daily if needed (assuming daily data)
    product_data = product_data.set_index('date').resample('D').sum().reset_index()
    product_data = product_data.dropna()
    
    predictions, method = train_model_for_product(product_data)
    
    # Generate dates for predictions
    last_date = product_data['date'].max()
    prediction_dates = [(last_date + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(days)]
    
    result = {
        "product_id": product_id,
        "predictions": [
            {
                "date": date,
                "predicted_quantity": int(round(pred)),
                "method": method
            }
            for date, pred in zip(prediction_dates, predictions)
        ],
        "avg_prediction": round(np.mean(predictions), 2),
        "confidence": "medium" if method == "arima" else "low"
    }
    
    return jsonify(result)

@app.route('/api/all_predictions', methods=['GET'])
def get_all_predictions():
    days = int(request.args.get('days', 7))
    df = load_sample_data()
    products = df['product_id'].unique()
    
    all_predictions = {}
    
    for prod_id in products:
        product_data = df[df['product_id'] == prod_id]
        product_data = product_data.set_index('date').resample('D').sum().reset_index()
        product_data = product_data.dropna()
        
        predictions, method = train_model_for_product(product_data)
        last_date = product_data['date'].max()
        prediction_dates = [(last_date + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(days)]
        
        all_predictions[prod_id] = {
            "predictions": [
                {
                    "date": date,
                    "predicted_quantity": int(round(pred))
                }
                for date, pred in zip(prediction_dates, predictions)
            ],
            "avg_prediction": round(np.mean(predictions), 2)
        }
    
    return jsonify({
        "days": days,
        "predictions": all_predictions,
        "total_products": len(products)
    })

@app.route('/api/reorder-alerts', methods=['POST'])
def get_reorder_alerts():
    """Generate reorder alerts based on current stock and AI predictions"""
    try:
        data = request.get_json()
        inventory_data = data.get('inventory', [])

        alerts = []

        for item in inventory_data:
            product_id = item.get('_id') or item.get('id')
            current_stock = item.get('remainingQuantity', item.get('quantity', 0))
            threshold = item.get('reorderThreshold', 2)
            product_name = item.get('name', f'Product {product_id}')

            # Get AI predictions for this product
            predictions = []
            risk_level = "low"
            days_until_reorder = 30  # Default high value

            try:
                # Try to get predictions from our sample data
                df = load_sample_data()
                product_data = df[df['product_id'] == product_id]

                if not product_data.empty:
                    pred_result, method = train_model_for_product(product_data)
                    predictions = [{"day": i+1, "predicted_sales": int(round(pred))} for i, pred in enumerate(pred_result)]
                    avg_daily_sales = sum(pred for pred in pred_result) / len(pred_result)

                    # Calculate days until reorder needed
                    if avg_daily_sales > 0:
                        days_until_reorder = current_stock / avg_daily_sales

                        # Determine risk level
                        if days_until_reorder <= 3:
                            risk_level = "high"
                        elif days_until_reorder <= 7:
                            risk_level = "medium"
                        else:
                            risk_level = "low"
                else:
                    # No historical data, use simple threshold check
                    if current_stock <= threshold:
                        risk_level = "high"
                        days_until_reorder = 1

            except Exception as e:
                # Fallback to simple threshold check
                if current_stock <= threshold:
                    risk_level = "high"
                    days_until_reorder = 1

            # Generate alert if needed
            if current_stock <= threshold or risk_level in ["high", "medium"]:
                alert = {
                    "product_id": product_id,
                    "product_name": product_name,
                    "current_stock": current_stock,
                    "threshold": threshold,
                    "risk_level": risk_level,
                    "days_until_reorder": round(days_until_reorder, 1),
                    "recommended_order_quantity": max(10, int(avg_daily_sales * 7) if 'avg_daily_sales' in locals() else 10),
                    "predictions": predictions[:7],  # Next 7 days
                    "alert_message": generate_alert_message(risk_level, days_until_reorder, current_stock, threshold)
                }
                alerts.append(alert)

        # Sort by risk level (high first)
        risk_order = {"high": 0, "medium": 1, "low": 2}
        alerts.sort(key=lambda x: risk_order.get(x["risk_level"], 3))

        return jsonify({
            "success": True,
            "alerts": alerts,
            "total_alerts": len(alerts),
            "high_priority": len([a for a in alerts if a["risk_level"] == "high"]),
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "alerts": [],
            "total_alerts": 0
        }), 500

def generate_alert_message(risk_level, days_until_reorder, current_stock, threshold):
    """Generate appropriate alert message based on risk level"""
    if risk_level == "high":
        if days_until_reorder <= 1:
            return f"🚨 CRITICAL: Stock critically low! Only {current_stock} units remaining. Reorder immediately!"
        else:
            return f"🚨 HIGH RISK: Stock running low. {days_until_reorder:.1f} days until reorder needed."
    elif risk_level == "medium":
        return f"⚠️ MEDIUM RISK: Monitor stock closely. {days_until_reorder:.1f} days until reorder needed."
    else:
        return f"ℹ️ LOW RISK: Stock adequate but below threshold. Consider reordering soon."

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Service running", "model": "ARIMA + Moving Average + Reorder Alerts"})

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
