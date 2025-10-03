import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Inventory({ items: propItems }) {
  const [items, setItems] = useState(propItems || []);
  const [loading, setLoading] = useState(!propItems);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    initialQuantity: '',
    colors: '',
    sizes: '',
    barcode: '',
    category: ''
  });
  const [receiveAmounts, setReceiveAmounts] = useState({});
  const [sellAmounts, setSellAmounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    if (propItems) {
      setItems(Array.isArray(propItems) ? propItems : []);
      setLoading(false);
    } else {
      fetch('/api/items')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
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

    // Fetch reorder alerts
    fetchReorderAlerts();
  }, [propItems]);

  const fetchReorderAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await axios.get('http://localhost:5000/api/ai/reorder-alerts');
      if (response.data.success) {
        setReorderAlerts(response.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching reorder alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleSendReorderEmail = async () => {
    if (reorderAlerts.length === 0) return;

    try {
      const response = await axios.post('http://localhost:5000/api/ai/send-reorder-email', {
        alerts: reorderAlerts,
        email: 'devanshdangi24@gmail.com'
      });

      if (response.data.success) {
        alert('Reorder alert email sent successfully!');
      } else {
        alert('Failed to send email. Please check configuration.');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      alert('Failed to send email. Please check your email configuration.');
    }
  };

  const handleSubmitItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.initialQuantity) {
      alert('Please fill required fields');
      return;
    }

    const itemData = {
      ...newItem,
      price: parseFloat(newItem.price),
      initialQuantity: parseInt(newItem.initialQuantity),
      colors: newItem.colors ? newItem.colors.split(',').map(c => c.trim()) : [],
      sizes: newItem.sizes ? newItem.sizes.split(',').map(s => s.trim()) : []
    };

    if (editingItem) {
      // Update existing item
      fetch(`/api/items/${editingItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })
      .then(res => res.json())
      .then(updatedItem => {
        setItems(items.map(item => item._id === editingItem._id ? updatedItem : item));
        setNewItem({ name: '', description: '', price: '', initialQuantity: '', colors: '', sizes: '', barcode: '', category: '' });
        setShowForm(false);
        setEditingItem(null);
      })
      .catch(err => console.error('Error updating item:', err));
    } else {
      // Add new item
      itemData.soldQuantity = 0;
      itemData.quantity = parseInt(newItem.initialQuantity);

      fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })
      .then(res => res.json())
      .then(data => {
        setItems([...items, data]);
        setNewItem({ name: '', description: '', price: '', initialQuantity: '', colors: '', sizes: '', barcode: '', category: '' });
        setShowForm(false);
        setEditingItem(null);
      })
      .catch(err => console.error('Error adding item:', err));
    }
  };

  const handleReceiveStock = (id, amount) => {
    if (!amount || amount <= 0) return;

    fetch(`/api/items/${id}/receive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseInt(amount) })
    })
    .then(res => res.json())
    .then(updatedItem => {
      setItems(items.map(item => item._id === id ? updatedItem : item));
      setReceiveAmounts({ ...receiveAmounts, [id]: '' });
    })
    .catch(err => console.error('Error receiving stock:', err));
  };

  const handleSellStock = (id, amount) => {
    if (!amount || amount <= 0) return;

    fetch(`/api/items/${id}/sell`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseInt(amount) })
    })
    .then(res => res.json())
    .then(updatedItem => {
      setItems(items.map(item => item._id === id ? updatedItem : item));
      setSellAmounts({ ...sellAmounts, [id]: '' });
    })
    .catch(err => console.error('Error selling stock:', err));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      cost: item.cost ? item.cost.toString() : '',
      initialQuantity: item.initialQuantity.toString(),
      colors: item.colors ? item.colors.join(', ') : '',
      sizes: item.sizes ? item.sizes.join(', ') : '',
      barcode: item.barcode || '',
      category: item.category || ''
    });
    setShowForm(true);
  };

  const filteredItems = (Array.isArray(items) ? items : []).filter(item =>
    item && item.name && (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const handleExport = () => {
    const headers = ['Name', 'Description', 'Price', 'Colors', 'Sizes', 'Initial Qty', 'Sold Qty', 'Remaining', 'Category', 'Barcode'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        `"${item.description || ''}"`,
        item.price,
        `"${item.colors ? item.colors.join('; ') : ''}"`,
        `"${item.sizes ? item.sizes.join('; ') : ''}"`,
        item.initialQuantity,
        item.soldQuantity,
        item.remainingQuantity || item.quantity,
        `"${item.category || ''}"`,
        `"${item.barcode || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    link.style.visibility('hidden');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="card fade-in">
        <div className="mb-6">
          <button onClick={() => setShowForm(false)} className="btn-secondary mb-4">← Back to Inventory</button>
        </div>
        <form onSubmit={handleSubmitItem} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input type="text" name="name" value={newItem.name} onChange={handleInputChange} required className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <input type="text" name="description" value={newItem.description} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Price *</label>
            <input type="number" name="price" value={newItem.price} onChange={handleInputChange} step="0.01" required className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Cost</label>
            <input type="number" name="cost" value={newItem.cost} onChange={handleInputChange} step="0.01" className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Initial Quantity *</label>
            <input type="number" name="initialQuantity" value={newItem.initialQuantity} onChange={handleInputChange} required className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Colors (comma separated)</label>
            <input type="text" name="colors" value={newItem.colors} onChange={handleInputChange} placeholder="Red, Blue, Green" className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Sizes (comma separated)</label>
            <input type="text" name="sizes" value={newItem.sizes} onChange={handleInputChange} placeholder="S, M, L" className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Barcode</label>
            <input type="text" name="barcode" value={newItem.barcode} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Category</label>
            <input type="text" name="category" value={newItem.category} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <button type="submit" className="btn-primary w-full">{editingItem ? 'Update Item' : 'Add Item'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-primary-800">📦 Inventory Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Items: <span className="font-semibold text-primary-600">{filteredItems.length}{searchTerm && ` (filtered from ${items.length})`}</span>
          </div>
          {reorderAlerts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                🚨 {reorderAlerts.length} Reorder Alerts
              </span>
              <button
                onClick={handleSendReorderEmail}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center space-x-2"
              >
                <span>📧</span>
                <span>Send Email Alert</span>
              </button>
            </div>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center space-x-2">
            <span>+</span>
            <span>Add Item</span>
          </button>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          <button onClick={handleExport} className="bg-accent-600 hover:bg-accent-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-opacity-50 flex items-center space-x-2">
            <span>📊</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Reorder Alerts Section */}
      {reorderAlerts.length > 0 && !loadingAlerts && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border-l-4 border-red-400">
            <h3 className="text-lg font-semibold text-red-800 mb-2">🚨 AI Reorder Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reorderAlerts.slice(0, 6).map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  alert.risk_level === 'high' ? 'bg-red-50 border-red-200' :
                  alert.risk_level === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                      alert.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.risk_level.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{alert.product_name}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Stock: <span className="font-medium">{alert.current_stock}</span> / Threshold: {alert.threshold}</p>
                    <p>Days left: <span className="font-medium">{alert.days_until_reorder}</span></p>
                    <p>Recommend: <span className="font-medium">{alert.recommended_order_quantity} units</span></p>
                    <p className="text-xs text-gray-600">{alert.alert_message}</p>
                  </div>
                </div>
              ))}
            </div>
            {reorderAlerts.length > 6 && (
              <div className="text-center mt-4">
                <button
                  onClick={fetchReorderAlerts}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Show All {reorderAlerts.length} Alerts
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {loadingAlerts && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-600">Loading AI reorder alerts...</span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No items in inventory</h3>
          <p className="text-gray-500">Start by scanning barcodes or adding items manually.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No items match your search</h3>
          <p className="text-gray-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gradient-primary text-white">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Name</th>
                <th className="py-4 px-6 text-left font-semibold">Description</th>
                <th className="py-4 px-6 text-left font-semibold">Price</th>
                <th className="py-4 px-6 text-left font-semibold">Colors</th>
                <th className="py-4 px-6 text-left font-semibold">Sizes</th>
                <th className="py-4 px-6 text-left font-semibold">Initial Qty</th>
                <th className="py-4 px-6 text-left font-semibold">Sold Qty</th>
                <th className="py-4 px-6 text-left font-semibold">Remaining</th>
                <th className="py-4 px-6 text-left font-semibold">Category</th>
                <th className="py-4 px-6 text-left font-semibold">Barcode</th>
                <th className="py-4 px-6 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr
                  key={item._id || item.barcode}
                  className={`hover:bg-primary-50 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="py-4 px-6 border-b border-gray-200 font-medium text-gray-900">{item.name}</td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{item.description}</td>
                  <td className="py-4 px-6 border-b border-gray-200 font-semibold text-secondary-600">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{item.colors ? item.colors.join(', ') : ''}</td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{item.sizes ? item.sizes.join(', ') : ''}</td>
                  <td className="py-4 px-6 border-b border-gray-200 font-semibold text-primary-600">{item.initialQuantity}</td>
                  <td className="py-4 px-6 border-b border-gray-200 font-semibold text-accent-600">{item.soldQuantity}</td>
                  <td className="py-4 px-6 border-b border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.remainingQuantity > 10
                        ? 'bg-secondary-100 text-secondary-800'
                        : item.remainingQuantity > 0
                        ? 'bg-accent-100 text-accent-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.remainingQuantity || item.quantity}
                    </span>
                  </td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{item.category}</td>
                  <td className="py-4 px-6 border-b border-gray-200 font-mono text-sm text-gray-500">{item.barcode}</td>
                  <td className="py-4 px-6 border-b border-gray-200">
                    <button onClick={() => handleEditItem(item)} className="btn-secondary text-xs px-2 py-1 mb-2">Edit</button>
                    <div className="space-y-2">
                      <div>
                        <input
                          type="number"
                          placeholder="Receive"
                          value={receiveAmounts[item._id] || ''}
                          onChange={(e) => setReceiveAmounts({ ...receiveAmounts, [item._id]: e.target.value })}
                          className="w-20 p-1 border rounded text-sm"
                          min="1"
                        />
                        <button
                          onClick={() => handleReceiveStock(item._id, receiveAmounts[item._id])}
                          className="ml-1 btn-primary text-xs px-2 py-1"
                        >
                          Receive
                        </button>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Sell"
                          value={sellAmounts[item._id] || ''}
                          onChange={(e) => setSellAmounts({ ...sellAmounts, [item._id]: e.target.value })}
                          className="w-20 p-1 border rounded text-sm"
                          min="1"
                          max={item.remainingQuantity || item.quantity}
                        />
                        <button
                          onClick={() => handleSellStock(item._id, sellAmounts[item._id])}
                          className="ml-1 btn-secondary text-xs px-2 py-1"
                          disabled={!(item.remainingQuantity || item.quantity) > 0}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Inventory;
