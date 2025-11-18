const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get predictions for a specific product
router.get('/predictions/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const days = req.query.days || 7;

    const aiServiceUrl = `http://localhost:5001/api/predictions?product_id=${productId}&days=${days}`;

    const response = await axios.get(aiServiceUrl, { timeout: 10000 });

    res.json({
      success: true,
      productId: productId,
      predictions: response.data.predictions,
      avgPrediction: response.data.avg_prediction,
      confidence: response.data.confidence,
      method: response.data.method
    });
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'AI prediction service unavailable',
      message: error.message
    });
  }
});

// Get predictions for all products
router.get('/predictions', async (req, res) => {
  try {
    const days = req.query.days || 7;

    const aiServiceUrl = `http://localhost:5001/api/all_predictions?days=${days}`;

    const response = await axios.get(aiServiceUrl, { timeout: 15000 });

    res.json({
      success: true,
      days: response.data.days,
      predictions: response.data.predictions,
      totalProducts: response.data.total_products
    });
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'AI prediction service unavailable',
      message: error.message
    });
  }
});

// Get reorder alerts
router.get('/reorder-alerts', async (req, res) => {
  try {
    // First get current inventory data
    const Item = require('../models/Item');
    const inventory = await Item.find({}).select('_id name initialQuantity soldQuantity reorderThreshold');

    // Compute remaining quantity and filter items where remaining quantity is 5 or below
    const alerts = inventory.map(item => ({
      ...item,
      remainingQuantity: item.initialQuantity - item.soldQuantity
    })).filter(item => item.remainingQuantity <= 5).map(item => ({
      product_name: item.name,
      current_stock: item.remainingQuantity,
      threshold: 5, // Fixed threshold of 5
      days_until_reorder: Math.max(0, Math.floor(item.remainingQuantity / 2)), // Mock calculation
      recommended_order_quantity: Math.max(10, 5 * 2), // Based on threshold of 5
      risk_level: item.remainingQuantity === 0 ? 'high' : item.remainingQuantity <= 2 ? 'medium' : 'low',
      alert_message: `Stock is low for ${item.name}. Current stock: ${item.remainingQuantity}. Consider reordering soon.`
    }));

    res.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error('Reorder alerts error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Unable to generate reorder alerts',
      message: error.message,
      alerts: []
    });
  }
});

// Send reorder alert email
router.post('/send-reorder-email', async (req, res) => {
  try {
    const { alerts, email } = req.body;

    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
      return res.status(400).json({ success: false, error: 'No alerts provided' });
    }

    const nodemailer = require('nodemailer');

    // Create transporter (you'll need to configure this with your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    // Generate email content
    const emailContent = generateReorderEmailContent(alerts);

    const mailOptions = {
      from: process.env.EMAIL_USER || 'inventory-system@company.com',
      to: email || 'manager@company.com',
      subject: `🚨 Inventory Reorder Alert - ${alerts.length} items need attention`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Reorder alert email sent to ${email || 'manager@company.com'}`,
      alertsProcessed: alerts.length
    });

  } catch (error) {
    console.error('Email sending error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error.message
    });
  }
});

function generateReorderEmailContent(alerts) {
  const highPriority = alerts.filter(a => a.risk_level === 'high');
  const mediumPriority = alerts.filter(a => a.risk_level === 'medium');
  const lowPriority = alerts.filter(a => a.risk_level === 'low');

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626; text-align: center;">🚨 Inventory Reorder Alert</h1>
      <p style="font-size: 16px; color: #374151;">
        The following items require your attention for reordering:
      </p>

      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #dc2626; margin-top: 0;">📊 Summary</h2>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Total Alerts:</strong> ${alerts.length}</li>
          <li><strong>High Priority:</strong> ${highPriority.length}</li>
          <li><strong>Medium Priority:</strong> ${mediumPriority.length}</li>
          <li><strong>Low Priority:</strong> ${lowPriority.length}</li>
        </ul>
      </div>
  `;

  if (highPriority.length > 0) {
    html += `
      <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <h3 style="color: #dc2626; margin-top: 0;">🚨 HIGH PRIORITY - Immediate Action Required</h3>
        ${highPriority.map(alert => `
          <div style="background: white; padding: 10px; margin: 10px 0; border-radius: 4px;">
            <strong>${alert.product_name}</strong><br>
            Current Stock: ${alert.current_stock} | Threshold: ${alert.threshold}<br>
            Days until reorder: ${alert.days_until_reorder}<br>
            Recommended order: ${alert.recommended_order_quantity} units<br>
            <em>${alert.alert_message}</em>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (mediumPriority.length > 0) {
    html += `
      <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0;">
        <h3 style="color: #d97706; margin-top: 0;">⚠️ MEDIUM PRIORITY - Monitor Closely</h3>
        ${mediumPriority.map(alert => `
          <div style="background: white; padding: 10px; margin: 10px 0; border-radius: 4px;">
            <strong>${alert.product_name}</strong><br>
            Current Stock: ${alert.current_stock} | Threshold: ${alert.threshold}<br>
            Days until reorder: ${alert.days_until_reorder}<br>
            Recommended order: ${alert.recommended_order_quantity} units
          </div>
        `).join('')}
      </div>
    `;
  }

  html += `
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #0369a1;">
          <strong>Generated by AI-Powered Inventory System</strong><br>
          This alert was generated using machine learning predictions and current stock levels.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
        <p>This is an automated message from your Smart Inventory System.</p>
        <p>Please take appropriate action to maintain optimal stock levels.</p>
      </div>
    </div>
  `;

  return html;
}

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/health', { timeout: 5000 });
    res.json({
      success: true,
      aiService: response.data
    });
  } catch (error) {
    res.json({
      success: false,
      aiService: 'unavailable',
      error: error.message
    });
  }
});

module.exports = router;
