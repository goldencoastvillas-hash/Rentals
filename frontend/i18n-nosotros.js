/**
 * Contenido HTML de "Nosotros" por idioma (misma estructura semántica).
 * Se inyecta en #nosotros-mount al aplicar traducciones.
 */
export const NOSOTROS_HTML = {
  es: `
        <header class="about-hero">
          <p class="about-kicker">🌴 Nosotros</p>
          <h1>Golden Coast Villas Miami</h1>
          <p class="about-lead">
            Creemos que el lujo no es solo un lugar… es una <strong>experiencia</strong>. Somos una marca enfocada en ofrecer
            <strong>propiedades exclusivas en Miami</strong>, diseñadas para quienes buscan algo más que hospedarse: buscan
            <strong>disfrutar, celebrar y crear momentos inolvidables</strong>. Cada una de nuestras villas ha sido seleccionada
            cuidadosamente para garantizar comodidad, privacidad y un estándar alto de calidad.
          </p>
        </header>
        <p class="about-slogan">Cupos limitados. Experiencias ilimitadas. 🌴✨</p>
        <article class="about-block">
          <h2>✨ ¿Quiénes somos?</h2>
          <p>
            Somos un equipo apasionado por el <strong>turismo de lujo</strong>, la hospitalidad y el detalle. Nos especializamos en
            conectar a nuestros huéspedes con espacios únicos, ideales para viajes en grupo, vacaciones premium o celebraciones
            especiales.
          </p>
          <p>Más que alquileres, ofrecemos <strong>experiencias completas</strong>, pensadas para que no tengas que preocuparte por nada.</p>
        </article>
        <article class="about-block">
          <h2>🚀 ¿Qué buscamos?</h2>
          <p>Nuestra misión es clara: <strong>elevar la forma en la que las personas viven sus viajes</strong>.</p>
          <p>Queremos que cada estadía sea:</p>
          <ul class="about-pill-list">
            <li>Exclusiva</li>
            <li>Cómoda</li>
            <li>Memorable</li>
          </ul>
          <p style="margin-top: 1rem">Y sobre todo, que sientas que elegiste <strong>el lugar correcto</strong> desde el primer momento.</p>
        </article>
        <article class="about-block">
          <h2>🤝 Vive la experiencia Golden Coast</h2>
          <p>
            Si estás buscando una villa para tu próximo viaje o quieres conocer más sobre nuestras propiedades, estamos aquí para
            ayudarte.
          </p>
          <p>
            Puedes <strong>agendar una asesoría personalizada</strong> con nuestro equipo, donde te guiaremos para encontrar la opción
            perfecta según tus necesidades.
          </p>
          <div class="about-cta-box">
            <p>👉 <strong>Agenda con nosotros</strong> y descubre tu próxima experiencia en Miami.</p>
            <a href="mailto:goldencoastvillas@gmail.com?subject=Asesor%C3%ADa%20Golden%20Coast%20Villas">Escribir a goldencoastvillas@gmail.com</a>
            ·
            <a href="https://wa.me/573026661995" target="_blank" rel="noreferrer">WhatsApp +57 302 6691995</a>
          </div>
        </article>
        <article class="about-block">
          <h2>🚀 Mucho más que una villa</h2>
          <p>Nuestros servicios no terminan con tu hospedaje.</p>
          <p>
            En Golden Coast Villas Miami hemos creado un <strong>ecosistema</strong> pensado para elevar toda tu experiencia en Estados
            Unidos:
          </p>
          <div class="about-services-grid">
            <div class="about-service-item">
              <span aria-hidden="true">🚘</span>
              <span><strong>Alquiler de carros de lujo</strong> para que te muevas con estilo.</span>
            </div>
            <div class="about-service-item">
              <span aria-hidden="true">🧑‍✈️</span>
              <span><strong>Servicio de conductor privado</strong> para mayor comodidad y seguridad.</span>
            </div>
            <div class="about-service-item">
              <span aria-hidden="true">🛂</span>
              <span><strong>Asesoría en trámites migratorios</strong>, ideal si estás considerando extender tu estadía o establecerte en EE.&nbsp;UU.</span>
            </div>
          </div>
          <p style="margin-top: 1rem">Nuestro objetivo es que vivas Miami <strong>sin límites</strong>, con todo resuelto desde el primer momento.</p>
        </article>
        <div class="about-split">
          <article class="about-card" aria-labelledby="about-para-quien">
            <h2 id="about-para-quien">💎 Para quién es esto</h2>
            <p style="margin-bottom: 0.5rem">Esto es para ti si:</p>
            <ul class="about-check-list">
              <li>Viajas en grupo y quieres <strong>privacidad + exclusividad</strong>.</li>
              <li>Buscas una <strong>experiencia diferente</strong>, no un hotel común.</li>
              <li>Quieres <strong>comodidad, lujo y cero complicaciones</strong>.</li>
              <li>Estás explorando <strong>oportunidades en EE.&nbsp;UU.</strong></li>
            </ul>
          </article>
          <article class="about-card" aria-labelledby="about-diferencial">
            <h2 id="about-diferencial">⚠️ Nuestro diferencial</h2>
            <div class="about-diff">
              <p>La mayoría llega a Miami <strong>improvisando</strong>… pierde tiempo, dinero y vive una experiencia promedio.</p>
            </div>
            <p style="margin-top: 1rem">
              <strong>Con nosotros, todo está diseñado antes de tu llegada.</strong><br />
              Tú solo llegas a disfrutar.
            </p>
          </article>
        </div>
        <footer class="site-footer">
          <p><strong>Contacto</strong></p>
          <p>WhatsApp: <a href="https://wa.me/573026661995" target="_blank" rel="noreferrer">+57 302 6691995</a></p>
          <p>Correo: <a href="mailto:goldencoastvillas@gmail.com">goldencoastvillas@gmail.com</a></p>
          <p class="legal">Nos reservamos todos los derechos © <span class="year-nosotros"></span> Golden Coast Villas Rentals.</p>
        </footer>
  `,
  en: `
        <header class="about-hero">
          <p class="about-kicker">🌴 About us</p>
          <h1>Golden Coast Villas Miami</h1>
          <p class="about-lead">
            We believe luxury is not just a place—it is an <strong>experience</strong>. We are a brand focused on offering
            <strong>exclusive properties in Miami</strong>, designed for guests who want more than a place to sleep: they want to
            <strong>enjoy, celebrate, and create unforgettable moments</strong>. Every villa has been carefully selected to ensure comfort, privacy, and a high standard of quality.
          </p>
        </header>
        <p class="about-slogan">Limited availability. Unlimited experiences. 🌴✨</p>
        <article class="about-block">
          <h2>✨ Who we are</h2>
          <p>
            We are a team passionate about <strong>luxury travel</strong>, hospitality, and detail. We specialize in connecting guests with unique spaces—ideal for group trips, premium vacations, or special celebrations.
          </p>
          <p>Beyond rentals, we offer <strong>end-to-end experiences</strong> so you do not have to worry about a thing.</p>
        </article>
        <article class="about-block">
          <h2>🚀 What we pursue</h2>
          <p>Our mission is clear: <strong>elevate the way people experience travel</strong>.</p>
          <p>We want every stay to be:</p>
          <ul class="about-pill-list">
            <li>Exclusive</li>
            <li>Comfortable</li>
            <li>Memorable</li>
          </ul>
          <p style="margin-top: 1rem">Above all, we want you to feel you chose <strong>the right place</strong> from the very first moment.</p>
        </article>
        <article class="about-block">
          <h2>🤝 Live the Golden Coast experience</h2>
          <p>
            If you are looking for a villa for your next trip or want to learn more about our properties, we are here to help.
          </p>
          <p>
            You can <strong>book a personalized consultation</strong> with our team—we will guide you to find the best option for your needs.
          </p>
          <div class="about-cta-box">
            <p>👉 <strong>Book with us</strong> and discover your next Miami experience.</p>
            <a href="mailto:goldencoastvillas@gmail.com?subject=Golden%20Coast%20Villas%20consultation">Email goldencoastvillas@gmail.com</a>
            ·
            <a href="https://wa.me/573026661995" target="_blank" rel="noreferrer">WhatsApp +57 302 6691995</a>
          </div>
        </article>
        <article class="about-block">
          <h2>🚀 More than a villa</h2>
          <p>Our services do not end with your stay.</p>
          <p>
            At Golden Coast Villas Miami we have built an <strong>ecosystem</strong> designed to elevate your entire experience in the United States:
          </p>
          <div class="about-services-grid">
            <div class="about-service-item">
              <span aria-hidden="true">🚘</span>
              <span><strong>Luxury car rentals</strong> so you can move in style.</span>
            </div>
            <div class="about-service-item">
              <span aria-hidden="true">🧑‍✈️</span>
              <span><strong>Private driver service</strong> for comfort and safety.</span>
            </div>
            <div class="about-service-item">
              <span aria-hidden="true">🛂</span>
              <span><strong>Immigration guidance</strong>, ideal if you are considering extending your stay or relocating to the U.S.</span>
            </div>
          </div>
          <p style="margin-top: 1rem">Our goal is for you to experience Miami <strong>without limits</strong>, with everything sorted from day one.</p>
        </article>
        <div class="about-split">
          <article class="about-card" aria-labelledby="about-para-quien">
            <h2 id="about-para-quien">💎 Who this is for</h2>
            <p style="margin-bottom: 0.5rem">This is for you if:</p>
            <ul class="about-check-list">
              <li>You travel in a group and want <strong>privacy + exclusivity</strong>.</li>
              <li>You want a <strong>different experience</strong>, not a typical hotel.</li>
              <li>You want <strong>comfort, luxury, and zero hassle</strong>.</li>
              <li>You are exploring <strong>opportunities in the U.S.</strong></li>
            </ul>
          </article>
          <article class="about-card" aria-labelledby="about-diferencial">
            <h2 id="about-diferencial">⚠️ Our difference</h2>
            <div class="about-diff">
              <p>Most people arrive in Miami <strong>without a plan</strong>… they waste time and money and get an average experience.</p>
            </div>
            <p style="margin-top: 1rem">
              <strong>With us, everything is designed before you arrive.</strong><br />
              You just show up and enjoy.
            </p>
          </article>
        </div>
        <footer class="site-footer">
          <p><strong>Contact</strong></p>
          <p>WhatsApp: <a href="https://wa.me/573026661995" target="_blank" rel="noreferrer">+57 302 6691995</a></p>
          <p>Email: <a href="mailto:goldencoastvillas@gmail.com">goldencoastvillas@gmail.com</a></p>
          <p class="legal">All rights reserved © <span class="year-nosotros"></span> Golden Coast Villas Rentals.</p>
        </footer>
  `,
};
