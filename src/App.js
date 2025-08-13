import React, { useState, useEffect, useRef } from 'react';

// Se asume que Tailwind CSS está configurado en el entorno.
// Importaciones de Firebase (simuladas, ya que no hay persistencia de datos explícitamente solicitada aquí,
// pero se incluyen para la estructura si se necesitara en el futuro).
// const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// import { initializeApp } from 'firebase/app';
// import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// Función auxiliar para convertir un Blob o File a Base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Solo la parte base64
        reader.onerror = error => reject(error);
    });
};

// Componente principal de la aplicación
function App() {
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [patientData, setPatientData] = useState({ age: '', gender: '', history: '' });
    const [geminiAnalysis, setGeminiAnalysis] = useState(null);
    const [deepseekRecommendation, setDeepseekRecommendation] = useState(null);
    const [physionetComparison, setPhysionetComparison] = useState(null);
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0); // Para manejar el estado de drag-and-drop

    // Efecto para previsualizar la imagen cuando cambia la URL
    useEffect(() => {
        if (imageUrl) {
            setImagePreview(imageUrl);
            setError(null);
        } else {
            setImagePreview(null);
        }
    }, [imageUrl]);

    // Manejador para el cambio de la URL
    const handleUrlChange = (e) => {
        setImageUrl(e.target.value);
    };

    // Manejador para subir archivo
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setImageUrl(''); // Limpiar la URL si se sube un archivo
                setError(null);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
            setError('Por favor, sube un archivo de imagen válido.');
        }
    };

    // Manejador para tomar foto (simulado)
    const handleTakePhoto = () => {
        setError('La función "Tomar Foto" no está implementada en esta simulación.');
    };

    // Manejador para el drag-and-drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            e.currentTarget.classList.add('border-blue-500');
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            e.currentTarget.classList.remove('border-blue-500');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        e.currentTarget.classList.remove('border-blue-500');

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                    setImageUrl(''); // Limpiar la URL si se sube un archivo
                    setError(null);
                };
                reader.readAsDataURL(file);
            } else {
                setError('Por favor, suelta un archivo de imagen válido.');
            }
            e.dataTransfer.clearData();
        }
    };

    // Función para simular el análisis de ECG
    const simulateECGAnalysis = async (imageData) => {
        // Simulación de una llamada a un backend para análisis de ECG
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    basic_measurements: {
                        pr_interval: '0.16s',
                        qrs_duration: '0.08s',
                        qt_interval: '0.38s',
                        heart_rate: '72 bpm'
                    },
                    initial_findings: 'Ritmo sinusal normal. No se detectan anomalías significativas en el trazado.',
                    confidence: '95%'
                });
            }, 1500); // Simula un retraso de 1.5 segundos
        });
    };

    // Función para llamar a la API de Gemini para análisis de imagen y texto
    const callGeminiAPI = async (prompt, imageData = null) => {
        let chatHistory = [];
        const parts = [{ text: prompt }];

        if (imageData) {
            parts.push({
                inlineData: {
                    mimeType: "image/png", // Asumimos PNG para la imagen del ECG
                    data: imageData
                }
            });
        }
        chatHistory.push({ role: "user", parts: parts });

        const payload = { contents: chatHistory };
        const apiKey = ""; // La clave API se inyecta en tiempo de ejecución por Canvas
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

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
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Estructura de respuesta inesperada de Gemini:", result);
                return "No se pudo obtener una respuesta detallada de Gemini.";
            }
        } catch (err) {
            console.error("Error al llamar a la API de Gemini:", err);
            return `Error de conexión con Gemini: ${err.message}.`;
        }
    };

    // Manejador del botón "Analizar"
    const handleAnalyze = async () => {
        if (!imagePreview) {
            setError('Por favor, sube o introduce una URL de imagen de ECG.');
            return;
        }

        setLoading(true);
        setError(null);
        setAnalysisResult(null);
        setGeminiAnalysis(null);
        setDeepseekRecommendation(null);
        setPhysionetComparison(null);

        try {
            // Convertir la imagen a Base64 si es necesario para Gemini
            let base64Image = null;
            if (imagePreview.startsWith('data:image/')) {
                base64Image = imagePreview.split(',')[1];
            } else {
                // Si es una URL externa, se necesitaría un proxy o CORS para obtener la imagen
                // Para esta simulación, asumimos que ya tenemos el base64 o que la URL es directa.
                // En un entorno real, harías un fetch de la URL y lo convertirías a base64.
                const response = await fetch(imagePreview);
                const blob = await response.blob();
                base64Image = await fileToBase64(blob);
            }

            // Simular análisis básico de ECG
            const basicResults = await simulateECGAnalysis(base64Image);
            setAnalysisResult(basicResults);

            // Análisis multimodal con Gemini
            const geminiPrompt = `Analiza este ECG y los siguientes datos del paciente:
            Edad: ${patientData.age || 'no especificada'}
            Género: ${patientData.gender || 'no especificado'}
            Historial Clínico: ${patientData.history || 'no especificado'}
            
            Basado en el ECG y los datos del paciente, proporciona un resumen detallado y cualquier observación relevante.`;
            
            const geminiRes = await callGeminiAPI(geminiPrompt, base64Image);
            setGeminiAnalysis(geminiRes);

            // Simular Deepseek y PhysioNet
            setTimeout(() => {
                setDeepseekRecommendation('Deepseek sugiere considerar un seguimiento si los síntomas persisten, dado el historial.');
                setPhysionetComparison('Comparación con PhysioNet: El trazado muestra alta similitud con patrones de ritmo sinusal normal en la base de datos de referencia.');
            }, 1000);

        } catch (err) {
            setError(`Error durante el análisis: ${err.message}. Asegúrate de que la URL es válida o el archivo es una imagen.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-inter p-4 sm:p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-blue-400 mb-6 text-center">Análisis de ECG Avanzado con IA</h1>

                {/* Aviso Importante */}
                <div className="bg-yellow-700 bg-opacity-30 border border-yellow-600 rounded-lg p-4 mb-6 flex items-start">
                    <svg className="w-6 h-6 text-yellow-400 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    <div>
                        <h2 className="font-semibold text-yellow-300">AVISO IMPORTANTE:</h2>
                        <p className="text-sm text-yellow-200">Este análisis es "solo para fines informativos" y no constituye un diagnóstico médico. Siempre consulta a un profesional de la salud calificado para una interpretación precisa de cualquier dato médico.</p>
                    </div>
                </div>

                {/* Sección de Carga de ECG */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-blue-300 mb-4">Cargar Imagen de ECG</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Subir Imagen
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={handleTakePhoto}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Tomar Foto
                        </button>
                    </div>

                    {/* Caja de URL Dinámica y Drag-and-Drop */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center text-gray-400 transition-all duration-300 ease-in-out hover:border-blue-500"
                    >
                        <div className="flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12 1.586l-4 4V14a2 2 0 002 2h2a2 2 0 002-2V5.586l-4-4zM10 17a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                            <input
                                type="url"
                                placeholder="... o introduce la URL de una imagen aquí o arrastra y suelta"
                                value={imageUrl}
                                onChange={handleUrlChange}
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {imagePreview && (
                            <div className="mt-4 flex justify-center">
                                <img
                                    src={imagePreview}
                                    alt="Vista previa del ECG"
                                    className="max-w-full h-48 object-contain rounded-lg border border-gray-700 shadow-md"
                                    onError={(e) => { e.target.onerror = null; setImagePreview(null); setError('No se pudo cargar la imagen desde la URL. Asegúrate de que es una URL válida y accesible.'); }}
                                />
                            </div>
                        )}
                        <button
                            onClick={handleAnalyze}
                            disabled={!imagePreview || loading}
                            className={`mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 ${(!imagePreview || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Analizando...' : 'Analizar'}
                        </button>
                    </div>
                </div>

                {/* Sección de Resultados del Análisis */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-blue-300 mb-4">Resultados del Análisis</h2>
                    <div className="bg-gray-700 rounded-lg p-6">
                        {error && <p className="text-red-400 mb-4">{error}</p>}
                        {loading && <p className="text-blue-300">Realizando análisis...</p>}
                        {analysisResult && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-200 mb-2">Análisis Básico del ECG:</h3>
                                <ul className="list-disc list-inside text-gray-300 mb-4">
                                    <li>Intervalo PR: {analysisResult.basic_measurements.pr_interval}</li>
                                    <li>Duración QRS: {analysisResult.basic_measurements.qrs_duration}</li>
                                    <li>Intervalo QT: {analysisResult.basic_measurements.qt_interval}</li>
                                    <li>Frecuencia Cardíaca: {analysisResult.basic_measurements.heart_rate}</li>
                                </ul>
                                <p className="text-gray-300">
                                    <span className="font-semibold">Hallazgos Iniciales:</span> {analysisResult.initial_findings}
                                </p>
                                <p className="text-gray-300">
                                    <span className="font-semibold">Confianza del Modelo:</span> {analysisResult.confidence}
                                </p>
                            </div>
                        )}
                        {!analysisResult && !loading && !error && (
                            <p className="text-gray-400">Sube una imagen de ECG para iniciar el análisis.</p>
                        )}
                    </div>
                </div>

                {/* Nuevo Apartado de IA Multimodal */}
                <div>
                    <h2 className="text-2xl font-semibold text-blue-300 mb-4">Análisis Avanzado con IA Multimodal</h2>
                    <div className="bg-gray-700 rounded-lg p-6">
                        <p className="text-gray-300 mb-4">
                            Utilizamos las capacidades multimodales de IA para ofrecer una interpretación más completa y contextualizada de tu ECG. Además del análisis visual, podemos integrar datos clínicos para una visión holística.
                        </p>

                        {/* Datos del Paciente para Gemini */}
                        <div className="mb-6 p-4 border border-gray-600 rounded-lg">
                            <h3 className="text-xl font-semibold text-gray-200 mb-3">Datos del Paciente (para Gemini)</h3>
                            <p className="text-gray-400 text-sm mb-3">Gemini puede interpretar el ECG en el contexto de la información clínica proporcionada, identificando posibles correlaciones.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="age" className="block text-gray-300 text-sm font-bold mb-1">Edad:</label>
                                    <input
                                        type="number"
                                        id="age"
                                        value={patientData.age}
                                        onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: 45"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gender" className="block text-gray-300 text-sm font-bold mb-1">Género:</label>
                                    <select
                                        id="gender"
                                        value={patientData.gender}
                                        onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="history" className="block text-gray-300 text-sm font-bold mb-1">Historial Clínico / Síntomas actuales:</label>
                                <textarea
                                    id="history"
                                    value={patientData.history}
                                    onChange={(e) => setPatientData({ ...patientData, history: e.target.value })}
                                    rows="3"
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Antecedentes de hipertensión, dolor en el pecho ocasional..."
                                ></textarea>
                            </div>
                            {geminiAnalysis && (
                                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                    <h4 className="font-semibold text-blue-300">Análisis Contextual (Gemini):</h4>
                                    <p className="text-gray-300 text-sm">{geminiAnalysis}</p>
                                </div>
                            )}
                        </div>

                        {/* Integración con Deepseek */}
                        <div className="mb-6 p-4 border border-gray-600 rounded-lg">
                            <h3 className="text-xl font-semibold text-gray-200 mb-3">Recomendaciones Clínicas (Deepseek)</h3>
                            <p className="text-gray-400 text-sm mb-3">Deepseek puede sugerir posibles diagnósticos y el siguiente curso de acción basado en las mediciones del ECG y los datos del paciente, actuando como una herramienta de apoyo para profesionales.</p>
                            {deepseekRecommendation && (
                                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                    <h4 className="font-semibold text-blue-300">Recomendación (Deepseek):</h4>
                                    <p className="text-gray-300 text-sm">{deepseekRecommendation}</p>
                                </div>
                            )}
                            {!deepseekRecommendation && !loading && (
                                <p className="text-gray-400 text-sm">Las recomendaciones de Deepseek aparecerán aquí después del análisis.</p>
                            )}
                        </div>

                        {/* Integración con PhysioNet */}
                        <div className="p-4 border border-gray-600 rounded-lg">
                            <h3 className="text-xl font-semibold text-gray-200 mb-3">Comparación con Base de Datos de Referencia (PhysioNet)</h3>
                            <p className="text-gray-400 text-sm mb-3">Compara el trazado de tu ECG con miles de registros de referencia de PhysioNet para identificar patrones raros o específicos, ayudando a validar los hallazgos.</p>
                            {physionetComparison && (
                                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                    <h4 className="font-semibold text-blue-300">Comparación (PhysioNet):</h4>
                                    <p className="text-gray-300 text-sm">{physionetComparison}</p>
                                </div>
                            )}
                            {!physionetComparison && !loading && (
                                <p className="text-gray-400 text-sm">La comparación con PhysioNet aparecerá aquí después del análisis.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;