import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowLeft, Tag, MapPin, Calendar, Clock, Wifi } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface NfcTapData {
  id: number;
  tag_id: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  location_data: string | null;
  empresa_id: number;
}

interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  empresa_id: number;
  exp: number;
}

const NfcTapDataPage: React.FC = () => {
  const [taps, setTaps] = useState<NfcTapData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTaps = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const decoded: DecodedToken = jwtDecode(token);
        // No es necesario verificar el rol aquí si la ruta del backend ya lo hace,
        // pero es una buena práctica para la UX del frontend.
        // Si solo los super_admin pueden ver esto, podrías añadir:
        // if (decoded.rol !== 'super_admin' && decoded.rol !== 'admin') {
        //   setError('Acceso denegado: No tienes permiso para ver los datos de taps.');
        //   setIsLoading(false);
        //   return;
        // }

        // RUTA CORREGIDA: de /api/nfc/tap-events a /api/nfc-taps
        const response = await axios.get(`${API_URL}/nfc-taps`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTaps(response.data);
      } catch (err: any) {
        console.error("Error al cargar datos de taps NFC:", err);
        if (axios.isAxiosError(err)) {
          if (err.response) {
            setError(err.response.data?.message || `Error del servidor: ${err.response.status}`);
            if (err.response.status === 401 || err.response.status === 403) {
              localStorage.removeItem('access_token');
              navigate('/login');
            }
          } else if (err.request) {
            setError('Error de red: No se pudo conectar con el servidor. Asegúrate de que el backend esté funcionando.');
          } else {
            setError(`Error: ${err.message}`);
          }
        } else if (err instanceof Error) {
          setError(`Ocurrió un error inesperado: ${err.message}`);
        } else {
          setError('Ocurrió un error desconocido al cargar datos de taps.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaps();
  }, [navigate]);

  return (
    <div className="bg-gray-100 min-h-screen p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200">
            <ArrowLeft className="mr-2" size={20} />
            Volver al Dashboard
          </Link>
          <div className="flex items-center space-x-2">
            <Wifi className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">
              Datos de Taps NFC
            </h1>
          </div>
          <div></div> {/* Espaciador para centrar el título */}
        </div>
        <p className="text-gray-600 mb-8 text-center">
          Visualiza los registros de cada interacción con tus tags NFC.
        </p>

        {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : taps.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Tag className="inline-block mr-1" size={16} /> Tag ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="inline-block mr-1" size={16} /> Fecha/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <MapPin className="inline-block mr-1" size={16} /> Geolocalización
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taps.map((tap) => (
                  <tr key={tap.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tap.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tap.tag_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tap.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tap.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {tap.user_agent || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tap.location_data || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No hay datos de taps NFC registrados para esta empresa.
          </p>
        )}
      </div>
    </div>
  );
};

export default NfcTapDataPage;
