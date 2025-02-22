import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clearAuthCredentials } from '../services/api';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthCredentials();
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">
            FedDict
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="hover:text-blue-200">
              Search
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="hover:text-blue-200">
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-blue-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-blue-200">
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 