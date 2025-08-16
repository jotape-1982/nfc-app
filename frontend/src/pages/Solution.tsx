import PublicHeader from './PublicHeader';

function Solution() {
  return (
    <div className="page-container">
      <PublicHeader />
      <div className="page-content">
        <h1>Nuestra Solución</h1>
        <p>
          Ofrecemos una solución completa para la gestión de NFC, permitiendo a las empresas interactuar con sus activos de manera inteligente y segura. Nuestras herramientas facilitan el seguimiento en tiempo real y la autenticación para optimizar procesos y mejorar la eficiencia.
        </p>
        <div className="feature">
          <h3>Interacción Inteligente</h3>
          <p>Facilita la comunicación y el acceso con un simple toque, optimizando flujos de trabajo.</p>
        </div>
        <div className="feature">
          <h3>Seguimiento Preciso</h3>
          <p>Obtén datos en tiempo real sobre el estado y la ubicación de tus activos.</p>
        </div>
        <div className="feature">
          <h3>Seguridad Reforzada</h3>
          <p>Implementa autenticación segura y control de acceso para proteger tu información.</p>
        </div>
      </div>
    </div>
  );
}

export default Solution;