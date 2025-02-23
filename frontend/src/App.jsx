import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchAndFilter from './components/SearchAndFilter';
import Pagination from './components/Pagination';
import SearchResults from './components/SearchResults';
import SearchPage from './components/SearchPage';
import AdminPage from './components/AdminPage';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('term');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
            <Route path="/" element={
              <div className="container mx-auto px-4 py-8">
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
                <SearchResults
                  searchTerm={searchTerm}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  selectedCategory={selectedCategory}
                  currentPage={currentPage}
                  setTotalPages={setTotalPages}
                  setCategories={setCategories}
                />
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            } />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<Login />} />
          </Routes>
          <ToastContainer 
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 