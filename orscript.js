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