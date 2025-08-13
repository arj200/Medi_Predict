import React, { useState } from 'react';
import CaseReview from './CaseReview';

const PendingCases = ({ cases, onCaseReviewed }) => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [filter, setFilter] = useState('all');

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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Moderate Risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low Risk':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCases = cases.filter(caseItem => {
    if (filter === 'all') return true;
    return caseItem.disease === filter;
  });

  if (selectedCase) {
    return (
      <CaseReview
        caseData={selectedCase}
        onBack={() => setSelectedCase(null)}
        onReviewed={() => {
          setSelectedCase(null);
          onCaseReviewed();
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pending Cases</h2>
        
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-input w-auto"
        >
          <option value="all">All Diseases</option>
          <option value="anemia">Anemia</option>
          <option value="diabetes">Diabetes</option>
          <option value="heart_disease">Heart Disease</option>
          <option value="chronic">Chronic Disease</option>
        </select>
      </div>

      {filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending cases</h3>
          <p className="mt-1 text-sm text-gray-500">All cases have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCases.map((caseItem) => (
            <div key={caseItem._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {caseItem.patient_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {caseItem.patient_age} years old, {caseItem.patient_gender}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(caseItem.risk_level)}`}>
                  {caseItem.risk_level}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 capitalize mb-2">
                  {caseItem.disease.replace('_', ' ')} Assessment
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Prediction:</span>
                    <span className={`ml-2 font-medium ${
                      caseItem.prediction === 1 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {caseItem.prediction === 1 ? 'Positive' : 'Negative'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <span className="ml-2 font-medium">
                      {(caseItem.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Submitted: {formatDate(caseItem.timestamp)}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedCase(caseItem)}
                  className="btn-primary"
                >
                  Review Case
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingCases;
