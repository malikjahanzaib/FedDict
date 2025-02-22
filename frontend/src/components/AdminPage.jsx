import React, { useState, useEffect } from 'react';
import { createTerm, getTerms, deleteTerm, updateTerm } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [terms, setTerms] = useState([]);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    term: '',
    definition: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const data = await getTerms();
      setTerms(data);
      setError(null);
    } catch (err) {
      setError('Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        await updateTerm(editingTerm.id, formData);
      } else {
        await createTerm(formData);
      }
      setFormData({ term: '', definition: '', category: '' });
      setEditingTerm(null);
      fetchTerms();
      alert(editingTerm ? 'Term updated successfully!' : 'Term added successfully!');
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        alert('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        alert(error.message || 'Error saving term');
      }
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      term: term.term,
      definition: term.definition,
      category: term.category
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this term?')) {
      try {
        await deleteTerm(id);
        fetchTerms();
        alert('Term deleted successfully!');
      } catch (error) {
        alert('Error deleting term');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (error) {
    return <div className="text-red-600 text-center mt-8">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">
            {editingTerm ? 'Edit Term' : 'Add New Term'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Term</label>
              <input
                type="text"
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Definition</label>
              <textarea
                name="definition"
                value={formData.definition}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows="4"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingTerm ? 'Update Term' : 'Add Term'}
              </button>
              {editingTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTerm(null);
                    setFormData({ term: '', definition: '', category: '' });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Terms List Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Manage Terms</h2>
          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : (
            <div className="space-y-4">
              {terms.map((term) => (
                <div
                  key={term.id}
                  className="border p-4 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{term.term}</h3>
                      <span className="inline-block px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded">
                        {term.category}
                      </span>
                      <p className="mt-2 text-gray-600">{term.definition}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(term)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage; 