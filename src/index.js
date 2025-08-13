import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importa tus estilos globales, incluyendo Tailwind
import App from './App'; // Importa tu componente principal App

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);