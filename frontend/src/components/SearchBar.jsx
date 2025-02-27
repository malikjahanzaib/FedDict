import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

function SearchBar({ 
  onSearch, 
  categories = [], 
  selectedCategory = '', 
  setSelectedCategory = null,
  sortField = null,
  setSortField = null,
  sortOrder = null,
  setSortOrder = null,
  isAdmin = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    // For non-admin search, call onSearch directly
    // For admin search, this is handled by the debounced function in the parent
    if (!isAdmin) {
      onSearch(value);
    }
  };

  const fetchSuggestions = async (value) => {
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `${API_BASE_URL}/terms/suggestions?search=${encodeURIComponent(value)}`,
        { 
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } else {
        console.error('Error fetching suggestions:', await response.text());
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.term);
    setShowSuggestions(false);
    onSearch(suggestion.term);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
    setShowSuggestions(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="search-container relative mb-4">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onBlur={() => isAdmin && onSearch(searchTerm)}
            className="w-full p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search terms..."
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Search
          </button>
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id || index}
                className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.term}
              </div>
            ))}
          </div>
        )}
        
        {loading && (
          <div className="absolute right-20 top-2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </form>

      {/* Only show these options for admin search */}
      {isAdmin && setSelectedCategory && setSortField && setSortOrder && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="term">Term</option>
              <option value="category">Category</option>
              <option value="created">Date Created</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar; 