// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

let authCredentials = localStorage.getItem('authCredentials');

export function setAuthCredentials(credentials) {
  authCredentials = credentials;
}

export function clearAuthCredentials() {
  authCredentials = null;
}

// Add error handling middleware
const handleResponse = async (response, errorMessage) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || errorMessage);
  }
  return response.json();
};

// Auth functions
export const login = async (username, password) => {
  const credentials = btoa(`${username}:${password}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    return credentials;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Term functions
export const getTerms = async (page = 1, perPage = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/?page=${page}&per_page=${perPage}`);
    if (!response.ok) {
      throw new Error('Failed to fetch terms');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }
};

export const searchTerms = async (search = '', category = '', page = 1, sortField = 'term', sortOrder = 'asc') => {
  try {
    const params = new URLSearchParams({
      page,
      search: search || '',
      category: category || '',
      sort_field: sortField,
      sort_order: sortOrder
    });
    
    const response = await fetch(`${API_BASE_URL}/terms/?${params}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

export const createTerm = async (termData, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      body: JSON.stringify(termData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create term');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create term error:', error);
    throw error;
  }
};

export const updateTerm = async (id, termData, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      body: JSON.stringify(termData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update term');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Update term error:', error);
    throw error;
  }
};

export const deleteTerm = async (id, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${authToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete term');
    }
    
    return true;
  } catch (error) {
    console.error('Delete term error:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const bulkUploadTerms = async (formData, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload terms');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Bulk upload error:', error);
    throw error;
  }
};

export const getStats = async (authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      headers: {
        'Authorization': `Basic ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Stats error:', error);
    throw error;
  }
};

export const cleanupDuplicates = async (authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/cleanup-duplicates`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to cleanup duplicates');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
};

export const bulkDeleteTerms = async (termIds, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      body: JSON.stringify({ term_ids: termIds })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete terms');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Bulk delete error:', error);
    throw error;
  }
};

export const deleteAllTerms = async (confirmation, password, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/delete-all?confirmation=${confirmation}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete all terms');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete all error:', error);
    throw error;
  }
};

// Add request timeout
const fetchWithTimeout = async (url, options, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}; 