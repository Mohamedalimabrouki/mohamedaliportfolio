export function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  const status = document.querySelector('[data-contact-status]');
  const emailAddress = contactForm.dataset.email || 'contact@mohamedalimabrouki.com';
  const copiedMessage = contactForm.dataset.copiedMessage || '';
  const fallbackMessage = contactForm.dataset.fallbackMessage || '';

  const showStatus = (text) => {
    if (!status || !text) return;
    status.textContent = text;
    status.hidden = false;
  };

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    const base = contactForm.dataset.mailto || `mailto:${emailAddress}?subject=Enquiry`;
    const separator = base.includes('?') ? '&' : '?';
    const body = `${name ? `Name: ${name}\n` : ''}${email ? `Email: ${email}\n\n` : ''}${message}`;
    const composed = `${base}${separator}body=${encodeURIComponent(body)}`;

    // Copy the address first so the visitor always has a way to reach out,
    // even on a device with no mail app configured.
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(emailAddress)
        .then(() => showStatus(copiedMessage))
        .catch(() => showStatus(fallbackMessage));
    } else {
      showStatus(fallbackMessage);
    }

    // Open the draft in the mail app.
    window.location.href = composed;
  });
}
