import React, { useState, useEffect } from 'react';
import { searchTerms, getCategories, getTerms, API_BASE_URL } from '../services/api';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isServerLoading, setIsServerLoading] = useState(true);

  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [termsResponse, categoriesData] = await Promise.all([
          getTerms(),
          getCategories()
        ]);
        setTerms(termsResponse.items || []);
        setTotalPages(termsResponse.pages || 1);
        setCategories(categoriesData || []);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load initial data. Please try again later.');
        setTerms([]);
        setCategories([]);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        let response;
        if (debouncedSearchQuery || selectedCategory) {
          response = await searchTerms(debouncedSearchQuery, selectedCategory, currentPage);
        } else {
          response = await getTerms(currentPage);
        }
        setTerms(response.items || []);
        setTotalPages(response.pages || 1);
        setError(null);
      } catch (error) {
        console.error('Search error:', error);
        setError('Search failed. Please try again.');
        setTerms([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedSearchQuery, selectedCategory, currentPage]);

  // Debounced search for suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await searchTerms(searchQuery);
          // Make sure we're getting items from the paginated response
          setSuggestions(response.items.map(r => r.term));
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  // Add initial health check
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          setIsServerLoading(false);
        }
      } catch (error) {
        console.error('Server warming up:', error);
      }
    };
    checkServer();
  }, []);

  // Show warming up message during cold start
  if (isServerLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Server is warming up, please wait...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  // Add pagination controls to the UI
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

  // Update category selection handler
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page when changing category
  };

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        {error}
        <div className="mt-2 text-sm">
          Backend URL: {API_BASE_URL} {/* Debug info */}
        </div>
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
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {isSearching ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : terms.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
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

      <Pagination />
    </div>
  );
}

export default SearchPage; 