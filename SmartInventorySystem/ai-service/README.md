# AI Demand Prediction Service

This is a Python Flask-based AI service that provides demand and sales prediction for the Smart Inventory System using machine learning models.

## Features

- **ARIMA Time Series Forecasting**: Uses ARIMA (AutoRegressive Integrated Moving Average) model for accurate sales predictions
- **Fallback Moving Average**: If ARIMA fails, uses simple moving average as backup
- **RESTful API**: Clean REST endpoints for easy integration
- **Sample Data**: Includes pre-generated sample sales data for testing

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd SmartInventorySystem/ai-service
pip install -r requirements.txt
```

### 2. Run the AI Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

### 3. Test the API

#### Health Check
```bash
curl http://localhost:5001/health
```

#### Get Predictions for All Products
```bash
curl "http://localhost:5001/api/all_predictions?days=7"
```

#### Get Predictions for Specific Product
```bash
curl "http://localhost:5001/api/predictions?product_id=prod_001&days=7"
```

## API Endpoints

### GET /health
Returns service health status.

**Response:**
```json
{
  "status": "AI Service running",
  "model": "ARIMA + Moving Average"
}
```

### GET /api/predictions
Get predictions for a specific product.

**Parameters:**
- `product_id` (required): Product ID to forecast
- `days` (optional): Number of days to forecast (default: 7)

**Response:**
```json
{
  "product_id": "prod_001",
  "predictions": [
    {
      "date": "2024-09-15",
      "predicted_quantity": 8,
      "method": "arima"
    }
  ],
  "avg_prediction": 7.5,
  "confidence": "medium"
}
```

### GET /api/all_predictions
Get predictions for all products.

**Parameters:**
- `days` (optional): Number of days to forecast (default: 7)

**Response:**
```json
{
  "days": 7,
  "predictions": {
    "prod_001": {
      "predictions": [...],
      "avg_prediction": 7.5
    }
  },
  "total_products": 10
}
```

## Sample Data

The service includes sample sales data for 10 products over 20 days:

- **Rice 5kg** (prod_001) - Food category
- **Wheat Flour 2kg** (prod_002) - Food category
- **Milk 1L** (prod_004) - Dairy category
- And 7 more products...

Data includes seasonal patterns, weekend boosts, and realistic sales volumes.

## Integration with Main Application

The AI service is integrated with the Node.js backend through `/api/ai` routes:

- `GET /api/ai/predictions` - Get all predictions
- `GET /api/ai/predictions/:productId` - Get predictions for specific product
- `GET /api/ai/health` - Check AI service health

## Model Details

### ARIMA Model
- **Order**: (1,1,1) - AutoRegressive, Differencing, Moving Average
- **Training**: Uses historical sales data to learn patterns
- **Forecasting**: Predicts future sales based on learned patterns

### Fallback Strategy
If ARIMA model fails to converge:
- Uses 3-day moving average
- Provides reliable but less accurate predictions
- Ensures service availability

## Future Enhancements

- **LSTM Models**: For more complex pattern recognition
- **External Data Integration**: Weather, holidays, economic indicators
- **Real-time Learning**: Update models with new sales data
- **Multiple Algorithms**: Ensemble predictions from different models
- **Product Recommendations**: Suggest optimal stock levels

## Troubleshooting

### Service Not Starting
- Ensure Python 3.8+ is installed
- Check if port 5001 is available
- Verify all dependencies are installed

### Poor Predictions
- Check if sample data is loaded correctly
- Ensure sufficient historical data (minimum 10 data points)
- Try different ARIMA orders in the code

### Integration Issues
- Verify Node.js backend can reach `localhost:5001`
- Check CORS settings in Flask app
- Ensure axios is installed in backend

## Dependencies

- Flask: Web framework
- Flask-CORS: Cross-origin resource sharing
- pandas: Data manipulation
- numpy: Numerical operations
- scikit-learn: Machine learning utilities
- statsmodels: Statistical modeling (ARIMA)
- pymongo: MongoDB connection (for future real data integration)
- python-dotenv: Environment variable management
- joblib: Model serialization
