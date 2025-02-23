import React, { useState } from 'react';
import { toast } from 'react-toastify';

function Pagination({ currentPage, totalPages, onPageChange }) {
  const [jumpToPage, setJumpToPage] = useState('');

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    } else {
      toast.error(`Please enter a page number between 1 and ${totalPages}`);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Add first page
    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    range.unshift(1);

    // Add last page
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        >
          Previous
        </button>
        
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100'
            } ${page === '...' ? 'cursor-default' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        >
          Last
        </button>
      </div>

      <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Page #"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go
        </button>
      </form>
    </div>
  );
}

export default Pagination; 