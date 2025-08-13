import React, { useState } from 'react';
import { loginUser } from '../services/api';
import Register from './Register';

const Login = ({ userType, onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    user_type: userType
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginUser(formData);
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        onLogin(result.user);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = (userData) => {
    // After successful registration, automatically log the user in
    localStorage.setItem('user', JSON.stringify(userData));
    onLogin(userData);
    setShowRegister(false);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  // Show registration component with correct props
  if (showRegister) {
    return (
      <Register 
        userType={userType}  // Pass the userType from Login
        onRegistrationSuccess={handleRegistrationSuccess}
        onBack={handleBackToLogin}
      />
    );
  }

  // Show login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Home
          </button>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {userType === 'patient' ? 'Patient' : 'Doctor'} Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => setShowRegister(true)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 form-input"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 form-input"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800">Demo Credentials:</h4>
            <div className="mt-2 text-sm text-yellow-700">
              <p><strong>Patient:</strong> patient@demo.com / password123</p>
              <p><strong>Doctor:</strong> doctor@demo.com / password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
