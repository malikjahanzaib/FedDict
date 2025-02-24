import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import { toast } from 'react-toastify';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      setShowSuggestions(true);
      await fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchSuggestions = async (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/terms/suggestions?search=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchTerm(suggestion.term);
    setShowSuggestions(false);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/terms/?search=${encodeURIComponent(suggestion.term)}&page=1`
      );
      const data = await response.json();
      
      if (response.ok && data.items.length > 0) {
        onSearch(data);
      } else {
        toast.error('No terms found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search terms');
    }
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
    <div className="search-container relative w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={() => searchTerm && setShowSuggestions(true)}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Search terms..."
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.term}
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

export default SearchBar; 