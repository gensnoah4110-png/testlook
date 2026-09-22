(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const progress = document.querySelector('.progress');
  const nav = document.querySelector('.nav');
  const menu = document.querySelector('.menu');
  const mobile = document.querySelector('.mobileMenu');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // ---------------- Navigation ----------------
  if (menu && mobile) {
    menu.addEventListener('click', () => {
      const open = mobile.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      body.classList.toggle('menu-open', open);
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobile.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
    }));
  }

  // ---------------- Reveal-on-enter ----------------
  const revealItems = [...document.querySelectorAll('.reveal, .step, .cap, .proofItem, .mindsetGrid > div, .storyWords > div')];
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 2% 0px' });
    revealItems.forEach((el, i) => {
      if (el.classList.contains('step') || el.classList.contains('cap') || el.classList.contains('proofItem')) {
        el.style.transitionDelay = `${Math.min(i % 7, 4) * 14}ms`;
      }
      io.observe(el);
    });
  } else revealItems.forEach(el => el.classList.add('visible'));

  // ---------------- Cached scene geometry ----------------
  const scenes = [];
  const register = (el, name) => {
    if (!el) return;
    scenes.push({ el, name, top: 0, height: 1 });
  };
  register(document.querySelector('.hero'), 'hero');
  register(document.querySelector('.manifesto'), 'manifesto');
  register(document.querySelector('.statement'), 'statement');
  register(document.querySelector('.systemScene'), 'system');
  register(document.querySelector('.method'), 'method');
  register(document.querySelector('.bigquote'), 'quote');
  register(document.querySelector('.work'), 'work');
  register(document.querySelector('.proof'), 'proof');
  register(document.querySelector('.industries'), 'industries');
  register(document.querySelector('.founder'), 'founder');
  register(document.querySelector('.aboutBlock'), 'about');
  register(document.querySelector('.mindset'), 'mindset');
  register(document.querySelector('.faq'), 'faq');
  register(document.querySelector('.cta'), 'cta');

  const heroScene = document.querySelector('.heroScene');
  const heroBack = document.querySelector('.mountain-back');
  const heroMid = document.querySelector('.mountain-mid');
  const heroFront = document.querySelector('.mountain-front');
  const temple = document.querySelector('.temple');
  const mistA = document.querySelector('.mist-a');
  const mistB = document.querySelector('.mist-b');
  const heroSeal = document.querySelector('.heroSeal');
  const system = document.querySelector('.systemScene');
  const laptop = document.querySelector('.laptop');
  const phone = document.querySelector('.phone');
  const orbitOne = document.querySelector('.orbitOne');
  const orbitTwo = document.querySelector('.orbitTwo');
  const waterLines = [...document.querySelectorAll('.waterLine')];
  const storyWords = [...document.querySelectorAll('.storyWords > div')];
  const steps = [...document.querySelectorAll('.step')];
  const caps = [...document.querySelectorAll('.cap')];
  const industryChips = [...document.querySelectorAll('.industryLine span')];
  const industry = document.querySelector('.industries');
  const founderSeal = document.querySelector('.founderSeal');
  const mindsetItems = [...document.querySelectorAll('.mindsetGrid > div')];
  const stepNodes = [...document.querySelectorAll('.step')];
  const capNodes = [...document.querySelectorAll('.cap')];
  const quote = document.querySelector('.bigquote');
  const cta = document.querySelector('.cta');

  const getScene = name => scenes.find(s => s.name === name);
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ease = t => t * t * (3 - 2 * t);
  const sceneProgress = scene => {
    if (!scene) return 0;
    return clamp((scrollY - scene.top + innerHeight * .18) / (scene.height + innerHeight * .64));
  };
  const localProgress = scene => {
    if (!scene) return 0;
    return clamp((scrollY - scene.top) / Math.max(1, scene.height - innerHeight));
  };

  let targets = [];
  let ticking = false;
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let velocity = 0;
  let smoothVelocity = 0;
  let scrollDirection = 1;

  const refresh = () => {
    scenes.forEach(s => {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      s.height = Math.max(1, r.height);
    });
  };

  refresh();
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(refresh, 80), { passive: true });

  // ---------------- Main animation loop ----------------
  const render = now => {
    ticking = false;
    const y = window.scrollY;
    const dt = Math.max(16, now - lastTime);
    const rawVelocity = ((y - lastY) / dt) * 16;
    velocity = clamp(rawVelocity, -8, 8);
    smoothVelocity += (velocity - smoothVelocity) * (coarse ? .18 : .12);
    scrollDirection = smoothVelocity >= 0 ? 1 : -1;
    lastY = y;
    lastTime = now;

    const page = clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    if (progress) progress.style.transform = `scaleX(${page})`;
    if (nav) nav.classList.toggle('is-scrolled', y > 30);

    const speed = Math.min(1, Math.abs(smoothVelocity) / 5);
    root.style.setProperty('--scroll-v', speed.toFixed(3));
    root.style.setProperty('--scroll-dir', scrollDirection);

    // Hero mountain depth — each layer has its own travel rate.
    const hs = getScene('hero');
    if (hs && heroScene) {
      const p = clamp(y / Math.max(1, hs.height));
      const e = ease(p);
      heroScene.style.transform = `translate3d(0,${-e * 75}px,0)`;
      heroBack.style.transform = `translate3d(0,${e * 22}px,0) scale(${1 + e * .025})`;
      heroMid.style.transform = `translate3d(0,${e * 48}px,0) scale(${1 + e * .038})`;
      heroFront.style.transform = `translate3d(0,${e * 84}px,0) scale(${1 + e * .052})`;
      temple.style.transform = `translate3d(0,${-e * 92}px,0) rotate(${e * 2.2}deg)`;
      mistA.style.transform = `translate3d(${Math.sin(now * .00024) * 18 - e * 35}px,${-e * 22}px,0) scaleX(${1 + speed * .04})`;
      mistB.style.transform = `translate3d(${Math.cos(now * .00018) * 25 + e * 40}px,${e * 14}px,0) scaleX(${1 + speed * .05})`;
      heroSeal.style.transform = `translate3d(${smoothVelocity * 2.2}px,${e * 30}px,0) rotate(${-12 + e * 11 + smoothVelocity * .6}deg)`;
    }

    // Editorial section choreography — more movement, still GPU-friendly.
    const editorialScenes = [
      ['manifesto','--editorial-x','--editorial-y','--editorial-r', 52, -34, 7],
      ['statement','--statement-x','--statement-y','--statement-scale', -42, 38, .08],
      ['method','--method-x','--method-y','--method-r', 34, -48, -6],
      ['work','--work-x','--work-y','--work-scale', -38, 44, .10],
      ['founder','--founder-x','--founder-y','--founder-r', 28, -34, 8],
      ['about','--about-x','--about-y',null, -32, 42, 0],
      ['mindset','--mindset-x','--mindset-y',null, 38, -30, 0]
    ];
    editorialScenes.forEach(([name,xVar,yVar,rVar,xa,ya,extra]) => {
      const sc = getScene(name);
      if (!sc) return;
      const p = sceneProgress(sc);
      const wave = Math.sin(p * Math.PI);
      root.style.setProperty(xVar, `${(p - .5) * xa + smoothVelocity * 2.2}px`);
      root.style.setProperty(yVar, `${(p - .5) * ya}px`);
      if (rVar) {
        if (rVar.includes('scale')) root.style.setProperty(rVar, (1 + wave * extra).toFixed(3));
        else root.style.setProperty(rVar, `${(p - .5) * extra + smoothVelocity * .7}deg`);
      }
    });

    // Paper sections: quiet depth movement so whitespace feels intentional.
    const mp = sceneProgress(getScene('manifesto'));
    const sp = sceneProgress(getScene('statement'));
    root.style.setProperty('--manifesto-shift', `${(mp - .5) * -45}px`);
    root.style.setProperty('--statement-shift', `${(sp - .5) * 55}px`);

    // Device sequence — the business story is literally carried by the devices.
    const ss = getScene('system');
    if (ss && system && laptop && phone) {
      // Accelerate the device choreography so the laptop/phone sequence finishes
      // before the visitor has already passed the section. Keep the same visual
      // language, but shorten the active animation window.
      const rawP = localProgress(ss);
      const p = clamp(rawP * 1.42 - .12);
      const e = ease(p);
      const center = Math.sin(p * Math.PI);
      const travel = (p - .5) * 2;
      const deviceX = travel * (coarse ? 78 : 128);
      const phoneX = travel * (coarse ? -118 : -182);
      laptop.style.transform = `translate3d(${deviceX}px,${-center * (coarse ? 34 : 64)}px,0) rotateY(${travel * -12}deg) rotateZ(${travel * 1.5}deg) scale(${1 + center * .03})`;
      phone.style.transform = `translate3d(${phoneX}px,${center * (coarse ? -60 : -98)}px,0) rotateY(${travel * 21}deg) rotateZ(${travel * -4.2}deg) scale(${1 + center * (coarse ? .085 : .12)})`;
      orbitOne.style.transform = `translate(-50%,-50%) rotate(${p * 240}deg) scale(${.84 + center * .20})`;
      orbitTwo.style.transform = `translate(-50%,-50%) rotate(${p * -190}deg) scale(${.97 + center * .15})`;
      root.style.setProperty('--system-ring', (.94 + center * .12).toFixed(3));
      waterLines.forEach((line, i) => {
        line.style.transform = `translate3d(${Math.sin(p * Math.PI * 2 + i * 1.2) * 25 + smoothVelocity * (i + 1) * 3}px,${Math.cos(p * Math.PI + i) * 2}px,0) scaleX(${1 + center * .12})`;
      });
      root.style.setProperty('--system-aura', (.88 + center * .30 + speed * .08).toFixed(3));
      root.style.setProperty('--system-bg-x', `${travel * -55 + smoothVelocity * 5}px`);
      root.style.setProperty('--system-bg-y', `${Math.sin(p * Math.PI) * -28}px`);
      root.style.setProperty('--system-bg-scale', (1 + center * .08).toFixed(3));
      root.style.setProperty('--phone-glint', `${(-80 + p * 210)}%`);
      root.style.setProperty('--screen-glint', `${(-120 + p * 250)}%`);
    }

    // Method / capability / proof sections get a tiny velocity-responsive lift.
    const methodP = sceneProgress(getScene('method'));
    const capP = sceneProgress(getScene('capabilities'));
    root.style.setProperty('--method-drift', `${(methodP - .5) * smoothVelocity * 2}px`);
    root.style.setProperty('--method-x', `${(methodP - .5) * -55 + smoothVelocity * 2}px`);
    root.style.setProperty('--method-y', `${Math.sin(methodP * Math.PI) * -35}px`);
    root.style.setProperty('--method-r', `${(methodP - .5) * 7 + smoothVelocity * .35}deg`);
    root.style.setProperty('--cap-drift', `${(capP - .5) * smoothVelocity * 1.5}px`);
    steps.forEach((el,i) => {
      const wave = Math.sin(clamp(methodP + i * .045) * Math.PI);
      el.style.setProperty('--step-y', `${(wave * -10) + smoothVelocity * (i % 2 ? -1.2 : 1.2)}px`);
    });
    caps.forEach((el,i) => {
      const wave = Math.sin(clamp(capP + i * .025) * Math.PI);
      el.style.setProperty('--cap-y', `${wave * -7}px`);
    });

    // Quote rings breathe as the visitor passes through the statement.
    const qp = sceneProgress(getScene('quote'));
    root.style.setProperty('--quote-ring', (1 + Math.sin(qp * Math.PI) * .22).toFixed(3));

    // Work timeline: highlight the story stage closest to the viewport centre.
    const ws = getScene('work');
    if (ws && storyWords.length) {
      const p = localProgress(ws);
      const active = clamp(Math.floor(p * storyWords.length), 0, storyWords.length - 1);
      storyWords.forEach((item, i) => item.classList.toggle('is-active', i === active));
    }

    // Industries: giant ring slowly travels opposite the scroll direction.
    const ip = sceneProgress(getScene('industries'));
    root.style.setProperty('--industry-shift', `${(ip - .5) * -90}px`);
    industryChips.forEach((el,i) => {
      const wave = Math.sin(ip * Math.PI + i * .7);
      el.style.setProperty('--industry-chip-x', `${wave * 9 + smoothVelocity * (i % 2 ? -1 : 1)}px`);
      el.style.setProperty('--industry-chip-y', `${Math.cos(ip * Math.PI + i) * 4}px`);
    });

    // Founder seal responds gently to movement.
    const fp = sceneProgress(getScene('founder'));
    if (founderSeal) founderSeal.style.transform = `translate3d(${smoothVelocity * 1.2}px,${(fp - .5) * -25}px,0) rotate(${-4 + (fp - .5) * 12}deg)`;

    // CTA has a subtle inward/outward camera feel.
    const cp = sceneProgress(getScene('cta'));
    root.style.setProperty('--cta-ring', (1 + Math.sin(cp * Math.PI) * .16 + speed * .03).toFixed(3));
    root.style.setProperty('--cta-r', `${(cp - .5) * 12 + smoothVelocity * .45}deg`);
    root.style.setProperty('--cta-shift', `${(cp - .5) * -40}px`);

    // Global editorial title choreography: every major section gets a small camera move.
    const titleScenes = [
      ['manifesto','--manifesto-title-x','--manifesto-title-y', 22, -26],
      ['statement','--statement-title-x','--statement-title-y', -18, 30],
      ['method','--method-title-x','--method-title-y', 16, -22],
      ['capabilities','--cap-title-x','--cap-title-y', -20, 24],
      ['work','--work-title-x','--work-title-y', 18, -28],
      ['proof','--proof-title-x','--proof-title-y', -14, 22],
      ['industries','--industry-title-x','--industry-title-y', 22, -26],
      ['founder','--founder-title-x','--founder-title-y', -18, 24],
      ['about','--about-title-x','--about-title-y', 16, -20],
      ['mindset','--mindset-title-x','--mindset-title-y', -20, 25],
      ['faq','--faq-title-x','--faq-title-y', 14, -18],
      ['cta','--cta-title-x','--cta-title-y', -12, 16]
    ];
    titleScenes.forEach(([name,xVar,yVar,xAmp,yAmp])=>{
      const sc=getScene(name); if(!sc)return;
      const p=sceneProgress(sc); const wave=Math.sin(p*Math.PI);
      root.style.setProperty(xVar,`${(p-.5)*xAmp + smoothVelocity*1.2}px`);
      root.style.setProperty(yVar,`${(p-.5)*yAmp - wave*8}px`);
    });
    const heroP=sceneProgress(getScene('hero'));
    root.style.setProperty('--hero-title-y',`${Math.sin(heroP*Math.PI)*-18}px`);
    root.style.setProperty('--hero-title-scale',(1+Math.sin(heroP*Math.PI)*.018).toFixed(3));

    // Stronger device choreography on touch screens without adding more page height.
    if(ss && system && laptop && phone && coarse){
      const rawP=localProgress(ss), p=clamp(rawP*1.42-.12), wave=Math.sin(p*Math.PI), dir=scrollDirection;
      laptop.style.transform=`translate3d(${(p-.5)*188}px,${-wave*82}px,0) rotateY(${(p-.5)*-18}deg) rotateZ(${(p-.5)*2.4}deg) scale(${1+wave*.05})`;
      phone.style.transform=`translate3d(${(p-.5)*-242}px,${-wave*130}px,0) rotateY(${(p-.5)*28}deg) rotateZ(${(p-.5)*-6}deg) scale(${1+wave*.13})`;
      root.style.setProperty('--system-aura',(1+wave*.19+speed*.07).toFixed(3));
      root.style.setProperty('--phone-glint',`${-100+p*300}%`);
      root.style.setProperty('--screen-glint',`${-120+p*280}%`);
      root.style.setProperty('--system-bg-x',`${(p-.5)*-78+smoothVelocity*6}px`);
      root.style.setProperty('--system-bg-y',`${-wave*36+dir*speed*7}px`);
    }

    // Individual cards breathe with the scroll position, making the page feel physically layered.
    stepNodes.forEach((el,i)=>{
      const wave=Math.sin(clamp(methodP+i*.045)*Math.PI);
      el.style.setProperty('--step-r',`${(i%2?-1:1)*wave*1.2}deg`);
    });
    capNodes.forEach((el,i)=>{
      const wave=Math.sin(clamp(capP+i*.025)*Math.PI);
      el.style.setProperty('--cap-r',`${(i%2?-1:1)*wave*.8}deg`);
    });

    // Ambient depth for dark cinematic sections.
    const qWave=Math.sin(qp*Math.PI);
    root.style.setProperty('--quote-ring',(1+qWave*.28+speed*.025).toFixed(3));
    const ap=sceneProgress(getScene('about'));
    root.style.setProperty('--about-x',`${(ap-.5)*-55+smoothVelocity*1.4}px`);

    // Let the browser repaint only once per frame.
  };

  const requestRender = () => {
    if (ticking || reduced) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  if (!reduced) {
    window.addEventListener('scroll', requestRender, { passive: true });
    requestAnimationFrame(render);
  } else {
    if (progress) progress.style.transform = 'scaleX(0)';
  }

  // ---------------- FAQ ----------------
  document.querySelectorAll('[data-faq]').forEach(item => {
    const button = item.querySelector('button');
    if (!button) return;
    button.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });
})();
