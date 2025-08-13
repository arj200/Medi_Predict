import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setAuthMode(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setAuthMode(null);
  };

  const handleBack = () => {
    setAuthMode(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* If user is logged in, redirect to dashboard */}
          {user && (
            <>
              <Route path="/*" element={
                user.user_type === 'patient' ? 
                <PatientDashboard user={user} onLogout={handleLogout} /> :
                <DoctorDashboard user={user} onLogout={handleLogout} />
              } />
            </>
          )}
          
          {/* If no user logged in */}
          {!user && (
            <>
              <Route path="/" element={
                !authMode ? 
                <LandingPage onSelectUserType={setAuthMode} /> :
                <Login userType={authMode} onLogin={handleLogin} onBack={handleBack} />
              } />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
