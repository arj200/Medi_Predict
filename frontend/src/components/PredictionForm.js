import React, { useState, useEffect } from 'react';
import { predictDisease, getDiseaseInfo } from '../services/api';

const PredictionForm = ({ onResult }) => {
  const [selectedDisease, setSelectedDisease] = useState('anemia');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [diseaseInfo, setDiseaseInfo] = useState({});
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [error, setError] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);

  // ✅ Debug logging
  console.log("🔍 PredictionForm rendered");
  console.log("📊 Disease info:", diseaseInfo);
  console.log("🎯 Selected disease:", selectedDisease);
  console.log("📝 Form data:", formData);

  useEffect(() => {
    console.log("🚀 Loading disease info...");
    loadDiseaseInfo();
  }, []);

  useEffect(() => {
    // Reset form when disease changes
    console.log("🔄 Disease changed to:", selectedDisease);
    setFormData({});
    setPredictionResult(null);
    setError(null);
  }, [selectedDisease]);

  const loadDiseaseInfo = async () => {
    try {
      setIsLoadingInfo(true);
      setError(null);
      
      console.log("📡 Calling getDiseaseInfo API...");
      const result = await getDiseaseInfo();
      console.log("✅ API Response:", result);
      
      if (result.success) {
        setDiseaseInfo(result.diseases);
        console.log("✅ Disease info loaded successfully");
      } else {
        console.error("❌ API returned error:", result);
        setError("Failed to load disease information");
      }
    } catch (error) {
      console.error('❌ Error loading disease info:', error);
      setError("Error connecting to server");
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPredictionResult(null);

    try {
      const currentDisease = diseaseInfo[selectedDisease];
      
      // ✅ Enhanced feature preparation with validation
      const features = currentDisease.fields.map(field => {
        const value = formData[field.name];
        const numValue = parseFloat(value) || 0;
        console.log(`📊 Field ${field.name}: ${value} -> ${numValue}`);
        return numValue;
      });

      console.log("🚀 Sending prediction request:", { 
        selectedDisease, 
        features,
        diseaseInfo: currentDisease.name 
      });

      // ✅ Make prediction API call
      const result = await predictDisease(selectedDisease, features);
      
      console.log("📊 Full API response:", result);
      console.log("🎯 Response success:", result.success);
      console.log("🎯 Prediction data:", result.prediction);
      
      if (result.success && result.prediction) {
        const predictionData = result.prediction;
        console.log("✅ Processing prediction data:", predictionData);
        
        // ✅ Set local state for immediate display
        setPredictionResult(predictionData);
        
        // ✅ Call parent callback with full prediction data
        if (onResult) {
          console.log("✅ Calling onResult with:", predictionData);
          onResult(predictionData);
        } else {
          console.warn("⚠️ onResult callback not provided");
        }
        
        console.log("✅ Prediction completed successfully");
      } else {
        console.error("❌ API returned error or missing prediction:", result);
        setError(result.error || "Invalid prediction response");
      }
    } catch (error) {
      console.error('❌ Prediction error:', error);
      setError("Failed to get prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    console.log(`📝 Input changed: ${fieldName} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleDiseaseSelect = (disease) => {
    console.log(`🎯 Disease selected: ${disease}`);
    setSelectedDisease(disease);
  };

  // ✅ Enhanced loading state
  if (isLoadingInfo) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disease information...</p>
        </div>
      </div>
    );
  }

  // ✅ Error state with retry
  if (error && Object.keys(diseaseInfo).length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDiseaseInfo}
            className="btn-primary"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const diseases = Object.keys(diseaseInfo);
  const currentDisease = diseaseInfo[selectedDisease];

  if (!currentDisease) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Error: Could not load disease information for {selectedDisease}</p>
          <button 
            onClick={() => setSelectedDisease('anemia')}
            className="mt-4 btn-primary"
          >
            Reset to Anemia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Prediction Form Card */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔬 Disease Prediction</h2>
        
        {/* Disease Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Disease to Predict
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {diseases.map(disease => (
              <button
                key={disease}
                type="button"
                onClick={() => handleDiseaseSelect(disease)}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedDisease === disease
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <div className="text-lg mb-1">
                  {disease === 'anemia' && '🩸'}
                  {disease === 'diabetes' && '🍬'}
                  {disease === 'heart_disease' && '❤️'}
                  {disease === 'chronic' && '🫁'}
                  {disease === 'malaria' && '🦟'}
                </div>
                {diseaseInfo[disease].name}
              </button>
            ))}
          </div>
        </div>

        {/* Disease Description */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h3 className="font-medium text-blue-900 flex items-center">
            <span className="mr-2">ℹ️</span>
            {currentDisease.name}
          </h3>
          <p className="text-sm text-blue-700 mt-1">{currentDisease.description}</p>
          {currentDisease.accuracy && (
            <p className="text-sm text-blue-600 mt-2 font-medium">
              Model Accuracy: {currentDisease.accuracy}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
            <div className="flex">
              <span className="text-red-400 mr-2">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-red-800">Prediction Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDisease.fields.map(field => (
              <div key={field.name} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select {field.label}...</option>
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept={field.accept}
                      onChange={(e) => handleInputChange(field.name, e.target.files[0])}
                      className="hidden"
                      id={`file-${field.name}`}
                    />
                    <label
                      htmlFor={`file-${field.name}`}
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="mt-2 text-sm text-gray-600">Upload {field.label}</span>
                      <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
                    </label>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
                
                {/* Field hints */}
                {field.min !== undefined && field.max !== undefined && (
                  <p className="text-xs text-gray-500">
                    Range: {field.min} - {field.max}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🔍</span>
                  Get AI Prediction
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ Immediate Results Display */}
      {predictionResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Prediction Results for {currentDisease.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl mb-2">
                {predictionResult.prediction === 0 ? '✅' : '⚠️'}
              </div>
              <p className="text-sm text-gray-600">Result</p>
              <p className="text-lg font-semibold text-blue-600">
                {predictionResult.prediction === 0 ? 'Negative' : 'Positive'}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-lg font-semibold text-green-600">
                {((predictionResult.confidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl mb-2">🎚️</div>
              <p className="text-sm text-gray-600">Risk Level</p>
              <p className="text-lg font-semibold text-purple-600">
                {predictionResult.risk_level || 'Unknown'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl mb-2">🤖</div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="text-lg font-semibold text-gray-600">
                {predictionResult.model_type || 'AI Model'}
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Medical Disclaimer</h4>
            <p className="text-sm text-yellow-700">
              This AI prediction is for informational purposes only and should not replace professional medical advice. 
              Please consult with a healthcare provider for proper diagnosis and treatment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
