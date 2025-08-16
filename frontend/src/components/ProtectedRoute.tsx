    import React from 'react';
    import { Navigate } from 'react-router-dom';

    // Este componente recibe la página (componente) que queremos proteger como 'children'.
    interface ProtectedRouteProps {
      children: React.ReactNode;
    }

    const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
      // Verificamos si el token de acceso existe en el almacenamiento local.
      const token = localStorage.getItem('access_token');
      
      // Si no hay token, redirigimos al usuario a la página de login.
      if (!token) {
        return <Navigate to="/login" />;
      }

      // Si hay un token, permitimos que se muestre el componente 'children'.
      return <>{children}</>;
    };

    export default ProtectedRoute;
    