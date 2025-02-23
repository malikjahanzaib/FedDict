import React, { useState, useEffect, useCallback } from 'react';
import { createTerm, getTerms, deleteTerm, updateTerm, API_BASE_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function AdminPage() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    term: '',
    definition: '',
    category: ''
  });
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  // Get auth credentials from localStorage
  const authCredentials = localStorage.getItem('authCredentials');

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTerms(currentPage);
      setTerms(response.items || []);
      setTotalPages(response.pages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('Failed to load terms');
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Basic ${authCredentials}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to fetch database stats');
    }
  };

  useEffect(() => {
    if (!authCredentials) {
      navigate('/login');
      return;
    }
    fetchTerms();
    fetchStats();
  }, [fetchTerms, authCredentials, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!formData.term.trim()) {
        toast.error('Term cannot be empty');
        return;
      }
      if (formData.definition.trim().length < 10) {
        toast.error('Definition must be at least 10 characters');
        return;
      }
      if (!formData.category.trim()) {
        toast.error('Category cannot be empty');
        return;
      }

      // Clean form data
      const cleanedData = {
        term: formData.term.trim(),
        definition: formData.definition.trim(),
        category: formData.category.trim()
      };

      if (selectedTerm) {
        await updateTerm(selectedTerm.id, cleanedData);
        toast.success('Term updated successfully');
      } else {
        await createTerm(cleanedData);
        toast.success('Term created successfully');
      }
      setFormData({ term: '', definition: '', category: '' });
      setSelectedTerm(null);
      fetchTerms();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save term');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this term?')) {
      try {
        await deleteTerm(id);
        toast.success('Term deleted successfully');
        fetchTerms();
      } catch (error) {
        console.error('Error:', error);
        toast.error(error.message || 'Failed to delete term');
      }
    }
  };

  const handleEdit = (term) => {
    setSelectedTerm(term);
    setFormData({
      term: term.term,
      definition: term.definition,
      category: term.category
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const Pagination = () => (
    <div className="flex justify-center mt-4 space-x-2">
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-300"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-300"
      >
        Next
      </button>
    </div>
  );

  const StatsDisplay = () => stats && (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-2">Database Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p>Storage Used: {stats.size_mb}MB / {stats.storage_limit_mb}MB</p>
          <p>Usage: {stats.usage_percentage}%</p>
          <p>Total Documents: {stats.document_count}</p>
        </div>
        {stats.usage_percentage > 80 && (
          <div className="text-red-600">
            Warning: Approaching storage limit!
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {selectedTerm ? 'Edit Term' : 'Add New Term'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Term</label>
          <input
            type="text"
            name="term"
            value={formData.term}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Definition</label>
          <textarea
            name="definition"
            value={formData.definition}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="4"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {selectedTerm ? 'Update Term' : 'Add Term'}
          </button>
          {selectedTerm && (
            <button
              type="button"
              onClick={() => {
                setSelectedTerm(null);
                setFormData({ term: '', definition: '', category: '' });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {terms.map((term) => (
          <div key={term.id} className="border p-4 rounded-lg hover:bg-gray-50">
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

      {!loading && terms.length > 0 && <Pagination />}

      <StatsDisplay />
    </div>
  );
}

export default AdminPage; 