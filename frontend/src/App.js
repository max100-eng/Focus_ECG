// Importar los módulos necesarios de React y Firebase
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Componente principal de la aplicación
const App = () => {
  // Estados para manejar la información de la aplicación
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [message, setMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);

  // Configuración y autenticación de Firebase
  useEffect(() => {
    // Definir las variables globales proporcionadas por el entorno de Canvas
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Función asíncrona para inicializar Firebase y autenticar al usuario
    const initializeFirebase = async () => {
      try {
        if (firebaseConfig) {
          const app = initializeApp(firebaseConfig);
          const authInstance = getAuth(app);
          const dbInstance = getFirestore(app);
          setAuth(authInstance);
          setDb(dbInstance);

          // Escuchar los cambios en el estado de autenticación
          onAuthStateChanged(authInstance, (user) => {
            if (user) {
              setUserId(user.uid);
            } else {
              setUserId(null);
            }
            setIsAuthReady(true);
          });

          // Autenticar con el token o de forma anónima si no hay token
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        }
      } catch (error) {
        console.error('Error al inicializar Firebase:', error);
      }
    };

    initializeFirebase();
  }, []);

  // Cargar datos de la base de datos una vez que la autenticación esté lista
  useEffect(() => {
    if (db && userId) {
      const docRef = doc(db, 'artifacts', 'default-app-id', 'users', userId, 'messages', 'chat-history');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessageHistory(data.history || []);
        } else {
          setMessageHistory([]);
        }
      }, (error) => {
        console.error('Error al escuchar el documento:', error);
      });
      return () => unsubscribe();
    }
  }, [db, userId]);

  // Manejar el envío de mensajes
  const handleSendMessage = async () => {
    if (!message.trim() || !userId) {
      console.log('Mensaje vacío o usuario no autenticado.');
      return;
    }

    const newMessageHistory = [...messageHistory, { text: message, user: userId, timestamp: new Date() }];
    const docRef = doc(db, 'artifacts', 'default-app-id', 'users', userId, 'messages', 'chat-history');

    try {
      await setDoc(docRef, { history: newMessageHistory }, { merge: true });
      setMessage('');
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    }
  };

  // Estructura de la interfaz de usuario
  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-gray-800 bg-gray-100 min-h-screen p-4 flex flex-col items-center">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          Chat de Prueba con Firebase
        </h1>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg max-h-80 overflow-y-auto border border-gray-200">
          {messageHistory.length > 0 ? (
            messageHistory.map((msg, index) => (
              <div key={index} className={`mb-2 p-3 rounded-lg ${msg.user === userId ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'}`}>
                <p className="font-semibold text-sm">
                  {msg.user === userId ? 'Tú' : 'Otro usuario'}
                </p>
                <p className="text-gray-800 break-words">{msg.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 italic">
              Empieza a chatear...
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Escribe tu mensaje aquí..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button
            className="bg-blue-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleSendMessage}
          >
            Enviar
          </button>
        </div>
        <div className="mt-4 text-center text-sm text-gray-600">
          Tu ID de usuario es: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId}</span>
        </div>
      </div>
    </div>
  );
};

export default App;