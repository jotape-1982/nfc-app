import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar simplificada para la página de nosotros */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Handshake className="text-blue-600" size={32} />
            <span className="text-2xl font-bold text-gray-800">NFC Solutions</span>
          </div>
          <Link
            to="/"
            className="px-4 py-2 text-white bg-blue-600 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Volver a Inicio
          </Link>
        </div>
      </nav>

      {/* Sección Nosotros completa */}
      <div className="container mx-auto px-6 py-20">
        <div className="bg-white p-12 rounded-2xl shadow-xl max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-4">
            <Handshake className="text-blue-600" size={80} />
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Sobre NFC Solutions
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Somos líderes en la integración de tecnología NFC para optimizar procesos empresariales. Nuestra misión es empoderar a las empresas con soluciones inteligentes que transforman la forma en que gestionan sus activos y su personal.
          </p>
          <div className="text-left mt-8 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Nuestra Misión</h2>
            <p className="text-md text-gray-700">
              Ofrecer herramientas robustas y fáciles de usar que mejoren la eficiencia, la seguridad y la trazabilidad, abriendo un mundo de posibilidades para la innovación y el crecimiento.
            </p>
            <h2 className="text-3xl font-bold text-gray-900">Nuestra Visión</h2>
            <p className="text-md text-gray-700">
              Ser el socio tecnológico preferido para empresas que buscan una gestión de activos y personal sin fisuras, a través de soluciones NFC de vanguardia.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto text-center px-6">
          <p>&copy; 2024 NFC Solutions. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
