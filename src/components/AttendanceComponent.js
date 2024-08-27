import React, { useState, useEffect } from 'react';

const AttendanceComponent = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [actionType, setActionType] = useState('Ingreso');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geoAllowed, setGeoAllowed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('');
  const [loading, setLoading] = useState(false); // Estado para el loading

  useEffect(() => {
    if (geoAllowed && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          alert('Unable to retrieve your location. Please enable location services.');
        }
      );
    }
  }, [geoAllowed]);

  const captureTimestamp = () => {
    return new Date().toISOString();
  };

  const checkSubmissionLimit = () => {
    const today = new Date().toISOString().split('T')[0];
    const submissions = JSON.parse(localStorage.getItem('submissions')) || {};
    return submissions[employeeName]?.[today] || 0;
  };

  const incrementSubmissionCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const submissions = JSON.parse(localStorage.getItem('submissions')) || {};

    if (!submissions[employeeName]) {
      submissions[employeeName] = {};
    }

    submissions[employeeName][today] = (submissions[employeeName][today] || 0) + 1;
    localStorage.setItem('submissions', JSON.stringify(submissions));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Inicia el loading

    if (!employeeName) {
      setMessage('Por favor, completa el nombre.');
      setMessageColor('text-red-500');
      setLoading(false); // Detiene el loading
      return;
    }

    if (!geoAllowed) {
      setMessage('Por favor, permite la geolocalización antes de enviar.');
      setMessageColor('text-red-500');
      setLoading(false); // Detiene el loading
      return;
    }

    const submissionCount = checkSubmissionLimit();
    if (submissionCount >= 2) {
      setMessage('Solo puedes enviar el formulario dos veces al día.');
      setMessageColor('text-red-500');
      setLoading(false); // Detiene el loading
      return;
    }

    const timestamp = captureTimestamp();

    const data = {
      employeeName,
      actionType,
      latitude,
      longitude,
      timestamp,
    };

    fetch('https://backpresentismo.onrender.com/submit-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(`Failed to record attendance: ${errorData.message}`);
          });
        }
        return response.json();
      })
      .then(() => {
        incrementSubmissionCount();
        setMessage('¡Se envió con éxito tu presentismo!');
        setMessageColor('text-green-500');
        setEmployeeName('');
        setActionType('Ingreso');
        setLoading(false); // Detiene el loading

        // Temporizador para borrar el mensaje después de 5 segundos
        setTimeout(() => {
          setMessage('');
        }, 5000);
      })
      .catch((error) => {
        console.error('Error:', error);
        setMessage(`Error al enviar el presentismo: ${error.message}`);
        setMessageColor('text-red-500');
        setLoading(false); // Detiene el loading

        // Temporizador para borrar el mensaje después de 5 segundos
        setTimeout(() => {
          setMessage('');
        }, 4000);
      });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl mb-5 text-center">Employee Attendance</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
        <label htmlFor="employee-name" className="block text-sm font-medium mb-2">Nombre:</label>
        <select
          id="employee-name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}  // Cambiado de actionType a employeeName
          required
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        >
          <option value="">Seleccionar Nombre</option> {/* Añadido para evitar un valor vacío */}
          <option value="Joel">Joel</option>
          <option value="Tomas">Tomas</option>
          <option value="Rocio">Rocio</option>
          <option value="Brenda">Brenda</option>
        </select>

        <label htmlFor="action-type" className="block text-sm font-medium mb-2">Acción:</label>
        <select
          id="action-type"
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}  // Mantener el estado de actionType aquí
          required
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        >
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
        </select>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="geo-allowed"
            checked={geoAllowed}
            onChange={(e) => setGeoAllowed(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="geo-allowed" className="text-sm">Permitir geolocalización</label>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={loading}>
          {loading ? 'Cargando...' : 'Enviar'}
        </button>
        <div className='flex justify-center'>
          {message && <p className={`mt-4 ${messageColor}`}>{message}</p>}
        </div>
      </form>
      <h1 className="text-3xl font-bold mt-2">Pro Link</h1>
      <p className="text-gray-400 text-sm">Designed by Joel Damato</p>
    </div>
  );
};

export default AttendanceComponent;
