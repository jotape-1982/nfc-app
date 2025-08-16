import PublicHeader from './PublicHeader';

function Contact() {
  return (
    <div className="page-container">
      <PublicHeader />
      <div className="page-content">
        <h1>Contáctanos</h1>
        <form className="contact-form">
          <input type="text" placeholder="Nombre" />
          <input type="email" placeholder="Correo Electrónico" />
          <textarea placeholder="Mensaje"></textarea>
          <button type="submit">Enviar Mensaje</button>
        </form>
      </div>
    </div>
  );
}

export default Contact;