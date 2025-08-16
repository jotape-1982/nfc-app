import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuración del servidor de desarrollo
  server: {
    // Asegura que el frontend se ejecute en el puerto 5173
    port: 5173,
    // **CAMBIO CLAVE AQUÍ:**
    // Permite que el servidor sea accesible desde otras IPs (útil en Docker para acceso externo)
    host: '0.0.0.0', // Escuchar en todas las interfaces de red
    // Proxy para redirigir las solicitudes a la API al backend
    proxy: {
      '/api': {
        // La URL de tu backend en Docker
        target: 'http://backend:5000', 
        // Cambia el origen del host a la URL de destino
        changeOrigin: true, 
        // Opcional: reescribe la ruta si tu backend no usa '/api'
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
  // Configuración de la construcción para entornos de producción
  build: {
    // Define el directorio de salida para los archivos construidos
    outDir: 'dist', 
    // Habilita la generación de mapas de origen (source maps) para depuración
    sourcemap: true, 
  },
  // Configuración de resolución para alias de rutas (opcional)
  resolve: {
    alias: {
      // '@': '/src', // Ejemplo de alias si quisieras usar rutas absolutas como import '@/components/MyComponent'
    },
  },
});
