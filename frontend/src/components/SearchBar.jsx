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
    
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      await fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchSuggestions = async (value) => {
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching suggestions for: "${value}" from ${API_BASE_URL}/terms/suggestions`);
      
      const response = await fetch(`${API_BASE_URL}/terms/suggestions?search=${encodeURIComponent(value)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Suggestions received:', data);
        
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
    <form onSubmit={handleSubmit} className="search-container relative w-full">
      <div className="flex">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => searchTerm.trim().length >= 2 && fetchSuggestions(searchTerm)}
          className="w-full p-3 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onMouseDown={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.term}
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-20 top-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </form>
  );
}

export default SearchBar; 