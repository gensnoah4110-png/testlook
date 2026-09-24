(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const body = document.body;
  const nav = $('.nav');
  const menu = $('.menu');
  const mobile = $('.mobileMenu');
  const progress = $('.progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  if (menu && mobile) {
    const closeMenu = () => {
      mobile.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open menu');
      body.classList.remove('menu-open');
    };
    menu.addEventListener('click', () => {
      const open = !mobile.classList.contains('open');
      mobile.classList.toggle('open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      body.classList.toggle('menu-open', open);
    });
    $$('a', mobile).forEach(a => a.addEventListener('click', closeMenu));
  }

  // Fast reveal: no staggered queue that can make content appear after the user has passed it.
  const revealItems = $$('.reveal,.step,.cap,.founderCopy>*,.paintingCaption,.workCopy,.aboutBlock .wrap>*');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, {threshold: 0.01, rootMargin: '0px 0px 12% 0px'});
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('visible'));
  }

  const scenes = [
    {el: $('.hero'), photo: $('.heroScene')},
    {el: $('.systemScene'), laptop: $('.laptop'), phone: $('.phone'), device: $('.deviceComposition')},
    {el: $('.paintingBreak'), image: $('.paintingFull img')},
    {el: $('.workNote'), image: $('.workArt img')}
  ].filter(s => s.el);

  const metrics = new Map();
  const measure = () => scenes.forEach(scene => {
    const r = scene.el.getBoundingClientRect();
    metrics.set(scene.el, {top: r.top + scrollY, height: Math.max(1, r.height)});
  });
  measure();
  addEventListener('resize', measure, {passive:true});
  addEventListener('orientationchange', () => setTimeout(measure, 120), {passive:true});

  const clamp = (n, a=0, b=1) => Math.max(a, Math.min(b, n));
  const smooth = t => t * t * (3 - 2 * t);
  const near = m => m && scrollY + innerHeight * 1.1 > m.top && scrollY - innerHeight * .45 < m.top + m.height;
  let raf = 0;

  const render = () => {
    raf = 0;
    const y = scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.transform = `scaleX(${clamp(y / max)})`;
    if (nav) nav.classList.toggle('is-scrolled', y > 20);

    for (const scene of scenes) {
      const m = metrics.get(scene.el);
      if (!near(m)) continue;
      const p = clamp((y - m.top) / Math.max(1, m.height));

      if (scene.photo) scene.photo.style.transform = `translate3d(0,${-p * 7}px,0)`;

      if (scene.laptop && scene.phone) {
        const scrollSpan = Math.max(1, m.height - innerHeight);
        // Start the choreography as soon as the scene enters and let it settle well before the end.
        const start = m.top - innerHeight * (coarse ? .28 : .38);
        const q = clamp((y - start) / Math.max(1, scrollSpan * (coarse ? .62 : .56)));
        const e = smooth(q);
        const wave = Math.sin(q * Math.PI);
        const dx = (e - .5) * (coarse ? 22 : 32);
        const phoneDx = (e - .5) * (coarse ? -96 : -124);
        scene.laptop.style.transform = `translate3d(${dx}px,${-wave * (coarse ? 5 : 8)}px,0) rotateY(${(e-.5)*-1.6}deg)`;
        scene.phone.style.transform = `translate3d(${phoneDx}px,${-wave * (coarse ? 8 : 12)}px,0) rotateY(${(e-.5)*3.8}deg)`;
        if (scene.device) {
          const deviceY = (e - .5) * (coarse ? -16 : -22);
          const deviceScale = 1 + wave * (coarse ? .008 : .012);
          scene.device.style.transform = `translate3d(0,${deviceY}px,0) scale(${deviceScale})`;
        }
      }

      if (scene.image) scene.image.style.transform = `translate3d(0,${(p-.5)*-6}px,0) scale(1.01)`;
    }
  };

  const request = () => {
    if (reduced || raf) return;
    raf = requestAnimationFrame(render);
  };
  if (!reduced) {
    addEventListener('scroll', request, {passive:true});
    request();
  }
})();
