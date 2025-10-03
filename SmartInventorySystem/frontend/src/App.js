import React, { useState, useEffect } from 'react';
import './App.css';
import Inventory from './components/Inventory';
import ShopManagement from './components/ShopManagement';
import BarcodeScanner from './components/BarcodeScanner';
import Reports from './components/Reports';
import Customers from './components/Customers';

function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [scannedCode, setScannedCode] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    // Fetch inventory items from backend API
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => setInventoryItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching items:', err);
        setInventoryItems([]);
      });
  }, []);

  useEffect(() => {
    console.log('scannedCode changed:', scannedCode);
    // When a barcode is scanned, check if item exists and add to inventoryItems state
    if (scannedCode) {
      console.log('Processing scanned code:', scannedCode);
      const existingItem = inventoryItems.find(item => item.barcode === scannedCode);
      console.log('Existing item:', existingItem);
      if (!existingItem) {
        // Try to fetch item details from backend by barcode first
        fetch(`/api/items/barcode/${encodeURIComponent(scannedCode)}`)
          .then(res => {
            if (res.status === 200) {
              return res.json();
            } else {
              // If not found, create new item
              return null;
            }
          })
          .then(itemData => {
            if (itemData) {
              // Item found, add to inventory
              setInventoryItems(prevItems => [...prevItems, itemData]);
            } else {
              // Item not found, create new with default values
              const newItem = {
                name: 'Scanned Item',
                description: 'Item added via barcode scan',
                price: 0,
                quantity: 1,
                barcode: scannedCode,
                category: 'Unknown',
              };
              // Save to backend
              fetch('/api/items', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(newItem),
              })
                .then(res => {
                  console.log('POST response status:', res.status);
                  return res.json();
                })
                .then(savedItem => {
                  console.log('Saved item:', savedItem);
                  setInventoryItems(prevItems => [...prevItems, savedItem]);
                })
                .catch(err => {
                  console.error('Error saving item:', err);
                  // Still add to state even if save fails
                  setInventoryItems(prevItems => [...prevItems, { ...newItem, _id: scannedCode }]);
                });
            }
          })
          .catch(err => {
            console.error('Error fetching item by barcode:', err);
          });
      }
    }
  }, [scannedCode, inventoryItems]);

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <Inventory items={inventoryItems} />;
      case 'shop':
        return <ShopManagement />;
      case 'billing':
        return (
          <div className="card fade-in">
            <h2 className="text-3xl font-bold text-primary-800 mb-4">💰 Billing</h2>
            <p className="text-gray-600 mb-6">Create bills and scan barcodes for quick checkout.</p>
            <BarcodeScanner onScan={setScannedCode} />
            {scannedCode && (
              <div className="mt-4 p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
                <p className="text-secondary-800 font-medium">Scanned Code: <span className="font-mono">{scannedCode}</span></p>
              </div>
            )}
          </div>
        );
      case 'customers':
        return <Customers />;
      case 'reports':
        return <Reports items={inventoryItems} />;
      default:
        return (
          <div className="card fade-in">
            <h2 className="text-3xl font-bold text-primary-800 mb-4">🏠 Dashboard</h2>
            <p className="text-gray-600">Welcome to Smart Inventory System. Manage your inventory, billing, and customers efficiently.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <h3 className="font-semibold text-primary-800">Total Items</h3>
                <p className="text-2xl font-bold text-primary-600">{inventoryItems.length}</p>
              </div>
              <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                <h3 className="font-semibold text-secondary-800">Active Bills</h3>
                <p className="text-2xl font-bold text-secondary-600">0</p>
              </div>
              <div className="bg-accent-50 p-4 rounded-lg border border-accent-200">
                <h3 className="font-semibold text-accent-800">Customers</h3>
                <p className="text-2xl font-bold text-accent-600">0</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen fade-in">
      <header className="bg-gradient-primary text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">🏪</div>
            <div>
              <h1 className="text-4xl font-bold text-gradient">UPDESH THAKUR</h1>
              <p className="mt-1 text-primary-100 text-lg">Intelligent Inventory Management & Billing Solution</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary-200 text-sm">It's My </p>
            <p className="text-primary-300 text-xs">Major Project</p>
          </div>
        </div>
      </header>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'inventory'
                    ? 'bg-primary-600 text-white shadow-md transform scale-105'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                📦 Inventory
              </button>
              <button
                onClick={() => setActiveTab('shop')}
                className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'shop'
                    ? 'bg-green-600 text-white shadow-md transform scale-105'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                🏪 Shop Management
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'billing'
                    ? 'bg-secondary-600 text-white shadow-md transform scale-105'
                    : 'text-gray-700 hover:bg-secondary-50 hover:text-secondary-600'
                }`}
              >
                💰 Billing
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'customers'
                    ? 'bg-accent-600 text-white shadow-md transform scale-105'
                    : 'text-gray-700 hover:bg-accent-50 hover:text-accent-600'
                }`}
              >
                👥 Customers
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'reports'
                    ? 'bg-primary-700 text-white shadow-md transform scale-105'
                    : 'text-gray-700 hover:bg-primary-100 hover:text-primary-700'
                }`}
              >
                📊 Reports
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 slide-up">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
