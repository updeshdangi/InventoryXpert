# Inventory Management Enhancement TODO

- [x] Update Item.js model to include colors, sizes, initialQuantity, soldQuantity, and virtual remainingQuantity
- [x] Update routes/items.js to handle new fields in POST/PATCH and add receive/sell endpoints
- [x] Update Inventory.js to display new fields and add forms for adding items and updating stock
- [x] Add edit functionality to Inventory.js for updating existing items
- [x] Add search functionality to Inventory.js for filtering items by name, description, category, or barcode
- [x] Move report functionality from Inventory component to separate Reports component accessible via nav bar
- [x] Implement customer management system with CRUD operations (add, view, edit, delete customers)
- [x] Add AI-powered Demand & Sales Prediction feature
  - [x] Create Python AI service with Flask
  - [x] Implement ARIMA model for sales forecasting
  - [x] Add sample sales data
  - [x] Create backend routes to call AI service
  - [x] Update frontend Reports component to show AI predictions

- [x] Implement Automated Stock Reordering with AI
  - [x] Add reorderThreshold field to Item model (default: 2 units)
  - [x] Create AI reorder alerts endpoint that analyzes stock levels and predictions
  - [x] Add email functionality for reorder alerts
  - [x] Update frontend to display reorder alerts and send email notifications
