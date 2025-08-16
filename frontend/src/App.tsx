import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importa tus componentes de página
import PublicPage from './pages/PublicPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContactPage from './pages/ContactPage';
import AboutUs from './pages/AboutUs';
import NfcTagsPage from './pages/NfcTagsPage';
import NfcTapDataPage from './pages/NfcTapDataPage';
import AdminPanel from './pages/AdminPanel'; // Importamos AdminPanel
import PublicNfcRedirect from './pages/PublicNfcRedirect'; // **NUEVO: Importa el componente de redirección pública**

// Un componente para proteger rutas, asegurando que el usuario esté autenticado
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutUs />} />
        {/* **NUEVA RUTA PÚBLICA PARA EL TAP NFC** */}
        <Route path="/public-tap/:tagId" element={<PublicNfcRedirect />} />
        
        {/* Ruta Protegida para el Dashboard y sus Sub-rutas.
          El componente Dashboard actuará como el layout principal
          y <Outlet /> dentro de Dashboard renderizará las sub-rutas.
        */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Rutas Anidadas del Dashboard */}
          {/* Eliminamos la ruta index para que el Dashboard muestre su contenido por defecto */}
          <Route path="nfc-tags" element={<NfcTagsPage />} />
          <Route path="nfc-taps" element={<NfcTapDataPage />} />
          <Route path="admin-users" element={<AdminPanel />} /> {/* Usamos AdminPanel aquí */}
          {/* Puedes añadir más rutas anidadas aquí, por ejemplo: */}
          {/* <Route path="settings" element={<SettingsPage />} /> */}
        </Route>
        
        {/* Las rutas top-level /nfc-tags y /nfc-taps ya no son necesarias */}
        {/* y se manejarán como rutas anidadas bajo /dashboard */}
        
      </Routes>
    </Router>
  );
};

export default App;
