import PublicHeader from './PublicHeader';

function Testimonials() {
  return (
    <div className="page-container">
      <PublicHeader />
      <div className="page-content">
        <h1>Testimonios</h1>
        <div className="testimonial-item">
          <p>"La implementación de esta solución NFC revolucionó nuestra eficiencia operativa."</p>
          <p><strong>- Cliente A</strong></p>
        </div>
        <div className="testimonial-item">
          <p>"La seguridad mejoró significativamente desde que adoptamos su tecnología NFC."</p>
          <p><strong>- Cliente B</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;