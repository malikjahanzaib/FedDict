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