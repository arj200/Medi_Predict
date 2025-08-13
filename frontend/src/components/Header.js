import React, { useState } from 'react';
import { logoutUser } from '../services/api';

const Header = ({ user, onLogout, userType }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem('user');
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">MediPredict AI</h1>
            </div>
            <div className="ml-6">
              <span className="text-sm text-gray-500">
                {userType === 'patient' ? 'Patient Portal' : 'Doctor Portal'}
              </span>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="text-gray-400 hover:text-gray-600 relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{user.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-gray-500">{user.email}</div>
                  </div>
                  
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                    }}
                  >
                    Profile Settings
                  </a>
                  
                  {userType === 'patient' && (
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDropdown(false);
                      }}
                    >
                      Medical Records
                    </a>
                  )}
                  
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                    }}
                  >
                    Help & Support
                  </a>
                  
                  <div className="border-t">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown overlay */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Header;
