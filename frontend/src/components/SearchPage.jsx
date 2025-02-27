import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import SearchBar from './SearchBar';
import SearchAndFilter from './SearchAndFilter';
import Pagination from './Pagination';
import { searchTerms, getCategories } from '../services/api';

function SearchPage() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortField, setSortField] = useState('term');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        <p className="text-gray-600">Connecting to backend at {API_BASE_URL}</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Federal Dictionary</h1>
      <SearchBar onSearch={setSearchTerm} />
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : terms.length > 0 ? (
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