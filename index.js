import React, { useState } from 'react';

function App() {
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState(''); // en cm
  const [neck, setNeck] = useState('');     // en cm
  const [waist, setWaist] = useState('');   // en cm
  const [hip, setHip] = useState('');       // en cm (solo para mujeres)
  const [bodyFatPercentage, setBodyFatPercentage] = useState(null);
  const [error, setError] = useState('');
  // Nuevo estado para las recomendaciones generadas por la IA
  const [recommendations, setRecommendations] = useState('');
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  // Función para validar si un valor es numérico y positivo
  const isValidNumber = (value) => {
    return value !== '' && !isNaN(value) && parseFloat(value) > 0;
  };

  const calculateBodyFat = () => {
    setError('');
    setBodyFatPercentage(null);
    setRecommendations(''); // Limpiar recomendaciones anteriores

    // Validación de entradas
    if (!gender) {
      setError('Por favor, selecciona tu género.');
      return;
    }
    if (!isValidNumber(height) || !isValidNumber(neck) || !isValidNumber(waist)) {
      setError('Por favor, ingresa valores numéricos positivos para altura, cuello y cintura.');
      return;
    }
    if (gender === 'female' && !isValidNumber(hip)) {
      setError('Para mujeres, por favor, ingresa un valor numérico positivo para la cadera.');
      return;
    }

    const h = parseFloat(height);
    const n = parseFloat(neck);
    const w = parseFloat(waist);
    const p = parseFloat(hip); // Cadera

    let bf = 0;

    // Fórmulas del método de la Marina de los EE. UU.
    if (gender === 'male') {
      // Asegurarse de que (w - n) > 0 para evitar logaritmo de cero o negativo
      if (w - n <= 0) {
        setError('La medida de la cintura debe ser mayor que la del cuello para un cálculo preciso en hombres.');
        return;
      }
      bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    } else { // female
      // Asegurarse de que (w + p - n) > 0
      if (w + p - n <= 0) {
        setError('La suma de la cintura y la cadera debe ser mayor que la medida del cuello para un cálculo preciso en mujeres.');
        return;
      }
      bf = 495 / (1.29579 - 0.35004 * Math.log10(w + p - n) + 0.22100 * Math.log10(h)) - 450;
    }

    if (isNaN(bf) || bf < 0) {
      setError('No se pudo calcular el porcentaje de grasa corporal. Verifica tus medidas.');
      setBodyFatPercentage(null);
    } else {
      setBodyFatPercentage(bf.toFixed(2));
    }
  };

  // Función para obtener recomendaciones de bienestar usando la API de Gemini
  const getGeminiRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    setRecommendations('');
    setError('');

    // Construcción del prompt para el LLM
    const prompt = `Dado que el porcentaje de grasa corporal de un ${gender === 'male' ? 'hombre' : 'mujer'} es ${bodyFatPercentage}%, por favor, ofrece una breve interpretación de este valor y una recomendación general de bienestar. Utiliza un tono positivo y enfócate en la salud general, no en la estética. Indica claramente que esta es una recomendación general y no un consejo médico o nutricional personalizado.`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // El entorno de Canvas proporciona automáticamente la clave API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setRecommendations(text);
        } else {
            setError('No se pudieron generar las recomendaciones. Inténtalo de nuevo.');
        }
    } catch (err) {
        console.error("Error al llamar a la API de Gemini:", err);
        setError('Error al conectar con la API de Gemini. Por favor, revisa tu conexión.');
    } finally {
        setIsGeneratingRecommendations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex flex-col items-center justify-center font-inter">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          .font-inter {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 mb-8 mt-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">
          Calculadora de Grasa Corporal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Utiliza el método de la Marina de los EE. UU.
        </p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6 flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Género:
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 h-5 w-5"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={() => setGender('male')}
              />
              <span className="ml-2 text-gray-800">Hombre</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-pink-600 h-5 w-5"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={() => setGender('female')}
              />
              <span className="ml-2 text-gray-800">Mujer</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="height" className="block text-gray-700 text-sm font-semibold mb-2">
              Altura (cm):
            </label>
            <input
              type="number"
              id="height"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm transition duration-200"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ej: 175"
            />
          </div>
          <div>
            <label htmlFor="neck" className="block text-gray-700 text-sm font-semibold mb-2">
              Circunferencia del Cuello (cm):
            </label>
            <input
              type="number"
              id="neck"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm transition duration-200"
              value={neck}
              onChange={(e) => setNeck(e.target.value)}
              placeholder="Ej: 38"
            />
          </div>
          <div>
            <label htmlFor="waist" className="block text-gray-700 text-sm font-semibold mb-2">
              Circunferencia de la Cintura (cm):
            </label>
            <input
              type="number"
              id="waist"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm transition duration-200"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              placeholder="Ej: 80"
            />
          </div>
          {gender === 'female' && (
            <div>
              <label htmlFor="hip" className="block text-gray-700 text-sm font-semibold mb-2">
                Circunferencia de la Cadera (cm):
              </label>
              <input
                type="number"
                id="hip"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm transition duration-200"
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                placeholder="Ej: 95"
              />
            </div>
          )}
        </div>

        <button
          onClick={calculateBodyFat}
          className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-200 ease-in-out transform hover:scale-105"
        >
          Calcular Grasa Corporal
        </button>

        {bodyFatPercentage !== null && (
          <div className="mt-8 p-6 bg-green-50 rounded-lg shadow-inner text-center">
            <h2 className="text-xl font-bold text-green-800 mb-2">
              Tu porcentaje de grasa corporal estimado es:
            </h2>
            <p className="text-5xl font-extrabold text-green-700">
              {bodyFatPercentage}%
            </p>
            <p className="text-sm text-gray-600 mt-4">
              Este cálculo es una estimación basada en el método de la Marina de los EE. UU. Para una evaluación más precisa, consulta a un profesional de la salud.
            </p>

            <button
                onClick={getGeminiRecommendations}
                className="mt-6 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center mx-auto"
                disabled={isGeneratingRecommendations}
            >
                {isGeneratingRecommendations ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generando...
                    </span>
                ) : (
                    'Obtener Recomendaciones ✨'
                )}
            </button>
            {recommendations && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Recomendaciones del Asistente ✨:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{recommendations}</p>
                </div>
            )}
          </div>
        )}
      </div>
      <div className="text-center text-gray-500 text-sm mt-4">
        <p>Desarrollado con React y Tailwind CSS.</p>
      </div>
    </div>
  );
}

export default App;
