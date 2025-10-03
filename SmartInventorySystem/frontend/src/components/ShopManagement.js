import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ShopManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockOperation, setStockOperation] = useState('receive');
  const [stockAmount, setStockAmount] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    initialQuantity: '',
    colors: '',
    sizes: '',
    barcode: '',
    category: '',
    supplier: '',
    reorderThreshold: 2
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/items');
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(items.map(item => item.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStockOperation = async () => {
    if (!stockAmount || stockAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const endpoint = stockOperation === 'receive' ? 'receive' : 'sell';
      const response = await axios.put(`/api/items/${selectedItem._id}/${endpoint}`, {
        amount: parseInt(stockAmount),
        note: stockNote
      });

      setItems(items.map(item =>
        item._id === selectedItem._id ? response.data : item
      ));

      setShowStockModal(false);
      setStockAmount('');
      setStockNote('');
      setSelectedItem(null);
      alert(`${stockOperation === 'receive' ? 'Stock received' : 'Stock sold'} successfully!`);
    } catch (error) {
      console.error('Stock operation error:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.initialQuantity) {
      alert('Please fill required fields');
      return;
    }

    try {
      const itemData = {
        ...newItem,
        price: parseFloat(newItem.price),
        cost: parseFloat(newItem.cost) || 0,
        initialQuantity: parseInt(newItem.initialQuantity),
        soldQuantity: 0,
        quantity: parseInt(newItem.initialQuantity),
        colors: newItem.colors ? newItem.colors.split(',').map(c => c.trim()) : [],
        sizes: newItem.sizes ? newItem.sizes.split(',').map(s => s.trim()) : [],
        reorderThreshold: parseInt(newItem.reorderThreshold) || 2
      };

      const response = await axios.post('/api/items', itemData);
      setItems([...items, response.data]);
      setShowAddItemModal(false);
      setNewItem({
        name: '',
        description: '',
        price: '',
        cost: '',
        initialQuantity: '',
        colors: '',
        sizes: '',
        barcode: '',
        category: '',
        supplier: '',
        reorderThreshold: 2
      });
      alert('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const getStockStatus = (item) => {
    const remaining = item.remainingQuantity || item.quantity;
    if (remaining === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (remaining <= (item.reorderThreshold || 2)) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (remaining <= 10) return { status: 'Medium', color: 'bg-blue-100 text-blue-800' };
    return { status: 'Good', color: 'bg-green-100 text-green-800' };
  };

  const totalValue = filteredItems.reduce((sum, item) => {
    const remaining = item.remainingQuantity || item.quantity;
    return sum + (remaining * item.price);
  }, 0);

  const lowStockItems = filteredItems.filter(item => {
    const remaining = item.remainingQuantity || item.quantity;
    return remaining <= (item.reorderThreshold || 2) && remaining > 0;
  });

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading shop data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-primary-800">🏪 Complete Shop Management</h2>
          <p className="text-gray-600 mt-1">Manage your entire shop inventory with detailed tracking</p>
        </div>
        <button
          onClick={() => setShowAddItemModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add New Item</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800">Total Items</h3>
          <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800">Total Value</h3>
          <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800">Low Stock Items</h3>
          <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-semibold text-red-800">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredItems.filter(item => (item.remainingQuantity || item.quantity) === 0).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search items by name, description, barcode, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gradient-primary text-white">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">Item Details</th>
              <th className="py-3 px-4 text-left font-semibold">Stock Info</th>
              <th className="py-3 px-4 text-left font-semibold">Variants</th>
              <th className="py-3 px-4 text-left font-semibold">Supplier</th>
              <th className="py-3 px-4 text-left font-semibold">Status</th>
              <th className="py-3 px-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => {
              const stockStatus = getStockStatus(item);
              return (
                <tr
                  key={item._id}
                  className={`hover:bg-primary-50 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="py-4 px-4 border-b border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                      <div className="text-sm font-medium text-secondary-600 mt-1">
                        ${item.price.toFixed(2)} | Barcode: {item.barcode || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-200">
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Initial:</span> {item.initialQuantity}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Sold:</span> {item.soldQuantity}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Remaining:</span> {item.remainingQuantity || item.quantity}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-200">
                    <div className="space-y-1">
                      {item.colors && item.colors.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Colors:</span> {item.colors.join(', ')}
                        </div>
                      )}
                      {item.sizes && item.sizes.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Sizes:</span> {item.sizes.join(', ')}
                        </div>
                      )}
                      {(!item.colors || item.colors.length === 0) && (!item.sizes || item.sizes.length === 0) && (
                        <span className="text-gray-500 text-sm">No variants</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-200 text-gray-600">
                    {item.supplier || 'N/A'}
                  </td>
                  <td className="py-4 px-4 border-b border-gray-200">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-200">
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setStockOperation('receive');
                          setShowStockModal(true);
                        }}
                        className="btn-primary text-xs px-3 py-1 mr-1"
                      >
                        Receive Stock
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setStockOperation('sell');
                          setShowStockModal(true);
                        }}
                        className="btn-secondary text-xs px-3 py-1"
                        disabled={(item.remainingQuantity || item.quantity) === 0}
                      >
                        Sell Stock
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
          <p className="text-gray-500">Try adjusting your search or category filter.</p>
        </div>
      )}

      {/* Stock Operation Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {stockOperation === 'receive' ? 'Receive Stock' : 'Sell Stock'} - {selectedItem.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
                className="w-full p-2 border rounded"
                min="1"
                max={stockOperation === 'sell' ? (selectedItem.remainingQuantity || selectedItem.quantity) : undefined}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Note (Optional)</label>
              <textarea
                value={stockNote}
                onChange={(e) => setStockNote(e.target.value)}
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="Add a note about this stock operation..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStockOperation}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                {stockOperation === 'receive' ? 'Receive' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({...newItem, cost: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Initial Qty *</label>
                  <input
                    type="number"
                    value={newItem.initialQuantity}
                    onChange={(e) => setNewItem({...newItem, initialQuantity: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Colors (comma separated)</label>
                  <input
                    type="text"
                    value={newItem.colors}
                    onChange={(e) => setNewItem({...newItem, colors: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Red, Blue, Green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={newItem.sizes}
                    onChange={(e) => setNewItem({...newItem, sizes: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="S, M, L, XL"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Barcode</label>
                  <input
                    type="text"
                    value={newItem.barcode}
                    onChange={(e) => setNewItem({...newItem, barcode: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Supplier</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Reorder Threshold</label>
                <input
                  type="number"
                  value={newItem.reorderThreshold}
                  onChange={(e) => setNewItem({...newItem, reorderThreshold: e.target.value})}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopManagement;
