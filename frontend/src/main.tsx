import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; 
import './App.css'; 

// El código del logger del cliente se ha movido o simplificado para depuración directa en PublicNfcRedirect.tsx
// No hay intercepción global de console.log aquí por ahora.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
