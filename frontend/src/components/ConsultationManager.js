import React, { useState, useEffect } from 'react';
import { getDoctorConsultations, updateConsultationStatus } from '../services/api';

const ConsultationManager = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const response = await getDoctorConsultations();
      if (response.success) {
        setConsultations(response.consultations || []);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (consultationId, newStatus) => {
    if (!consultationId) {
      console.error('Consultation ID is required');
      return;
    }

    try {
      setUpdatingStatus(prev => ({ ...prev, [consultationId]: true }));
      
      const response = await updateConsultationStatus(consultationId, newStatus);
      if (response.success) {
        // Update local state
        setConsultations(prev => prev.map(consultation => 
          consultation.id === consultationId 
            ? { ...consultation, status: newStatus }
            : consultation
        ));
      }
    } catch (error) {
      console.error('Error updating consultation status:', error);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [consultationId]: false }));
    }
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

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        👨‍⚕️ Patient Consultations
      </h2>

      {consultations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl">📋</span>
          <p className="mt-2">No consultation requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div 
              key={consultation.id || consultation._id} // ✅ FIXED: Added unique key
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {consultation.patient_name || 'Unknown Patient'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    📧 {consultation.patient_email}
                  </p>
                  <p className="text-sm text-gray-600">
                    📅 Requested: {new Date(consultation.requested_date).toLocaleDateString()}
                  </p>
                  {consultation.message && (
                    <p className="text-sm text-gray-700 mt-2 italic">
                      💬 "{consultation.message}"
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(consultation.status)}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(consultation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="flex space-x-2">
                {consultation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(consultation.id, 'confirmed')}
                      disabled={updatingStatus[consultation.id]}
                      className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingStatus[consultation.id] ? 'Updating...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(consultation.id, 'cancelled')}
                      disabled={updatingStatus[consultation.id]}
                      className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {updatingStatus[consultation.id] ? 'Updating...' : 'Cancel'}
                    </button>
                  </>
                )}
                {consultation.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(consultation.id, 'completed')}
                    disabled={updatingStatus[consultation.id]}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingStatus[consultation.id] ? 'Updating...' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsultationManager;
