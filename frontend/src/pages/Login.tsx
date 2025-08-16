import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { LogIn as LogInIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react'; 

// **CAMBIO CLAVE:** Elimina el fallback a 'http://localhost:5000/api'
// Ahora Vite debería inyectar el valor correcto de VITE_API_URL desde el build
const API_URL = import.meta.env.VITE_API_URL; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log("Login.tsx: Intentando iniciar sesión para:", email);
      console.log("Login.tsx: API_URL utilizada:", API_URL); // Añadir log para verificar la URL

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const data = response.data;
        localStorage.setItem('access_token', data.access_token);
        console.log("Login.tsx: Inicio de sesión exitoso. Token recibido y guardado en localStorage.");
        
        setTimeout(() => {
          navigate('/dashboard');
          console.log("Login.tsx: Navegado a /dashboard después del retraso.");
        }, 100); 
        
      } else {
        setError(response.data.message || 'Credenciales inválidas');
        console.error("Login.tsx: Error de respuesta del servidor (no 200 pero sin error Axios):", response.data);
      }
    } catch (err: unknown) {
      console.error("Login.tsx: Error durante el inicio de sesión:", err);
      if (err instanceof AxiosError) {
        if (err.response) {
          setError((err.response.data as any)?.message || 'Error de inicio de sesión');
          console.error("Login.tsx: Error de respuesta Axios:", err.response.data);
        } else if (err.request) {
          setError('No hay respuesta del servidor. Verifica que el backend esté corriendo.');
          console.error("Login.tsx: No hay respuesta del servidor:", err.request);
        } else {
          setError('Error al configurar la solicitud.');
          console.error("Login.tsx: Error al configurar la solicitud:", err.message);
        }
      } else if (err instanceof Error) {
        setError(`Error desconocido: ${err.message}`);
      } else {
        setError("Ocurrió un error desconocido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <LogInIcon className="text-blue-600" size={64} /> 
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">NFC Solutions</h2>
        <p className="text-lg text-center text-gray-600 mb-8">Iniciar Sesión</p>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition duration-200"
              placeholder="Correo Electrónico"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition duration-200"
              placeholder="Contraseña"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:bg-blue-300"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-3" />
            ) : (
              <LogInIcon className="h-5 w-5 mr-3" />
            )}
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
