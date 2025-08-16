import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface NfcTap {
  id: number;
  tag_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  location_data: string | null;
}

interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  empresa_id: number;
  exp: number;
}

interface OutletContextType {
  token: string | null;
  onLogout: () => void;
  userInfo: DecodedToken | null;
}

function NfcTaps() {
  const [taps, setTaps] = useState<NfcTap[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { token, onLogout, userInfo } = useOutletContext<OutletContextType>();

  useEffect(() => {
    console.log("NfcTaps.tsx useEffect: START");
    console.log("NfcTaps.tsx useEffect: Token from context:", token);
    console.log("NfcTaps.tsx useEffect: UserInfo from context:", userInfo);

    if (!token || !userInfo) {
      console.log("NfcTaps.tsx: No hay token o userInfo en el contexto, redirigiendo a login.");
      onLogout();
      return;
    }

    try {
      if (userInfo.exp * 1000 < Date.now()) {
        console.error("NfcTaps.tsx: Token expirado, cerrando sesión.");
        onLogout();
        return;
      }
      if (userInfo.rol === 'super_admin' || userInfo.rol === 'admin') {
        fetchNfcTaps();
      } else {
        setError('No tienes permiso para ver los datos de taps NFC.');
      }
    } catch (e) {
      console.error("NfcTaps.tsx: Token inválido o error al decodificar en NfcTaps, cerrando sesión.", e);
      onLogout();
    }
    console.log("NfcTaps.tsx useEffect: END");
  }, [token, userInfo, navigate, onLogout]);

  const fetchNfcTaps = async () => {
    setError(null);
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/nfc-taps`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTaps(res.data);
    } catch (e) {
      console.error("NfcTaps.tsx: Error al cargar datos de taps:", e);
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          setError('Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.');
          onLogout();
        } else if (e.response?.status === 403) {
          setError('No tienes permiso para ver los datos de taps.');
        } else {
          setError(e.response?.data?.message || `Error al cargar datos de taps: ${e.message}`);
        }
      } else if (e instanceof Error) {
        setError(`Error de conexión: ${e.message}. Asegúrate de que el backend esté funcionando.`);
      } else {
        setError("Ocurrió un error desconocido al cargar datos de taps.");
      }
    }
  };

  return (
    <div className="dashboard-page-content">
      <h1>Datos de Taps NFC</h1>
      {error && <p className="error-message">{error}</p>}
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID del Tap</th>
              <th>ID del Tag NFC</th>
              <th>Fecha y Hora</th>
              <th>Dirección IP</th>
              <th>User Agent</th>
              <th>Ubicación (si disponible)</th>
            </tr>
          </thead>
          <tbody>
            {taps.length === 0 ? (
              <tr>
                <td colSpan={6}>No hay datos de taps disponibles.</td>
              </tr>
            ) : (
              taps.map((tap) => (
                <tr key={tap.id}>
                  <td>{tap.id}</td>
                  <td>{tap.tag_id}</td>
                  <td>{new Date(tap.timestamp).toLocaleString()}</td>
                  <td>{tap.ip_address || 'N/A'}</td>
                  <td>{tap.user_agent || 'N/A'}</td>
                  <td>{tap.location_data || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NfcTaps;
