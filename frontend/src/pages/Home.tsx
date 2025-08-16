import PublicHeader from './PublicHeader';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-page-container">
      <PublicHeader />
      
      <div className="main-content">
        {/* Sección principal de banner */}
        <section className="hero-section">
          <div className="hero-image">
             {/* Imagen de fondo aquí */}
          </div>
          <div className="hero-card">
            <h1>Descubre el poder de NFC</h1>
            <p>Simplifica la gestión de tus activos y la seguridad de tu empresa con nuestra solución NFC.</p>
            <Link to="/login" className="hero-cta-button">Acceder</Link>
          </div>
        </section>

        {/* Sección de tarjetas de características */}
        <section id="solution" className="cards-section">
          <h2>Soluciones diseñadas para ti</h2>
          <div className="card-grid">
            <div className="card">
              <img src="https://picsum.photos/300/150" alt="Solución 1" />
              <h3>Seguimiento de Activos</h3>
              <p>Monitorea y gestiona tus activos en tiempo real con tags inteligentes.</p>
              <a href="#" className="card-link">Saber más →</a>
            </div>
            <div className="card">
              <img src="https://picsum.photos/300/150" alt="Solución 2" />
              <h3>Control de Acceso</h3>
              <p>Asegura tus instalaciones con un sistema de acceso basado en NFC.</p>
              <a href="#" className="card-link">Saber más →</a>
            </div>
            <div className="card">
              <img src="https://picsum.photos/300/150" alt="Solución 3" />
              <h3>Experiencias Interactivas</h3>
              <p>Crea experiencias de usuario únicas en eventos o puntos de venta.</p>
              <a href="#" className="card-link">Saber más →</a>
            </div>
            <div className="card">
              <img src="https://picsum.photos/300/150" alt="Solución 4" />
              <h3>Gestión de Personal</h3>
              <p>Simplifica la entrada y salida de tus empleados y controla el acceso a áreas restringidas.</p>
              <a href="#" className="card-link">Saber más →</a>
            </div>
          </div>
        </section>

        {/* Sección "Quiénes Somos" */}
        <section id="about" className="about-section">
          <div className="about-content">
            <h2>Quiénes Somos</h2>
            <p>Somos una empresa líder en soluciones tecnológicas, comprometida con la innovación y la seguridad. Nuestro equipo de expertos está dedicado a crear herramientas NFC que transforman la forma en que interactúas con tu entorno.</p>
            <a href="#" className="about-cta-button">Conocer al equipo</a>
          </div>
        </section>

        {/* Sección de Contacto */}
        <section id="contact" className="contact-section">
          <h2>Contáctanos</h2>
          <form className="contact-form">
            <input type="text" placeholder="Nombre" />
            <input type="email" placeholder="Correo Electrónico" />
            <textarea placeholder="Mensaje"></textarea>
            <button type="submit" className="contact-submit-button">Enviar Mensaje</button>
          </form>
        </section>

        {/* Pie de página (Footer) */}
        <footer className="main-footer">
          <div className="footer-content">
            <div className="footer-column">
              <h4>Soluciones</h4>
              <a href="#">Seguimiento</a>
              <a href="#">Acceso</a>
              <a href="#">Marketing</a>
            </div>
            <div className="footer-column">
              <h4>Empresa</h4>
              <a href="#">Quiénes Somos</a>
              <a href="#">Empleos</a>
              <a href="#">Prensa</a>
            </div>
            <div className="footer-column">
              <h4>Soporte</h4>
              <a href="#">Contacto</a>
              <a href="#">FAQ</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} NFC Portal. Todos los derechos reservados.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;