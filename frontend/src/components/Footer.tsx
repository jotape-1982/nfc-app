import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-column">
          <h4>NFC Solutions</h4>
          <p>Innovando en la gestión de activos y personal con tecnología NFC.</p>
        </div>
        <div className="footer-column">
          <h4>Enlaces Rápidos</h4>
          <Link to="/">Inicio</Link>
          <Link to="/about">Quiénes Somos</Link>
          <Link to="/contact">Contacto</Link>
          <Link to="/login">Iniciar Sesión</Link>
        </div>
        <div className="footer-column">
          <h4>Contacto</h4>
          <p>Email: info@nfcsolutions.com</p>
          <p>Teléfono: +123 456 7890</p>
          <p>Dirección: Calle Falsa 123, Ciudad, País</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} NFC Solutions. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
