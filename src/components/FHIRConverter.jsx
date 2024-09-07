import React, { useState } from 'react';

// Generate a unique UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Validate FHIR resource
const validateFHIRResource = (resource) => {
  if (!resource.id) {
    throw new Error("FHIR resource must have an 'id'");
  }
  if (!resource.resourceType) {
    throw new Error("FHIR resource must have a 'resourceType'");
  }
  if (resource.resourceType === 'Patient' && (!resource.name || resource.name.length === 0)) {
    throw new Error("Patient resource must have a 'name'");
  }
  // Add more validation rules as needed
};

// Convert input JSON to FHIR format
const convertToFHIRFormat = (input, type) => {
  const fhirResource = {
    resourceType: type,
    id: generateUUID(),
  };

  const mappings = {
    Patient: {
      id: input.legacy_patient_id,
      name: [{ text: input.legacy_name }],
      birthDate: input.legacy_birth_date,
      gender: input.legacy_gender,
      address: [{
        line: [input.legacy_address],
        city: input.legacy_city,
        state: input.legacy_state,
        postalCode: input.legacy_zip,
      }],
      telecom: [{ value: input.legacy_phone }],
    },
    Observation: {
      id: input.legacy_observation_id,
      status: input.legacy_status,
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: input.legacy_category,
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: input.legacy_code,
          display: input.legacy_display,
        }],
      },
      subject: { reference: `Patient/${input.legacy_patient_id}` },
      effectiveDateTime: input.legacy_effective_date,
      valueQuantity: {
        value: input.legacy_value,
        unit: input.legacy_unit,
        system: 'http://unitsofmeasure.org',
      },
    },
    // Add more mappings for other resource types as needed
  };

  if (mappings[type]) {
    Object.assign(fhirResource, mappings[type]);
  } else {
    throw new Error(`Unsupported resource type: ${type}`);
  }

  validateFHIRResource(fhirResource);

  return fhirResource;
};

const FHIRConverter = () => {
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [error, setError] = useState('');
  const [resourceType, setResourceType] = useState('Patient');

  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError('');
  };

  const handleResourceTypeChange = (e) => {
    setResourceType(e.target.value);
  };

  const convertToFHIR = () => {
    try {
      const inputJson = JSON.parse(inputData);
      const fhirData = convertToFHIRFormat(inputJson, resourceType);
      setOutputData(JSON.stringify(fhirData, null, 2));
      setError('');
    } catch (err) {
      setError('Error converting data. Please check your input JSON: ' + err.message);
      setOutputData('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputData)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="logo w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl mr-3">
              m:
            </div>
            <h1 className="text-3xl font-bold text-black">Medleads FHIR</h1>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resource-type">
              FHIR Resource Type:
            </label>
            <select
              id="resource-type"
              value={resourceType}
              onChange={handleResourceTypeChange}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800"
            >
              <option value="Patient">Patient</option>
              <option value="Observation">Observation</option>
              {/* Add more resource types as needed */}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="input-json">
              Input JSON:
            </label>
            <textarea
              id="input-json"
              value={inputData}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800"
              rows="10"
              placeholder="Paste your JSON here..."
            />
          </div>
          <button
            onClick={convertToFHIR}
            className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
          >
            Convert to FHIR
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
            <p>{error}</p>
          </div>
        )}

        {outputData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Output FHIR Data:</h2>
            <div className="bg-gray-100 border border-gray-300 rounded-md">
              <pre className="p-4 overflow-x-auto text-sm text-gray-800">
                {outputData}
              </pre>
            </div>
            <button
              onClick={copyToClipboard}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FHIRConverter;
