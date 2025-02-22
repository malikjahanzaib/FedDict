import React, { useState, useEffect } from 'react';
import { searchTerms, getCategories } from '../services/api';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => setError('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchTerms = async () => {
      try {
        const results = await searchTerms(searchQuery, selectedCategory);
        setTerms(results);
        setError(null);
      } catch (err) {
        setError('Failed to load terms');
        setTerms([]);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchTerms, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  // Debounced search for suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const results = await searchTerms(searchQuery);
          setSuggestions(results.map(r => r.term));
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        {error}. Please make sure the backend server is running.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search terms..."
          className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSearchQuery(suggestion);
                  setSuggestions([]);
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-8">
        <select
          className="mt-4 p-2 rounded-lg border border-gray-300"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : terms.length === 0 ? (
        <div className="text-center text-gray-600">
          No terms found. Try adjusting your search.
        </div>
      ) : (
        <div className="space-y-4">
          {terms.map((term) => (
            <div
              key={term.id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-bold text-gray-900">{term.term}</h3>
              <span className="inline-block px-3 py-1 mt-2 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
                {term.category}
              </span>
              <p className="mt-2 text-gray-600">{term.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchPage; 