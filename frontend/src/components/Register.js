import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ userType, onRegistrationSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    userType: userType || 'patient', // Use the passed userType prop
    age: '',
    gender: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Send user_type instead of userType to match backend expectation
      const registrationData = {
        ...formData,
        user_type: formData.userType, // Convert userType to user_type for backend
        license_number: formData.licenseNumber // Convert licenseNumber to license_number
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, registrationData);
      
      if (response.data.success) {
        setMessage('Registration successful! You can now login.');
        
        // If onRegistrationSuccess callback is provided, use it for auto-login
        if (onRegistrationSuccess && response.data.user) {
          onRegistrationSuccess(response.data.user);
        } else {
          // Reset form if no callback
          setFormData({
            email: '',
            password: '',
            name: '',
            userType: userType || 'patient',
            age: '',
            gender: '',
            phone: '',
            specialization: '',
            licenseNumber: '',
            experience: ''
          });
        }
      } else {
        setMessage(response.data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-blue-600 hover:text-blue-500 flex items-center"
          >
            ← Back to Login
          </button>
        )}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account as {userType === 'patient' ? 'Patient' : 'Doctor'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
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
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Create a password"
              />
            </div>

            {/* Show user type but make it read-only if passed as prop */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                User Type
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="form-input"
                disabled={userType ? true : false} // Disable if userType is passed from Login
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Patient Fields */}
            {formData.userType === 'patient' && (
              <>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>
              </>
            )}

            {/* Doctor Fields */}
            {formData.userType === 'doctor' && (
              <>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                    Specialization
                  </label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., General Medicine, Cardiology"
                  />
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your medical license number"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Experience (years)
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Years of experience"
                  />
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {!onBack && (
            <div className="mt-6 text-center">
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Already have an account? Sign in
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
