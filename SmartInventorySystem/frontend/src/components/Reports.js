import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Reports({ items: propItems }) {
  const [items, setItems] = useState(propItems || []);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(!propItems);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (propItems) {
      setItems(Array.isArray(propItems) ? propItems : []);
      setLoading(false);
    } else {
      fetch('/api/items')
        .then(res => res.json())
        .then(data => {
          setItems(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching items:', err);
          setItems([]);
          setLoading(false);
        });
    }
    fetchAIPredictions();
  }, [propItems]);

  const fetchAIPredictions = async () => {
    try {
      setAiLoading(true);
      const response = await axios.get('http://localhost:5000/api/ai/predictions');
      setPredictions(response.data.predictions || {});
    } catch (err) {
      console.error('AI predictions unavailable:', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading reports...</span>
        </div>
      </div>
    );
  }

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price * ((item.remainingQuantity || item.quantity) || 0)), 0).toFixed(2);
  const totalCost = items.reduce((sum, item) => sum + ((item.cost || 0) * ((item.remainingQuantity || item.quantity) || 0)), 0).toFixed(2);
  const lowStockItems = items.filter(item => ((item.remainingQuantity || item.quantity) || 0) < 5).length;
  const totalSoldQuantity = items.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
  const totalRevenue = items.reduce((sum, item) => sum + (item.price * (item.soldQuantity || 0)), 0).toFixed(2);
  const estimatedProfit = (parseFloat(totalRevenue) - items.reduce((sum, item) => sum + ((item.cost || 0) * (item.soldQuantity || 0)), 0)).toFixed(2);

  // AI Predictions Summary
  const totalPredictedSales = Object.values(predictions).reduce((sum, pred) => {
    return sum + pred.predictions.reduce((s, p) => s + p.predicted_quantity, 0);
  }, 0);

  return (
    <div className="card fade-in">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">📊 Inventory Report & AI Predictions</h3>
          <button onClick={fetchAIPredictions} disabled={aiLoading} className="btn-secondary flex items-center space-x-2">
            <span>🤖</span>
            <span>{aiLoading ? 'Updating AI...' : 'AI Forecast'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-lg">
            <h4 className="font-semibold text-primary-800">Total Items</h4>
            <p className="text-2xl font-bold text-primary-600">{totalItems}</p>
          </div>
          <div className="bg-secondary-50 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary-800">Total Inventory Value</h4>
            <p className="text-2xl font-bold text-secondary-600">${totalValue}</p>
          </div>
          <div className="bg-accent-50 p-4 rounded-lg">
            <h4 className="font-semibold text-accent-800">Total Cost Value</h4>
            <p className="text-2xl font-bold text-accent-600">${totalCost}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Total Sold Quantity</h4>
            <p className="text-2xl font-bold text-green-600">{totalSoldQuantity}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">Total Revenue</h4>
            <p className="text-2xl font-bold text-blue-600">${totalRevenue}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800">Estimated Profit</h4>
            <p className="text-2xl font-bold text-purple-600">${estimatedProfit}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800">Low Stock Items {'<5'}</h4>
            <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="font-semibold text-indigo-800">AI Predicted Sales (7d)</h4>
            <p className="text-2xl font-bold text-indigo-600">{totalPredictedSales}</p>
          </div>
        </div>

        {/* AI Demand Forecast Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Demand & Sales Prediction</h4>
          <p className="text-gray-600 mb-4">Forecasted sales for the next 7 days based on historical patterns using ARIMA model.</p>
          {Object.keys(predictions).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(predictions).slice(0, 6).map(([productId, pred]) => (
                <div key={productId} className="bg-white p-4 rounded-lg shadow-sm border">
                  <h5 className="font-medium text-gray-900 mb-2">Product {productId.slice(-4)}</h5>
                  <div className="space-y-2">
                    {pred.predictions.slice(0, 3).map((p, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{p.date}</span>
                        <span className="font-semibold text-purple-600">{p.predicted_quantity} units</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Avg: {pred.avg_prediction} units/day</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 text-gray-300">🤖</div>
              <p className="text-gray-500">AI predictions loading... Click "AI Forecast" to generate.</p>
            </div>
          )}
        </div>

        {lowStockItems > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Low Stock Alert</h4>
            <ul className="bg-yellow-50 p-4 rounded-lg">
              {items
                .filter(item => ((item.remainingQuantity || item.quantity) || 0) < 5)
                .map(item => (
                  <li key={item._id || item.barcode} className="text-sm text-yellow-800">
                    {item.name} - Remaining: {item.remainingQuantity || item.quantity}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
