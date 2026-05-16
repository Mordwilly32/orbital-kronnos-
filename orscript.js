const n0067 = window.location.pathname;
const n0068 = ['/', '/index.html'];

if (!n0068.includes(n0067) && n0067.length > 1 && !n0067.endsWith('/')) {
  document.body.innerHTML = '<div class="n0066"><h1>Este link o categoría no existe</h1><p>¿Quieres ir a la página web original?</p><a href="https://orbital-kronnos.com/">Ir a la página principal</a></div>';
} else {
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
}
