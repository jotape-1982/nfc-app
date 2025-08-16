import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom'; 
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface NfcTag {
  id: number;
  tag_id: string;
  data: string;
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

function NfcTags() { 
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [tagIdInput, setTagIdInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { token, onLogout, userInfo } = useOutletContext<OutletContextType>();

  useEffect(() => {
    console.log("NfcTags.tsx useEffect: START");
    console.log("NfcTags.tsx useEffect: Token from context:", token);
    console.log("NfcTags.tsx useEffect: UserInfo from context:", userInfo);

    if (!token || !userInfo) {
      console.log("NfcTags.tsx: No hay token o userInfo en el contexto, redirigiendo a login.");
      onLogout(); 
      return; 
    }

    try {
      if (userInfo.exp * 1000 < Date.now()) {
        console.error("NfcTags.tsx: Token expirado, cerrando sesión.");
        onLogout();
        return;
      }
      fetchNfcTags();
    } catch (e) {
      console.error("NfcTags.tsx: Error al verificar token o decodificar en NfcTags, cerrando sesión.", e);
      onLogout();
    }
    console.log("NfcTags.tsx useEffect: END");
  }, [token, userInfo, navigate, onLogout]); 

  const fetchNfcTags = async () => {
    setError(null);
    if (!token) { 
      navigate('/login');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/nfc-tags`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status !== 200) {
        throw new Error('Respuesta no exitosa del servidor'); 
      }
      setTags(res.data);
    } catch (e) {
      console.error("NfcTags.tsx: Error al cargar tags:", e);
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          setError(e.response?.data?.message || 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
          onLogout();
        } else if (e.response?.status === 403) {
          setError(e.response?.data?.message || 'No tienes permiso para ver los tags NFC.');
        } else if (e.response?.status === 422) {
          setError(e.response?.data?.message || 'Error de procesamiento de entidad al cargar tags. Verifica los datos de sesión.');
        } else if (e.response?.status === 500) {
          setError(e.response?.data?.message || 'Error interno del servidor al cargar tags.');
        } else {
          setError(e.response?.data?.message || `Error desconocido al cargar tags NFC: ${e.response?.status}`);
        }
      } else if (e instanceof Error) {
        setError(`Error de conexión: ${e.message}. Asegúrate de que el backend esté funcionando.`);
      } else {
        setError("Ocurrió un error desconocido al cargar tags.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      navigate('/login');
      return;
    }
    if (!tagIdInput) {
      setError('Por favor, ingresa el ID del tag.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/nfc-tags`, {
        tag_id: tagIdInput, 
        data: dataInput 
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.status !== 201) {
        throw new Error('Respuesta no exitosa del servidor');
      }

      setTagIdInput('');
      setDataInput('');
      fetchNfcTags(); 
    } catch (e) {
      console.error("NfcTags.tsx: Error al crear tags:", e);
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          setError(e.response?.data?.message || 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
          onLogout();
        } else if (e.response?.status === 403) {
          setError(e.response?.data?.message || 'No tienes permiso para crear tags NFC.');
        } else if (e.response?.status === 422) {
          setError(e.response?.data?.message || 'Error de procesamiento de entidad al crear tag. Verifica los datos.');
        } else if (e.response?.status === 500) {
          setError(e.response?.data?.message || 'Error interno del servidor al crear tag.');
        } else {
          setError(e.response?.data?.message || `Error desconocido al crear tag NFC: ${e.response?.status}`);
        }
      } else if (e instanceof Error) {
        setError(`Error de conexión: ${e.message}. Asegúrate de que el backend esté funcionando.`);
      } else {
        setError("Ocurrió un error desconocido al crear tag.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.delete(`${API_URL}/nfc-tags/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.status !== 200) {
        throw new Error('Respuesta no exitosa del servidor');
      }

      fetchNfcTags(); 
    } catch (e) {
      console.error("NfcTags.tsx: Error al eliminar tags:", e);
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          setError(e.response?.data?.message || 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
          onLogout();
        } else if (e.response?.status === 403) {
          setError(e.response?.data?.message || 'No tienes permiso para eliminar tags NFC.');
        } else if (e.response?.status === 422) {
          setError(e.response?.data?.message || 'Error de procesamiento de entidad al eliminar tag. Verifica los datos.');
        } else if (e.response?.status === 500) {
          setError(e.response?.data?.message || 'Error interno del servidor al eliminar tag.');
        } else {
          setError(e.response?.data?.message || `Error desconocido al eliminar tag NFC: ${e.response?.status}`);
        }
      } else if (e instanceof Error) {
        setError(`Error de conexión: ${e.message}. Asegúrate de que el backend esté funcionando.`);
      } else {
        setError("Ocurrió un error desconocido al eliminar tag.");
      }
    }
  };

  return (
    <div className="dashboard-page-content">
      <h1>Gestión de Tags NFC</h1>
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit} className="dashboard-form">
        <input
          type="text"
          value={tagIdInput}
          onChange={(e) => setTagIdInput(e.target.value)}
          placeholder="ID del Tag NFC"
          required
        />
        <textarea
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          placeholder="Datos del Tag (opcional)"
        />
        <button type="submit" className="primary-button">
          Crear Tag
        </button>
      </form>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tag ID</th>
              <th>Datos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td>{tag.id}</td>
                <td>{tag.tag_id}</td>
                <td>{tag.data || 'N/A'}</td>
                <td>
                  <button onClick={() => handleDelete(tag.id)} className="secondary-button">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NfcTags;
