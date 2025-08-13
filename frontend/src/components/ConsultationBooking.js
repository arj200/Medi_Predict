import React, { useState, useEffect } from 'react';
import { bookConsultation, getPatientConsultations, getAvailableDoctors } from '../services/api';
import DoctorPatientChat from '../pages/DoctorPatientChat';

const ConsultationBooking = () => {
  const [doctors, setDoctors] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [consultationDate, setConsultationDate] = useState('');
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ NEW: Chat functionality states
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showChat, setShowChat] = useState(false);

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

  const getSpecializationIcon = (specialization) => {
    const icons = {
      'General Medicine': '🩺',
      'Cardiology': '❤️',
      'Dermatology': '🫧',
      'Neurology': '🧠',
      'Orthopedics': '🦴',
      'Pediatrics': '👶',
      'Psychiatry': '🧘‍♂️',
      'Radiology': '📡',
      'Surgery': '⚕️',
      'Gynecology': '👩‍⚕️'
    };
    return icons[specialization] || '👨‍⚕️';
  };

  // Load available doctors and existing consultations
  useEffect(() => {
    loadDoctorsAndConsultations();
  }, []);

  const loadDoctorsAndConsultations = async () => {
    try {
      setLoading(true);
      
      // Load available doctors
      const doctorsResponse = await getAvailableDoctors();
      if (doctorsResponse.success) {
        setDoctors(doctorsResponse.doctors);
      }

      // Load existing consultations for this patient
      const consultationsResponse = await getPatientConsultations();
      if (consultationsResponse.success) {
        setConsultations(consultationsResponse.consultations || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification('Error loading consultation data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !consultationDate) {
      setNotification('Please select a doctor and date.');
      return;
    }

    setBookingLoading(true);
    setNotification('');

    try {
      const response = await bookConsultation({
        doctor_id: selectedDoctor.id,
        requested_date: consultationDate,
        message: message
      });

      if (response.success) {
        setNotification('✅ Consultation booked successfully! Chat room created.');
        setSelectedDoctor(null);
        setConsultationDate('');
        setMessage('');
        
        // Reload consultations to show the new booking
        loadDoctorsAndConsultations();
      } else {
        setNotification(response.error || 'Failed to book consultation.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setNotification(error.message || 'Failed to book consultation. Please try again.');
    } finally {
      setBookingLoading(false);
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

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading consultation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Book New Consultation */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          📅 Book New Consultation with Real-Time Chat
        </h2>

        {notification && (
          <div className={`mb-4 p-3 rounded-lg ${
            notification.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {notification}
          </div>
        )}

        <form onSubmit={handleBookConsultation} className="space-y-6">
          {/* Doctor Selection Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Your Doctor
            </label>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 form-input"
              />
            </div>

            {/* Selected Doctor Display */}
            {selectedDoctor && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      {getSpecializationIcon(selectedDoctor.specialization)}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Selected: {selectedDoctor.name}</p>
                      <p className="text-sm text-blue-700">{selectedDoctor.specialization}</p>
                      <p className="text-xs text-blue-600">💬 Real-time chat included</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Doctor Cards Grid */}
            {!selectedDoctor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {filteredDoctors.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <span className="text-4xl">🔍</span>
                    <p className="mt-2">No doctors found matching your search.</p>
                  </div>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer hover:bg-blue-50"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Doctor Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-2xl">
                          {getSpecializationIcon(doctor.specialization)}
                        </div>
                        
                        {/* Doctor Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-blue-600 mb-1">
                            {doctor.specialization || 'General Medicine'}
                          </p>
                          
                          {/* Enhanced Feature Badges */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {doctor.experience || 0} years exp.
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              💬 Chat
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              📹 Video
                            </span>
                          </div>
                          
                          {/* Contact Info */}
                          {doctor.phone && (
                            <p className="text-xs text-gray-500">
                              📞 {doctor.phone}
                            </p>
                          )}
                          
                          {/* Select Button */}
                          <button
                            type="button"
                            className="mt-2 w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Select Doctor
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Date and Message (only show when doctor is selected) */}
          {selectedDoctor && (
            <>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={consultationDate}
                  onChange={(e) => setConsultationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your symptoms or concerns..."
                  rows={3}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="btn-primary w-full"
              >
                {bookingLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Consultation & Chat Room...
                  </div>
                ) : (
                  `📅 Book Consultation with ${selectedDoctor.name}`
                )}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Enhanced Consultations with Chat */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          📋 My Consultations & Chats
        </h2>

        {consultations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl">🏥</span>
            <p className="mt-2">No consultations booked yet.</p>
            <p className="text-sm">Book your first consultation above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      👨‍⚕️
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {consultation.doctor_name || 'Doctor'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(consultation.requested_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        📧 {consultation.doctor_email || 'Email not available'}
                      </p>
                      <p className="text-sm text-gray-600">
                        🏥 {consultation.doctor_specialization || 'General Medicine'}
                      </p>
                      {consultation.message && (
                        <p className="text-sm text-gray-700 mt-2 italic">
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
                    
                    {/* ✅ NEW: Enhanced Interaction Buttons */}
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => handleOpenChat(consultation)}
                        className="w-full bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 flex items-center justify-center space-x-2"
                      >
                        <span>💬</span>
                        <span>Open Chat</span>
                      </button>
                      
                      {consultation.status === 'confirmed' && (
                        <button
                          onClick={() => handleOpenChat(consultation)}
                          className="w-full bg-green-500 text-white px-3 py-2 rounded-md text-sm hover:bg-green-600 flex items-center justify-center space-x-2"
                        >
                          <span>📹</span>
                          <span>Video Call</span>
                        </button>
                      )}

                      {consultation.status === 'pending' && (
                        <div className="w-full bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-xs text-center">
                          ⏳ Waiting for doctor confirmation
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ NEW: Chat Modal */}
      {showChat && selectedConsultation && (
        <DoctorPatientChat
          consultation={selectedConsultation}
          user={JSON.parse(localStorage.getItem('user'))}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default ConsultationBooking;
