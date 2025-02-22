const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://feddict-api.onrender.com';

let authCredentials = null;

export function setAuthCredentials(username, password) {
  authCredentials = btoa(`${username}:${password}`);
}

export function clearAuthCredentials() {
  authCredentials = null;
}

export async function getTerms() {
  try {
    const response = await fetch(`${API_BASE_URL}/terms/`, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    console.log('Terms Response:', response);
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch terms');
    }
    const data = await response.json();
    console.log('Terms Data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Failed to fetch terms');
  }
}

export async function searchTerms(search = '', category = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE_URL}/terms/?${params}`);
  if (!response.ok) throw new Error('Failed to search terms');
  return await response.json();
}

export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    console.log('Categories Response:', response);
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    console.log('Categories Data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Failed to fetch categories');
  }
}

export async function verifyAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-auth/`, {
      headers: {
        'Authorization': `Basic ${authCredentials}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'authenticated';
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function createTerm(termData) {
  const response = await fetch(`${API_BASE_URL}/terms/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authCredentials}`
    },
    body: JSON.stringify(termData),
  });
  
  if (response.status === 401) {
    throw new Error('Unauthorized - Please log in again');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create term');
  }
  
  return await response.json();
}

export async function updateTerm(id, termData) {
  const response = await fetch(`${API_BASE_URL}/terms/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authCredentials}`
    },
    body: JSON.stringify(termData),
  });
  if (!response.ok) throw new Error('Failed to update term');
  return await response.json();
}

export async function deleteTerm(id) {
  const response = await fetch(`${API_BASE_URL}/terms/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${authCredentials}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete term');
} 