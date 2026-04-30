// NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
navToggle?.addEventListener('click', () => {
  navLinks?.classList.toggle('open');
  navLinks && (navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex');
});

// Redirect if already logged in
if (localStorage.getItem('azpkey_token')) {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') {
    // don't redirect from landing
  }
}
