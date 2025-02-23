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

// Update the input's onBlur handler
const handleBlur = () => {
  // Use setTimeout to allow click events to fire first
  setTimeout(() => {
    setShowSuggestions(false);
  }, 200);
};

// Update the suggestions fetch
const fetchSuggestions = async (value) => {
  if (!value.trim()) {
    setSuggestions([]);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/terms/?search=${encodeURIComponent(value)}&limit=5`);
    if (response.ok) {
      const data = await response.json();
      setSuggestions(data.items.map(item => ({
        term: item.term,
        id: item.id
      })));
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  }
};

return (
  <div className="relative w-full">
    <input
      type="text"
      value={searchTerm}
      onChange={handleSearchChange}
      onFocus={() => searchTerm && fetchSuggestions(searchTerm)}
      onBlur={handleBlur}
      className="w-full p-2 border rounded"
      placeholder="Search terms..."
    />
    {showSuggestions && suggestions.length > 0 && (
      <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id || index}
            className="p-2 hover:bg-gray-100 cursor-pointer"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent blur from firing before click
              handleSuggestionClick(suggestion);
            }}
          >
            {suggestion.term}
          </div>
        ))}
      </div>
    )}
  </div>
); 