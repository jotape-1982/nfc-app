import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Tag, PlusCircle, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface NfcTagData {
  id: number;
  tag_id: string;
  data: string;
  public_url: string;
  empresa_id: number;
}

interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  empresa_id: number;
  exp: number;
}

const NfcTagsPage: React.FC = () => {
  const [tags, setTags] = useState<NfcTagData[]>([]);
  const [newTagId, setNewTagId] = useState<string>('');
  const [newTagName, setNewTagName] = useState<string>(''); // Corresponds to 'data' field in backend
  const [newPublicUrl, setNewPublicUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isTagsLoading, setIsTagsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Effect to fetch tags when component mounts or token changes
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      // Optional: Add role check if only specific roles can access this page
      // if (decoded.rol !== 'super_admin' && decoded.rol !== 'admin') {
      //   setError('Access denied: You do not have permission to view NFC tags.');
      //   setIsTagsLoading(false);
      //   return;
      // }
      fetchTags(token);
    } catch (e) {
      console.error("Token invalid or expired, logging out.", e);
      localStorage.removeItem('access_token');
      navigate('/login');
    }
  }, [navigate]);

  // Function to fetch NFC tags from the backend
  const fetchTags = async (currentToken: string) => {
    setIsTagsLoading(true);
    setError('');
    try {
      const response = await axios.get<NfcTagData[]>(`${API_URL}/nfc-tags`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      setTags(response.data);
    } catch (err: unknown) {
      console.error("Error fetching NFC tags:", err);
      if (err instanceof AxiosError) {
        if (err.response) {
          setError(
            (err.response.data as any)?.message || `Server error: ${err.response.status}`
          );
          if (err.response.status === 401 || err.response.status === 403) {
            localStorage.removeItem('access_token');
            navigate('/login');
          }
        } else if (err.request) {
          setError('Network error: Could not connect to the server. Please ensure the backend is running.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred while fetching NFC tags.');
      }
    } finally {
      setIsTagsLoading(false);
    }
  };

  // Function to handle new NFC tag submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You are not authenticated. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      // Only super_admin and admin roles can add tags
      if (decoded.rol !== 'super_admin' && decoded.rol !== 'admin') {
        setError('Permission denied to register NFC tags.');
        setIsLoading(false);
        return;
      }

      // RUTA CORREGIDA: de /api/nfc/register-tag a /api/nfc-tags
      await axios.post(
        `${API_URL}/nfc-tags`, // Corrected API endpoint
        {
          tagId: newTagId,
          tagName: newTagName, // 'data' field in backend
          publicUrl: newPublicUrl,
          empresa_id: decoded.empresa_id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('NFC Tag registered successfully.');
      setNewTagId('');
      setNewTagName('');
      setNewPublicUrl('');
      fetchTags(token); // Refresh the list of tags
    } catch (err: unknown) {
      console.error("Error registering NFC tag:", err);
      if (err instanceof AxiosError) {
        if (err.response) {
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
          if (err.response.status === 401 || err.response.status === 403) {
            localStorage.removeItem('access_token');
            navigate('/login');
          }
        } else if (err.request) {
          setError('Network error: Could not connect to the server. Please ensure the backend is running.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred while registering NFC tag.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle NFC tag deletion
  const handleDeleteTag = async (id: number) => {
    setError('');
    const confirmDelete = window.confirm('Are you sure you want to delete this NFC tag?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You are not authenticated.');
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      // Only super_admin and admin roles can delete tags
      if (decoded.rol !== 'super_admin' && decoded.rol !== 'admin') {
        setError('Permission denied to delete NFC tags.');
        return;
      }

      await axios.delete(`${API_URL}/nfc-tags/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('NFC Tag deleted successfully.');
      fetchTags(token); // Refresh the list of tags
    } catch (err: unknown) {
      console.error("Error deleting NFC tag:", err);
      if (err instanceof AxiosError) {
        if (err.response) {
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
          if (err.response.status === 401 || err.response.status === 403) {
            localStorage.removeItem('access_token');
            navigate('/login');
          }
        } else if (err.request) {
          setError('Network error: Could not connect to the server. Please ensure the backend is running.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred while deleting NFC tag.');
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          {/* Botón para volver al Dashboard */}
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200">
            <ArrowLeft className="mr-2" size={20} />
            Volver al Dashboard
          </Link>
          <div className="flex items-center space-x-2">
            <Tag className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Tags NFC
            </h1>
          </div>
          <div></div> {/* Espaciador para centrar el título */}
        </div>
        <p className="text-gray-600 mb-8 text-center">
          Crea, visualiza y elimina los tags NFC para tu empresa.
        </p>

        {message && <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}
        {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Registrar Nuevo Tag NFC
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newTagId" className="block text-sm font-medium text-gray-700">
                ID del Tag (Único)
              </label>
              <input
                id="newTagId"
                name="newTagId"
                type="text"
                required
                value={newTagId}
                onChange={(e) => setNewTagId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Ej: tag-restaurante-mesa-01"
              />
            </div>
            <div>
              <label htmlFor="newTagName" className="block text-sm font-medium text-gray-700">
                Nombre/Descripción del Tag
              </label>
              <input
                id="newTagName"
                name="newTagName"
                type="text"
                required
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Ej: Menú Digital Mesa 5"
              />
            </div>
            <div>
              <label htmlFor="newPublicUrl" className="block text-sm font-medium text-gray-700">
                URL Pública de Redirección
              </label>
              <input
                id="newPublicUrl"
                name="newPublicUrl"
                type="url"
                required
                value={newPublicUrl}
                onChange={(e) => setNewPublicUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Ej: https://tudominio.com/menu/restaurante-x"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:bg-blue-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2" size={20} />}
              Registrar Tag NFC
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Tags NFC Existentes
          </h2>
          {isTagsLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : tags.length > 0 ? (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL Pública
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tag.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tag.tag_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tag.data}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 hover:underline cursor-pointer truncate max-w-xs" onClick={() => window.open(tag.public_url, '_blank')}>
                        {tag.public_url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay tags NFC registrados para esta empresa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NfcTagsPage;
