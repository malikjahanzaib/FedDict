import React, { useState, useEffect } from 'react';
import SearchAndFilter from './SearchAndFilter';
import Pagination from './Pagination';

function TermsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('term');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [terms, setTerms] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTerms = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        category: selectedCategory,
        sort_field: sortField,
        sort_order: sortOrder
      });

      const response = await fetch(`${API_BASE_URL}/terms/?${queryParams}`);
      const data = await response.json();
      
      setTerms(data.items);
      setTotalPages(data.pages);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast.error('Failed to load terms');
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [currentPage, searchTerm, sortField, sortOrder, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto p-4">
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

      <div className="space-y-4">
        {terms.map(term => (
          <TermCard key={term.id} term={term} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default TermsPage; 