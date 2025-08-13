import React, { useState, useEffect } from 'react';
import { getPatientHistory } from '../services/api';

const PatientHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await getPatientHistory();
      if (result.success) {
        setHistory(result.predictions);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High Risk':
        return 'bg-red-100 text-red-800';
      case 'Moderate Risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low Risk':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'reviewed') return item.status === 'reviewed';
    if (filter === 'pending') return item.status === 'pending_review';
    return item.disease === filter;
  });

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
        
        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-input w-auto"
        >
          <option value="all">All Records</option>
          <option value="reviewed">Reviewed</option>
          <option value="pending">Pending Review</option>
          <option value="anemia">Anemia</option>
          <option value="diabetes">Diabetes</option>
          <option value="heart_disease">Heart Disease</option>
          <option value="chronic">Chronic Disease</option>
        </select>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by taking a health assessment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((record) => (
            <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {record.disease.replace('_', ' ')} Assessment
                  </h3>
                  <p className="text-sm text-gray-600">{formatDate(record.timestamp)}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(record.risk_level)}`}>
                    {record.risk_level}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Prediction Result</p>
                  <p className="font-medium">
                    {record.prediction === 1 ? 'Positive' : 'Negative'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="font-medium">{(record.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {record.doctor_review && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-900">
                      Doctor Review by {record.doctor_name}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Diagnosis:</strong> {record.doctor_review.diagnosis}
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Severity:</strong> {record.doctor_review.severity}
                  </p>
                  {record.doctor_review.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Recommendations:</p>
                      <ul className="text-sm text-blue-800 list-disc list-inside">
                        {record.doctor_review.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-2">
                <button className="btn-secondary text-sm">
                  View Details
                </button>
                {record.status === 'reviewed' && (
                  <button className="btn-primary text-sm">
                    Book Follow-up
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

export default PatientHistory;
