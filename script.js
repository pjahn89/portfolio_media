// Footer year
document.getElementById("y").textContent = new Date().getFullYear();

// Simple reveal-on-scroll
const els = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

els.forEach(el => io.observe(el));
