import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getTerms } from '../services/api';
import SearchBar from './SearchBar';
import SearchAndFilter from './SearchAndFilter';
import Pagination from './Pagination';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('term');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isServerLoading, setIsServerLoading] = useState(true);

  const handleSearch = async (searchValue) => {
    setSearchTerm(searchValue);
    setCurrentPage(1); // Reset to first page on new search
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage,
          search: searchTerm,
          category: selectedCategory,
          sort_field: sortField,
          sort_order: sortOrder
        });

        console.log(`Fetching from: ${API_BASE_URL}/terms/?${queryParams}`);
        const response = await fetch(`${API_BASE_URL}/terms/?${queryParams}`);
        const data = await response.json();

        if (response.ok) {
          setTerms(data.items || []);
          setTotalPages(data.pages || 1);
          if (data.categories) {
            setCategories(data.categories);
          }
        } else {
          console.error('Error fetching results:', data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchTerm, currentPage, sortField, sortOrder, selectedCategory]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await getTerms();
        setLoading(false);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Add initial health check
  useEffect(() => {
    const checkServer = async () => {
      try {
        console.log(`Checking server at: ${API_BASE_URL}`);
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          console.log('Server is up and running');
          setIsServerLoading(false);
        }
      } catch (error) {
        console.error('Server check failed:', error);
        setTimeout(checkServer, 2000); // Retry after 2 seconds
      }
    };
    checkServer();
  }, []);

  // Show warming up message during cold start
  if (isServerLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Connecting to backend...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds during cold start</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {terms.length > 0 ? (
        <div className="space-y-4">
          {terms.map((term) => (
            <div key={term.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900">{term.term}</h3>
              <span className="inline-block px-2 py-1 mt-1 text-sm text-blue-800 bg-blue-100 rounded">
                {term.category}
              </span>
              <p className="mt-2 text-gray-600">{term.definition}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          No terms found. Try adjusting your search.
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

export default SearchPage; 