import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';

const PublicHeader: React.FC = () => {
  return (
    <header className="public-nav">
      <Link to="/" className="logo-text">
        <Handshake className="inline-block mr-2 text-blue-600" size={24} />
        NFC Solutions
      </Link>
      <nav className="nav-links">
        <Link to="/" className="nav-link">Inicio</Link>
        <Link to="/about" className="nav-link">Quiénes Somos</Link>
        <Link to="/contact" className="nav-link">Contacto</Link>
      </nav>
      <Link to="/login" className="login-button">
        Iniciar Sesión
      </Link>
    </header>
  );
};

export default PublicHeader;
