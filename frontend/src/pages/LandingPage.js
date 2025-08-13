import React from 'react';

const LandingPage = ({ onSelectUserType }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MediPredict AI</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            AI-Powered Medical
            <span className="text-blue-600"> Diagnosis</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Advanced machine learning algorithms to assist in early detection of diseases including anemia, diabetes, heart disease, and chronic kidney disease.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Patient Portal */}
            <div className="relative bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 rounded-full p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">Patient Portal</h3>
              <p className="mt-4 text-gray-600">
                Get AI-powered health predictions, track your medical history, and consult with verified doctors.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-gray-500">
                <li>✓ Disease risk assessment</li>
                <li>✓ Personal health dashboard</li>
                <li>✓ Doctor consultations</li>
                <li>✓ Medical history tracking</li>
              </ul>
              <button
                onClick={() => onSelectUserType('patient')}
                className="mt-8 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Continue as Patient
              </button>
            </div>

            {/* Doctor Portal */}
            <div className="relative bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-600 rounded-full p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">Doctor Portal</h3>
              <p className="mt-4 text-gray-600">
                Review AI predictions, provide expert consultations, and manage patient cases efficiently.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-gray-500">
                <li>✓ Review patient cases</li>
                <li>✓ AI-assisted diagnosis</li>
                <li>✓ Patient consultations</li>
                <li>✓ Case management</li>
              </ul>
              <button
                onClick={() => onSelectUserType('doctor')}
                className="mt-8 w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
              >
                Continue as Doctor
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powered by Advanced AI Technology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Anemia Detection</h3>
              <p className="text-gray-600 text-sm">Advanced blood analysis for anemia diagnosis</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Diabetes Prediction</h3>
              <p className="text-gray-600 text-sm">Early diabetes risk assessment</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Heart Disease</h3>
              <p className="text-gray-600 text-sm">Cardiovascular health monitoring</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Chronic Kidney Disease</h3>
              <p className="text-gray-600 text-sm">Kidney function evaluation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
