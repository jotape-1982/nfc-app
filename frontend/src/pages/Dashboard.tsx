import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom'; // Importamos useLocation
import axios from 'axios';
import {
  Handshake,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Tag,
  BarChart2,
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode'; // Importamos jwtDecode para decodificar el token

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  empresa_id: number;
  exp: number;
}

// Definimos una interfaz para el tipo de respuesta de la API de empresa
interface EmpresaResponse {
    nombre: string;
}

const Dashboard = () => {
  const [empresa, setEmpresa] = useState('');
  const [rol, setRol] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token')); // Mantenemos el token en el estado local
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null); // Guardamos la información decodificada del token
  const navigate = useNavigate();
  const location = useLocation(); // Obtenemos el objeto de ubicación actual

  // Variable para determinar si estamos en la ruta raíz del dashboard
  const isDashboardRoot = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  useEffect(() => {
    const verifyTokenAndFetchData = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        navigate('/login');
        return;
      }

      try {
        const decoded: DecodedToken = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) {
          console.error("Token expirado, cerrando sesión.");
          handleLogout();
          return;
        }
        setToken(storedToken);
        setUserInfo(decoded);
        setRol(decoded.rol);

        // Se especifica el tipo de respuesta esperado para axios
        const response = await axios.get<EmpresaResponse>(`${API_URL}/empresa`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        setEmpresa(response.data.nombre);
      } catch (error) {
        console.error('Error al obtener datos de empresa o token inválido:', error);
        handleLogout();
      }
    };
    verifyTokenAndFetchData();
  }, [navigate]); // Dependencias del useEffect

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUserInfo(null);
    setRol('');
    navigate('/login');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-6 flex flex-col justify-between shadow-lg rounded-r-lg">
        <div>
          <div className="flex items-center space-x-2 mb-8">
            <Handshake className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-800">
              {empresa || 'Cargando...'}
            </span>
          </div>
          <nav>
            <ul>
              {/* Enlace para volver al dashboard principal */}
              <li className="mb-2">
                <Link
                  to="/dashboard"
                  className="flex items-center p-3 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <LayoutDashboard className="mr-3" size={20} />
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="nfc-tags"
                  className="flex items-center p-3 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <Tag className="mr-3" size={20} />
                  Gestionar Tags NFC
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="nfc-taps"
                  className="flex items-center p-3 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <BarChart2 className="mr-3" size={20} />
                  Datos de Taps
                </Link>
              </li>
              {rol === 'super_admin' && (
                <li className="mb-2">
                  <Link
                    to="admin-users"
                    className="flex items-center p-3 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors duration-200"
                  >
                    <Shield className="mr-3" size={20} />
                    Panel de Administración
                  </Link>
                </li>
              )}
              <li className="mb-2">
                <Link
                  to="settings"
                  className="flex items-center p-3 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <Settings className="mr-3" size={20} />
                  Configuración
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-red-600 bg-red-100 rounded-lg transition-colors duration-200 hover:bg-red-200"
          >
            <LogOut className="mr-3" size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content - Aquí se renderizarán los componentes de las rutas anidadas o el contenido principal del dashboard */}
      <main className="flex-1 p-8">
        {isDashboardRoot ? (
          <>
            {/* Contenido de bienvenida que se muestra por defecto */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Bienvenido, <span className="text-blue-600">{rol}</span>
            </h1>
            <p className="text-gray-600 mb-8">
              Desde aquí puedes administrar los tags NFC y el personal de tu empresa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Card for NFC Tags */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <Tag className="text-blue-500 mb-4" size={40} />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Gestionar Tags NFC
                </h2>
                <p className="text-gray-600 mb-4">
                  Crea, visualiza y edita los tags NFC asignados a tu empresa.
                </p>
                <Link
                  to="nfc-tags"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Ir a Tags NFC
                </Link>
              </div>

              {/* Card for Tap Data */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <BarChart2 className="text-purple-500 mb-4" size={40} />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Ver Datos de Taps
                </h2>
                <p className="text-gray-600 mb-4">
                  Analiza los datos de cada interacción con tus tags NFC.
                </p>
                <Link
                  to="nfc-taps"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Ir a Datos de Taps
                </Link>
              </div>

              {/* Card for Admin Panel */}
              {rol === 'super_admin' && (
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <Shield className="text-green-500 mb-4" size={40} />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Panel de Administración
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Administra a los usuarios y sus roles dentro de tu empresa.
                  </p>
                  <Link
                    to="admin-users"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Ir a Panel Admin
                  </Link>
                </div>
              )}
          </div>
          </>
        ) : (
          /* Aquí se renderizará el componente de la ruta anidada activa */
          <Outlet context={{ token, onLogout: handleLogout, userInfo }} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
