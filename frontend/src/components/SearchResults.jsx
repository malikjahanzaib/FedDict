import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../services/api';
import { toast } from 'react-toastify';

function SearchResults({ 
  searchTerm, 
  sortField, 
  sortOrder, 
  selectedCategory,
  currentPage,
  setTotalPages,
  setCategories 
}) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);

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

        const response = await fetch(`${API_BASE_URL}/terms/?${queryParams}`);
        const data = await response.json();

        if (response.ok) {
          setTerms(data.items || []);
          setTotalPages(data.pages || 1);
          setCategories(data.categories || []);
        } else {
          throw new Error(data.detail || 'Failed to fetch results');
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchTerm, sortField, sortOrder, selectedCategory, currentPage]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No terms found. Try adjusting your search.
      </div>
    );
  }

  return (
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
  );
}

export default SearchResults; 