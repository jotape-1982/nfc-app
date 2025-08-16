import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Handshake } from 'lucide-react';

const ContactPage: React.FC = () => {
  // Estado para guardar los datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Estado para manejar el mensaje de éxito o error al enviar
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Función que se encarga de actualizar el estado cada vez que se escribe en un campo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('idle');

    // Aquí iría la lógica real para enviar el formulario a tu API.
    // Por ahora, solo simulamos una respuesta exitosa.
    try {
      // Por ejemplo, podrías hacer un fetch o un axios.post aquí
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      //
      // if (response.ok) {
      //   setStatus('success');
      //   setFormData({ name: '', email: '', subject: '', message: '' });
      // } else {
      //   setStatus('error');
      // }

      // Simulación de envío exitoso
      console.log('Formulario enviado:', formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar simplificada para la página de contacto */}
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

      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-xl space-y-8">
          <div className="text-center">
            <Mail className="text-blue-600 mx-auto mb-4" size={64} />
            <h1 className="text-4xl font-extrabold text-gray-900">
              Contáctanos
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Estamos aquí para ayudarte. Rellena el formulario y te responderemos lo antes posible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Asunto</label>
              <input
                type="text"
                name="subject"
                id="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensaje</label>
              <textarea
                name="message"
                id="message"
                rows={4}
                required
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
              ></textarea>
            </div>
            {status === 'success' && (
              <p className="text-green-600 text-center font-bold">¡Mensaje enviado con éxito!</p>
            )}
            {status === 'error' && (
              <p className="text-red-600 text-center font-bold">Ocurrió un error. Por favor, inténtelo de nuevo.</p>
            )}
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
            >
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
