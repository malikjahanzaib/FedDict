const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://feddict-api.onrender.com';

let authCredentials = localStorage.getItem('authCredentials');

export function setAuthCredentials(credentials) {
  authCredentials = credentials;
}

export function clearAuthCredentials() {
  authCredentials = null;
}

export { API_BASE_URL };

// Add error handling middleware
const handleResponse = async (response, errorMessage) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || errorMessage);
  }
  return response.json();
};

// Optimize API calls with better error handling
export async function getTerms(page = 1) {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/terms/?page=${page}&per_page=10`,
      {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    );
    return handleResponse(response, 'Failed to fetch terms');
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function searchTerms(search = '', category = '', page = 1) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  params.append('page', page);
  params.append('per_page', 10);
  
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/terms/?${params}`,
      {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    );
    return handleResponse(response, 'Failed to search terms');
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function getCategories() {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/categories/`,
      {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    return handleResponse(response, 'Failed to fetch categories');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export async function verifyAuth() {
  if (!authCredentials) return false;
  
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/verify-auth/`,
      {
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authCredentials}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'authenticated';
    }
    return false;
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

export const createTerm = async (termData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${localStorage.getItem('authCredentials')}`
      },
      body: JSON.stringify(termData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create term');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export async function updateTerm(id, termData) {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/terms/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authCredentials}`
        },
        body: JSON.stringify(termData),
      }
    );
    return handleResponse(response, 'Failed to update term');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export async function deleteTerm(id) {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/terms/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${authCredentials}`
        }
      }
    );
    return handleResponse(response, 'Failed to delete term');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

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