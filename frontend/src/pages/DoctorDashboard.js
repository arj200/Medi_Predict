import React, { useState, useEffect } from 'react';
import { getDoctorConsultations, getPendingCases, updateConsultationStatus } from '../services/api';
import DoctorPatientChat from './DoctorPatientChat';
import Header from '../components/Header'; 

const DoctorDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('consultations');
  const [consultations, setConsultations] = useState([]);
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingReviews: 0,
    completedConsultations: 0
  });

  // ✅ NEW: Chat functionality states
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const tabs = [
    { id: 'consultations', name: 'Patient Consultations', icon: '👥' },
    { id: 'cases', name: 'Pending Reviews', icon: '📋' },
    { id: 'schedule', name: 'Today\'s Schedule', icon: '📅' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load consultations
      const consultationsResponse = await getDoctorConsultations();
      if (consultationsResponse.success) {
        setConsultations(consultationsResponse.consultations || []);
      }

      // Load pending cases
      const casesResponse = await getPendingCases();
      if (casesResponse.success) {
        setPendingCases(casesResponse.cases || []);
      }

      // Calculate stats
      updateStats(consultationsResponse.consultations, casesResponse.cases);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (consultations = [], cases = []) => {
    const today = new Date().toDateString();
    const todayAppointments = consultations.filter(c => 
      new Date(c.requested_date).toDateString() === today
    ).length;

    setStats({
      totalPatients: consultations.length,
      todayAppointments,
      pendingReviews: cases.length,
      completedConsultations: consultations.filter(c => c.status === 'completed').length
    });
  };

  const handleStatusUpdate = async (consultationId, newStatus) => {
    try {
      const response = await updateConsultationStatus(consultationId, newStatus);
      if (response.success) {
        setConsultations(prev => prev.map(consultation => 
          consultation.id === consultationId 
            ? { ...consultation, status: newStatus }
            : consultation
        ));
        
        // Update stats
        const updatedConsultations = consultations.map(c => 
          c.id === consultationId ? { ...c, status: newStatus } : c
        );
        updateStats(updatedConsultations, pendingCases);
      }
    } catch (error) {
      console.error('Error updating consultation status:', error);
    }
  };

  // ✅ NEW: Chat functionality handlers
  const handleOpenChat = (consultation) => {
    setSelectedConsultation(consultation);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedConsultation(null);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderConsultationCard = (consultation) => (
    <div key={consultation.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            👤
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {consultation.patient_name || 'Unknown Patient'}
            </h3>
            <p className="text-sm text-gray-600">📧 {consultation.patient_email}</p>
            <p className="text-sm text-gray-600">
              📅 {new Date(consultation.requested_date).toLocaleDateString()}
            </p>
            {consultation.message && (
              <p className="text-sm text-gray-700 mt-2 italic bg-gray-50 p-2 rounded">
                💬 "{consultation.message}"
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          {getStatusBadge(consultation.status)}
          <p className="text-xs text-gray-500 mt-1">
            Booked {new Date(consultation.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ✅ ENHANCED: Doctor Interaction Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {/* Always Available: Chat Button */}
        <button
          onClick={() => handleOpenChat(consultation)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 flex items-center space-x-2 transition-colors"
        >
          <span>💬</span>
          <span>Open Chat</span>
        </button>

        {/* Status-based Action Buttons */}
        {consultation.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusUpdate(consultation.id, 'confirmed')}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <span>✅</span>
              <span>Accept</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(consultation.id, 'cancelled')}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 flex items-center space-x-2 transition-colors"
            >
              <span>❌</span>
              <span>Decline</span>
            </button>
          </>
        )}
        
        {consultation.status === 'confirmed' && (
          <>
            <button
              onClick={() => handleOpenChat(consultation)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <span>📹</span>
              <span>Video Call</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(consultation.id, 'completed')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
            >
              <span>✅</span>
              <span>Complete</span>
            </button>
          </>
        )}

        {consultation.status === 'completed' && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm flex items-center space-x-2">
            <span>✅</span>
            <span>Completed</span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} onLogout={onLogout} userType="doctor" />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, Dr. {user?.name || 'Doctor'}! 👨‍⚕️
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your consultations and interact with patients
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Patients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPatients}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Appointments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.todayAppointments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Reviews
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingReviews}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Today
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completedConsultations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Consultations Tab */}
          {activeTab === 'consultations' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                👥 Patient Consultations & Interactions
              </h2>
              
              {consultations.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <span className="text-4xl">📋</span>
                  <p className="mt-2 text-gray-500">No consultations yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map(renderConsultationCard)}
                </div>
              )}
            </div>
          )}

          {/* Pending Cases Tab */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📋 Pending Medical Reviews
              </h2>
              
              {pendingCases.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <span className="text-4xl">✅</span>
                  <p className="mt-2 text-gray-500">All cases reviewed!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCases.map((case_item) => (
                    <div key={case_item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {case_item.patient_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Disease: {case_item.disease}
                          </p>
                          <p className="text-sm text-gray-600">
                            Prediction: {case_item.prediction}
                          </p>
                          <p className="text-sm text-gray-600">
                            Risk Level: {case_item.risk_level}
                          </p>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                          Review Case
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📅 Today's Schedule
              </h2>
              
              <div className="bg-white rounded-lg p-6">
                <div className="text-center">
                  <span className="text-4xl">📅</span>
                  <p className="mt-2 text-gray-500">
                    You have {stats.todayAppointments} appointments today
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ NEW: Chat Modal */}
      {showChat && selectedConsultation && (
        <DoctorPatientChat
          consultation={selectedConsultation}
          user={user}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
