import axios from 'axios';

// In your api.js, change the base URL to just the domain
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://medi-predict-dkpf.onrender.com'  // ✅ Your Render backend
    : 'http://localhost:5000');

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance with proper credentials configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Essential for session cookies
  timeout: 10000,
});

// Global axios defaults (backup)
axios.defaults.withCredentials = true;

// Request interceptor to ensure credentials on every request
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data
    });
    config.withCredentials = true;  // Ensure credentials are always sent
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.error('🚨 CONNECTION REFUSED: Flask server is not running on port 5000!');
    }
    
    if (error.response?.status === 401) {
      console.log('Session expired, redirecting to login');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🔍 Testing connection to Flask server...');
    const response = await api.get('/health/network');
    console.log('✅ Connection test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Session check function
export const checkSession = async () => {
  try {
    const response = await api.get('/auth/check-session');
    return response.data;
  } catch (error) {
    return { success: false, error: 'Session validation failed' };
  }
};

// Auth API calls with enhanced error handling
export const registerUser = async (userData) => {
  try {
    console.log('📝 Registering user:', userData.email);
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please ensure Flask backend is running on port 5000.');
    }
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

export const loginUser = async (credentials) => {
  try {
    console.log('🔐 Logging in user:', credentials.email);
    
    // ✅ Use the route that was working for you
    const response = await api.post('/auth/login', credentials);  // Not /api/auth/login
    
    console.log('✅ Login successful');
    return response.data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please ensure Flask backend is running on port 5000.');
    }
    console.error('❌ Login failed:', error.response?.data);
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    localStorage.removeItem('user');
    throw new Error(error.response?.data?.error || 'Logout failed');
  }
};

// Keep all your other existing functions...
// (I'll include them for completeness but they're already correct)

// Patient API calls
export const predictDisease = async (disease, features) => {
  try {
    const response = await api.post(`/patient/predict/${disease}`, { features });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Prediction failed');
  }
};

export const getPatientHistory = async () => {
  try {
    const response = await api.get('/patient/history');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch patient history');
  }
};

// Add this to your api.js file
export const getPatientStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/patient/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ getPatientStats error:', error);
    throw error;
  }
};


export const bookConsultation = async (consultationData) => {
  try {
    const response = await api.post('/patient/book-consultation', consultationData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to book consultation');
  }
};

export const getPatientConsultations = async () => {
  try {
    const response = await api.get('/patient/consultations');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch consultations');
  }
};

// Real-time messaging functions
export const sendMessage = async (roomId, content, messageType = 'text', fileUrl = null) => {
  try {
    const response = await api.post('/chat/send-message', {
      chat_room_id: roomId,
      content,
      message_type: messageType,
      file_url: fileUrl
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to send message');
  }
};

export const getChatMessages = async (roomId) => {
  try {
    const response = await api.get(`/chat/get-messages/${roomId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch messages');
  }
};

export const uploadChatFile = async (file, roomId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);

    const response = await api.post('/chat/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload file');
  }
};

export const startVideoCall = async (consultationId, roomId, callType = 'video') => {
  try {
    const response = await api.post('/video-call/start', {
      consultation_id: consultationId,
      room_id: roomId,
      call_type: callType
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to start video call');
  }
};

// Doctor API calls
export const getPendingCases = async () => {
  try {
    const response = await api.get('/doctor/pending-cases');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch pending cases');
  }
};

export const reviewCase = async (caseId, reviewData) => {
  try {
    const response = await api.post(`/doctor/review-case/${caseId}`, reviewData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to review case');
  }
};

export const getDoctorConsultations = async () => {
  try {
    const response = await api.get('/doctor/consultations');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch doctor consultations');
  }
};

export const updateConsultationStatus = async (consultationId, status) => {
  try {
    const response = await api.post(`/doctor/update-consultation/${consultationId}`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update consultation status');
  }
};

// General API calls
export const getAvailableDoctors = async () => {
  try {
    const response = await api.get('/doctors/available');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch available doctors');
  }
};

export const getDiseaseInfo = async () => {
  try {
    const response = await api.get('/diseases/info');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch disease information');
  }
};

export default api;

