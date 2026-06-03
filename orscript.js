const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('n0058');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.n0022, .n0059').forEach(el => io.observe(el));

const goal = document.querySelector('.n0047');
if (goal) {
  const io2 = new IntersectionObserver((entries) => {
    entries.forEach(e => { 
      if (e.isIntersecting) { 
        e.target.classList.add('n0057'); 
        io2.unobserve(e.target); 
      } 
    });
  }, { threshold: 0.3 });
  io2.observe(goal);
}

const header = document.querySelector('.n0001');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) header.classList.add('n0056');
  else header.classList.remove('n0056');
});

function toggleMobileNav() {
  const burger = document.getElementById('burgerBtn');
  const nav = document.getElementById('mobileNav');
  const isOpen = burger.getAttribute('aria-expanded') === 'true';
  
  burger.setAttribute('aria-expanded', !isOpen);
  nav.setAttribute('aria-hidden', isOpen);
}

function closeMobileNav() {
  const burger = document.getElementById('burgerBtn');
  const nav = document.getElementById('mobileNav');
  
  burger.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-hidden', 'true');
}

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burgerBtn');
  if (burger) {
    burger.addEventListener('click', toggleMobileNav);
  }
  
  document.addEventListener('click', (e) => {
    const burger = document.getElementById('burgerBtn');
    const nav = document.getElementById('mobileNav');
    if (burger && nav && !burger.contains(e.target) && !nav.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
    }
  });
});
