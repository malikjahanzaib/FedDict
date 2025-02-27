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
      {/* Changed from flex-col md:flex-row to grid layout for better width distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter - now takes full width on mobile, 1/3 on desktop */}
        <div className="w-full">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Field - now takes full width on mobile, 1/3 on desktop */}
        <div className="w-full">
          <select
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              console.log('Sort field changed to:', e.target.value);
            }}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="term">Sort by Term</option>
            <option value="category">Sort by Category</option>
            <option value="definition">Sort by Definition</option>
            <option value="created">Sort by Date Added</option>
          </select>
        </div>

        {/* Sort Order - now takes full width on mobile, 1/3 on desktop */}
        <div className="w-full flex justify-center md:justify-start">
          <button
            onClick={() => {
              const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
              setSortOrder(newOrder);
              console.log('Sort order changed to:', newOrder);
            }}
            className="w-full p-2 border rounded hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            Sort Order: {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchAndFilter; 