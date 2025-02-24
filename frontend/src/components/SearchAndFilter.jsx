import React from 'react';

function SearchAndFilter({ 
  searchTerm, 
  setSearchTerm, 
  sortField, 
  setSortField, 
  sortOrder, 
  setSortOrder,
  categories,
  selectedCategory,
  setSelectedCategory
}) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Sort Field */}
          <select
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              console.log('Sort field changed to:', e.target.value); // Debug log
            }}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="term">Sort by Term</option>
            <option value="category">Sort by Category</option>
            <option value="definition">Sort by Definition</option>
            <option value="created">Sort by Date Added</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => {
              const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
              setSortOrder(newOrder);
              console.log('Sort order changed to:', newOrder); // Debug log
            }}
            className="p-2 border rounded hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchAndFilter; 