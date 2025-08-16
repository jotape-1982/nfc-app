import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Mail, Info, LogIn } from 'lucide-react';

const PublicPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Handshake className="text-blue-600" size={32} />
            <span className="text-2xl font-bold text-gray-800">NFC Solutions</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
              Inicio
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
              Nosotros
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
              Contacto
            </Link>
            <Link
              to="/login"
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              <LogIn className="mr-2" size={16} />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 md:py-32 flex items-center justify-center text-center bg-white overflow-hidden">
        <div className="absolute inset-0 bg-blue-500 opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            Transforma tu Gestión con Tecnología NFC
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Simplificamos la gestión de activos y personal con soluciones innovadoras y seguras basadas en etiquetas de comunicación de campo cercano.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/contact"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-full shadow-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </header>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Sobre Nosotros
          </h2>
          <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-12 mt-12">
            <div className="md:w-1/2">
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                NFC Solutions es líder en la integración de tecnología NFC para optimizar procesos empresariales. Desde nuestro inicio, nos hemos comprometido a ofrecer herramientas robustas y fáciles de usar que mejoran la eficiencia, la seguridad y la trazabilidad.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Nuestra misión es empoderar a las empresas con soluciones inteligentes que transforman la forma en que gestionan sus activos y su personal, abriendo un mundo de posibilidades para la innovación y el crecimiento.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="w-full h-80 bg-blue-200 rounded-xl shadow-lg flex items-center justify-center text-blue-800 text-2xl font-semibold">
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto text-center px-6">
          <p>&copy; 2024 NFC Solutions. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPage;
