import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresa: string;
}

interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  empresa_id: number;
  exp: number;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Función para redirigir al login si no hay token o no es super_admin
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      if (decoded.rol !== 'super_admin') {
        setError('Acceso denegado: solo los super administradores pueden acceder a esta página.');
        // Opcional: Redirigir a /dashboard o /login
        navigate('/dashboard'); 
        return;
      }
      fetchUsers(token);
    } catch (e) {
      console.error("Token inválido o expirado, cerrando sesión.", e);
      localStorage.removeItem('access_token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchUsers = async (token: string) => {
    setIsUsersLoading(true);
    setError('');
    try {
      // RUTA CORREGIDA para coincidir con Flask: /api/admin/users
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err); // Log más detallado del error
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(
            err.response.data?.message || `Error del servidor: ${err.response.status}`
          );
          if (err.response.status === 401 || err.response.status === 403) {
            // Si el token es inválido o no autorizado, cerrar sesión
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
        setError('Ocurrió un error desconocido al cargar usuarios.');
      }
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No estás autenticado. Por favor, inicia sesión.');
      setIsLoading(false);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      if (decoded.rol !== 'super_admin') {
        setError('Permiso denegado para registrar usuarios.');
        setIsLoading(false);
        return;
      }

      // RUTA CORREGIDA para coincidir con Flask: /api/admin/register
      await axios.post(
        `${API_URL}/admin/register`,
        {
          nombre: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          rol_id: 2, // Por defecto, registramos como 'admin' (rol_id=2)
          empresa_id: decoded.empresa_id, // Misma empresa que el super_admin logueado
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('Usuario registrado con éxito.');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers(token); // Refresca la lista de usuarios
    } catch (err: any) {
      console.error("Error al crear usuarios:", err); // Log más detallado del error
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
        setError("Ocurrió un error desconocido al crear usuario.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    // NOTA: En un entorno de producción, window.confirm() debería ser reemplazado por un modal de confirmación personalizado para una mejor UX.
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar este usuario?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No estás autenticado.');
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      if (decoded.rol !== 'super_admin') {
        setError('Permiso denegado para eliminar usuarios.');
        return;
      }

      // RUTA CORREGIDA para coincidir con Flask: /api/admin/users/${id}
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Usuario eliminado con éxito.');
      fetchUsers(token); // Refresca la lista de usuarios
    } catch (err: any) {
      console.error("Error al eliminar usuarios:", err); // Log más detallado del error
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
        setError("Ocurrió un error desconocido al eliminar usuario.");
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200">
            <ArrowLeft className="mr-2" size={20} />
            Volver
          </Link>
          <div className="flex items-center space-x-2">
            <UserPlus className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
          </div>
          <div></div>
        </div>
        <p className="text-gray-600 mb-8 text-center">
          Administra los usuarios de tu empresa, crea nuevos y elimina los existentes.
        </p>

        {message && <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}
        {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Registrar Nuevo Usuario
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                id="newUserName"
                name="newUserName"
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="newUserEmail"
                name="newUserEmail"
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Ej: juan.perez@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="newUserPassword"
                name="newUserPassword"
                type="password"
                required
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="***********"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:bg-blue-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2" size={20} />}
              Registrar Usuario
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Usuarios Existentes
          </h2>
          {isUsersLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo Electrónico
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.rol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.empresa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
              No hay usuarios registrados para esta empresa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
