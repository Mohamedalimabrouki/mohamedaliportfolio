export function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const message = data.get('message') || '';
    const base = contactForm.dataset.mailto || 'mailto:hello@mohamedalimabrouki.com?subject=Project%20enquiry';
    const separator = base.includes('?') ? '&' : '?';
    const composed = `${base}${separator}body=${encodeURIComponent(`${name ? `Name: ${name}
` : ''}${email ? `Email: ${email}

` : ''}${message}`)}`;
    window.location.href = composed;
  });
}