import React, { useEffect, useState } from 'react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching customers:', err);
        setCustomers([]);
        setLoading(false);
      });
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name) {
      alert('Please enter customer name');
      return;
    }

    const customerData = { ...newCustomer };

    if (editingCustomer) {
      // Update existing customer
      fetch(`/api/customers/${editingCustomer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })
      .then(res => res.json())
      .then(updatedCustomer => {
        setCustomers(customers.map(customer => customer._id === editingCustomer._id ? updatedCustomer : customer));
        setNewCustomer({ name: '', email: '', phone: '', address: '' });
        setShowForm(false);
        setEditingCustomer(null);
      })
      .catch(err => console.error('Error updating customer:', err));
    } else {
      // Add new customer
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })
      .then(res => res.json())
      .then(data => {
        setCustomers([...customers, data]);
        setNewCustomer({ name: '', email: '', phone: '', address: '' });
        setShowForm(false);
        setEditingCustomer(null);
      })
      .catch(err => console.error('Error adding customer:', err));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer({ ...newCustomer, [name]: value });
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setShowForm(true);
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      .then(() => {
        setCustomers(customers.filter(customer => customer._id !== id));
      })
      .catch(err => console.error('Error deleting customer:', err));
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading customers...</span>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="card fade-in">
        <div className="mb-6">
          <button onClick={() => setShowForm(false)} className="btn-secondary mb-4">← Back to Customers</button>
        </div>
        <form onSubmit={handleSubmitCustomer} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} required className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" value={newCustomer.email} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input type="tel" name="phone" value={newCustomer.phone} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea name="address" value={newCustomer.address} onChange={handleInputChange} rows="3" className="w-full p-2 border rounded" />
          </div>
          <button type="submit" className="btn-primary w-full">{editingCustomer ? 'Update Customer' : 'Add Customer'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-accent-800">👥 Customer Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Customers: <span className="font-semibold text-accent-600">{filteredCustomers.length}{searchTerm && ` (filtered from ${customers.length})`}</span>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center space-x-2">
            <span>+</span>
            <span>Add Customer</span>
          </button>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No customers yet</h3>
          <p className="text-gray-500">Start by adding your first customer.</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No customers match your search</h3>
          <p className="text-gray-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gradient-accent text-white">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Name</th>
                <th className="py-4 px-6 text-left font-semibold">Email</th>
                <th className="py-4 px-6 text-left font-semibold">Phone</th>
                <th className="py-4 px-6 text-left font-semibold">Address</th>
                <th className="py-4 px-6 text-left font-semibold">Total Purchases</th>
                <th className="py-4 px-6 text-left font-semibold">Joined</th>
                <th className="py-4 px-6 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr
                  key={customer._id}
                  className={`hover:bg-accent-50 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="py-4 px-6 border-b border-gray-200 font-medium text-gray-900">{customer.name}</td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{customer.email || '-'}</td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{customer.phone || '-'}</td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">{customer.address || '-'}</td>
                  <td className="py-4 px-6 border-b border-gray-200 font-semibold text-secondary-600">
                    ${customer.totalPurchases ? customer.totalPurchases.toFixed(2) : '0.00'}
                  </td>
                  <td className="py-4 px-6 border-b border-gray-200 text-gray-600">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 border-b border-gray-200">
                    <button onClick={() => handleEditCustomer(customer)} className="btn-secondary text-xs px-2 py-1 mb-2 mr-2">Edit</button>
                    <button onClick={() => handleDeleteCustomer(customer._id)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Delete</button>
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

export default Customers;
