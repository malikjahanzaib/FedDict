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
  const [uploading, setUploading] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'selected' or 'all'
  const [selectAll, setSelectAll] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortField, setSortField] = useState('term');

  // Get auth credentials from localStorage
  const authCredentials = localStorage.getItem('authCredentials');

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        sort_field: sortField,
        sort_order: sortOrder
      });
      
      const response = await fetch(`${API_BASE_URL}/terms/?${queryParams}`, {
        headers: {
          'Authorization': `Basic ${localStorage.getItem('authCredentials')}`
        }
      });
      const data = await response.json();
      
      setTerms(data.items || []);
      setTotalPages(data.pages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('Failed to load terms');
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortField, sortOrder]);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(csv|json)$/)) {
      toast.error('Please upload a CSV or JSON file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      console.log('Uploading file:', file.name); // Debug log

      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${localStorage.getItem('authCredentials')}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      // Show detailed results
      if (data.results) {
        toast.info(`Processed: ${data.results.processed}
          Success: ${data.results.success}
          Failed: ${data.results.failed}`);
        
        // Show errors if any
        if (data.results.errors?.length > 0) {
          data.results.errors.forEach(error => {
            toast.warning(error);
          });
        }
      } else {
        toast.success(data.message || 'File uploaded successfully!');
      }

      // Refresh terms list after a short delay
      setTimeout(() => fetchTerms(), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cleanup-duplicates`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${localStorage.getItem('authCredentials')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to cleanup duplicates');
      }

      toast.success(data.message);
      fetchTerms(); // Refresh the terms list
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error(error.message || 'Failed to cleanup duplicates');
    }
  };

  const handleTermSelect = (termId) => {
    const newSelected = new Set(selectedTerms);
    if (newSelected.has(termId)) {
      newSelected.delete(termId);
    } else {
      newSelected.add(termId);
    }
    setSelectedTerms(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTerms(new Set());
    } else {
      const newSelected = new Set(terms.map(term => term.id));
      setSelectedTerms(newSelected);
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async (password, phrase) => {
    if (deleteType === 'selected' && selectedTerms.size === 0) {
      toast.error('No terms selected');
      return;
    }

    try {
      let response;
      if (deleteType === 'all') {
        if (phrase !== 'DELETE ALL TERMS') {
          toast.error('Please type the confirmation phrase exactly as shown');
          return;
        }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const confirmCode = `CONFIRM_DELETE_ALL_${today}`;
        
        response = await fetch(`${API_BASE_URL}/admin/delete-all?confirmation=${confirmCode}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${btoa(`admin:${password}`)}`
          }
        });

        if (response.status === 401) {
          toast.error('Incorrect admin password');
          return;
        }
      } else {
        response = await fetch(`${API_BASE_URL}/admin/bulk-delete`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${localStorage.getItem('authCredentials')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ term_ids: Array.from(selectedTerms) })
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Delete failed');
      }

      toast.success(data.message);
      setSelectedTerms(new Set());
      setSelectAll(false);
      fetchTerms();
    } catch (error) {
      console.error('Delete error:', error);
      // Don't show the 401 error in toast since we handled it above
      if (!error.message.includes('401')) {
        toast.error(error.message || 'Failed to delete terms');
      }
    } finally {
      setShowDeleteConfirm(false);
      setDeleteType(null);
      setDeleteConfirmPassword('');
      setDeleteConfirmPhrase('');
    }
  };

  const Pagination = () => {
    const [jumpToPage, setJumpToPage] = useState('');

    const handleJumpToPage = (e) => {
      e.preventDefault();
      const page = parseInt(jumpToPage);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setJumpToPage('');
      } else {
        toast.error(`Please enter a page number between 1 and ${totalPages}`);
      }
    };

    return (
      <div className="flex items-center justify-between mt-4 space-x-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Last
          </button>
        </div>
        <form onSubmit={handleJumpToPage} className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            className="w-20 px-2 py-1 border rounded"
            placeholder="Page #"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go
          </button>
        </form>
      </div>
    );
  };

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

  const BulkUpload = () => (
    <div className="mb-8 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Bulk Upload Terms</h3>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {uploading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Upload CSV or JSON file with columns: term, definition, category
      </p>
    </div>
  );

  const DeleteConfirmModal = () => {
    // Move these state declarations to the parent component (outside the modal)
    const [localPassword, setLocalPassword] = useState('');
    const [localPhrase, setLocalPhrase] = useState('');

    const handleClose = () => {
      setShowDeleteConfirm(false);
      setDeleteType(null);
      setLocalPassword('');
      setLocalPhrase('');
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-md w-full" 
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h3>
          {deleteType === 'all' ? (
            <>
              <p className="mb-4 text-gray-700">
                You are about to delete ALL terms from the database. This action cannot be undone.
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your admin password:
                  </label>
                  <input
                    type="password"
                    value={localPassword}
                    onChange={(e) => setLocalPassword(e.target.value)}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Admin password"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type "DELETE ALL TERMS" to confirm:
                  </label>
                  <input
                    type="text"
                    value={localPhrase}
                    onChange={(e) => setLocalPhrase(e.target.value)}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="DELETE ALL TERMS"
                    autoComplete="off"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete {selectedTerms.size} selected terms? This action cannot be undone.
            </p>
          )}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleBulkDelete(localPassword, localPhrase);
                handleClose();
              }}
              disabled={deleteType === 'all' && (localPhrase !== 'DELETE ALL TERMS' || !localPassword)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

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

      <div className="mb-6">
        <div className="flex space-x-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="term">Sort by Term</option>
              <option value="category">Sort by Category</option>
              <option value="definition">Sort by Definition</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border rounded hover:bg-gray-100"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

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
        <div className="flex items-center justify-between mb-4 bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Select All on This Page</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setDeleteType('selected');
                setShowDeleteConfirm(true);
              }}
              disabled={selectedTerms.size === 0}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Delete Selected ({selectedTerms.size})
            </button>
            <button
              onClick={() => {
                setDeleteType('all');
                setShowDeleteConfirm(true);
              }}
              className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800"
            >
              Delete All Terms
            </button>
          </div>
        </div>
        
        {terms.map((term) => (
          <div key={term.id} className="border p-4 rounded-lg hover:bg-gray-50">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedTerms.has(term.id)}
                onChange={() => handleTermSelect(term.id)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-grow">
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
            </div>
          </div>
        ))}
      </div>

      {!loading && terms.length > 0 && <Pagination />}

      <StatsDisplay />
      <BulkUpload />

      <button
        onClick={handleCleanupDuplicates}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
      >
        Clean Up Duplicates
      </button>

      {showDeleteConfirm && <DeleteConfirmModal />}
    </div>
  );
}

export default AdminPage; 