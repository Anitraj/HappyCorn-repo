import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./index.module.css";

const CDN = "https://happycorn.floot.app/_cdn/static";

const flavours = [
  { key: "spicy", name: "Spicy Indian Masala", short: "Spicy. Bold. Full of crunch.", model: CDN + "/f4cbc479-8fdf-44df-b90d-e466aa70cd92-happycorn-spicy-realistic.glb", color: "#e51d24", icon: "🌶️" },
  { key: "cheese", name: "Cheese Carnival", short: "Golden, cheesy, impossible to share.", model: CDN + "/fce4bcf1-ea0f-4e26-a886-ece21b7218cd-HappyCorn_Cheese_Carnival_RealisticPouch_PROPER_FINAL.glb", color: "#e99c16", icon: "🧀" },
  { key: "onion", name: "Cream & Onion Delight", short: "Creamy. Herby. Seriously addictive.", model: CDN + "/ed52dc4e-46f2-4b8b-b458-cae125fd7e72-HappyCorn_Cream_Onion_Delight_FrontTopBlank.glb", color: "#4d8e4b", icon: "🧅" },
  { key: "tomato", name: "Tomato Fiesta", short: "Tangy tomato. Big party energy.", model: CDN + "/72e63ae1-9e1f-4074-a82a-cac48f8d2220-HappyCorn_Tomato_Fiesta_Corrected_v3.glb", color: "#d9362b", icon: "🍅" },
];

const heroImage = CDN + "/897b0129-961a-40cb-ac9c-38fdda924512-happycorn-hero-filled-banner.png";

const heroPopcorns = [
  [8, 18, -18, 1.0, 5.4], [18, 62, 14, .72, 4.7], [29, 20, -28, .58, 5.9], [41, 10, 22, .78, 4.9],
  [54, 18, -16, .62, 5.7], [67, 12, 25, .82, 4.8], [78, 28, -20, .66, 5.5], [90, 17, 18, .9, 5.1],
  [12, 42, 24, .52, 4.5], [24, 86, -14, .88, 5.8], [39, 76, 30, .54, 4.9], [57, 80, -22, .74, 5.2],
  [72, 72, 16, .6, 4.6], [88, 62, -26, .8, 5.6], [5, 76, 12, .64, 5.0], [94, 42, -18, .55, 4.4],
];

function CTAButton({ children, variant = "primary", onClick }: { children: ReactNode; variant?: "primary" | "secondary"; onClick?: () => void }) {
  return <button type="button" className={styles.cta + " " + (variant === "secondary" ? styles.ctaSecondary : "")} onClick={onClick}>{children}</button>;
}

function useScrollReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setRevealed(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, revealed] as const;
}

function Popcorn3D({ model, className = "" }: { model: string; className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.2, 10.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 520, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xfff4dc, 4.2);
    key.position.set(4, 6, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffc44a, 2.2);
    fill.position.set(-5, 1, 4);
    scene.add(fill);
    const rim = new THREE.PointLight(0xe51d24, 3.5, 18);
    rim.position.set(2, 2, -3);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xfff8ea, 0x2a120b, 1.3));

    const particleCount = 110;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 7.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
      speeds[i] = 0.15 + Math.random() * 0.3;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xffdf7a, size: 0.055, transparent: true, opacity: 0.8, depthWrite: false });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const loader = new GLTFLoader();
    let disposed = false;
    loader.load(model, (gltf) => {
      if (disposed) return;
      if (modelRef.current) scene.remove(modelRef.current);
      const root = gltf.scene;
      root.scale.setScalar(0.82);
      root.rotation.set(0, -0.28, 0);
      modelRef.current = root;
      scene.add(root);
    });

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      targetRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.9;
      targetRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.5;
    };
    mount.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    let raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      if (modelRef.current) {
        const pointerYaw = targetRef.current.x * Math.PI * 2.2;
        const pointerPitch = targetRef.current.y * 1.15;
        modelRef.current.rotation.y += (pointerYaw - modelRef.current.rotation.y) * 0.14;
        modelRef.current.rotation.x += (pointerPitch - modelRef.current.rotation.x) * 0.12;
        modelRef.current.position.y = reduced ? 0 : Math.sin(elapsed * 1.15) * 0.08;
      }
      if (!reduced) {
        const attr = particleGeometry.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i += 1) {
          const y = attr.getY(i) + speeds[i] * 0.006;
          attr.setY(i, y > 3.8 ? -3.8 : y);
        }
        attr.needsUpdate = true;
        particles.rotation.y = elapsed * 0.018;
        camera.position.x = Math.sin(elapsed * 0.18) * 0.22;
        camera.position.y = 0.2 + Math.sin(elapsed * 0.25) * 0.08;
      }
      camera.lookAt(0, 0.15, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const width = mount.clientWidth || 640;
      const height = mount.clientHeight || 520;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [model]);

  return <div ref={mountRef} className={styles.modelCanvas + (className ? " " + className : "")} aria-label="Interactive 3D HappyCorn package" role="img" />;
}

export default function HomePage() {
  const [activeKey, setActiveKey] = useState("spicy");
  const active = useMemo(() => flavours.find((item) => item.key === activeKey) ?? flavours[0], [activeKey]);
  const [heroRef, heroRevealed] = useScrollReveal();
  const [flavourRef, flavourRevealed] = useScrollReveal();
  const [journeyRef, journeyRevealed] = useScrollReveal();
  const [productsRef, productsRevealed] = useScrollReveal();
  const heroPopLayerRef = useRef<HTMLDivElement | null>(null);
  const mouseKernelRef = useRef<HTMLDivElement | null>(null);
  const lastHoverPopRef = useRef(0);
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const layer = heroPopLayerRef.current;
    const cursor = mouseKernelRef.current;
    if (!layer || !cursor) return;
    const banner = layer.parentElement;
    if (!banner) return;
    const onMove = (event: PointerEvent) => {
      const rect = layer.getBoundingClientRect();
      cursor.style.left = event.clientX - rect.left + "px";
      cursor.style.top = event.clientY - rect.top + "px";
      const now = performance.now();
      if (now - lastHoverPopRef.current < 150) return;
      lastHoverPopRef.current = now;
      const pop = document.createElement("span");
      pop.className = styles.hoverPop;
      pop.style.left = ((event.clientX - rect.left) / rect.width) * 100 + "%";
      pop.style.top = ((event.clientY - rect.top) / rect.height) * 100 + "%";
      pop.style.setProperty("--hover-rotate", Math.round(Math.random() * 80 - 40) + "deg");
      pop.style.setProperty("--hover-x", Math.round(Math.random() * 90 - 45) + "px");
      pop.style.setProperty("--hover-y", Math.round(Math.random() * 70 + 55) + "px");
      pop.innerHTML = '<i class="' + styles.popcornKernel + '"></i>';
      layer.appendChild(pop);
      window.setTimeout(() => pop.remove(), 850);
    };
    banner.addEventListener("pointermove", onMove);
    return () => banner.removeEventListener("pointermove", onMove);
  }, []);

  const revealClass = (revealed: boolean) => revealed ? styles.revealed : "";

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <a className={styles.logoWord} href="#home" aria-label="HappyCorn home">Happy<span>Corn</span></a>
        <div className={styles.navLinks}><a className={styles.activeNav} href="#home">Home</a><a href="#flavours">Flavours</a><a href="#story">Our Story</a><a href="#products">Products</a><a href="#contact">Contact</a></div>
        <div className={styles.navActions}><button type="button" aria-label="Search" className={styles.iconButton}>⌕</button><button type="button" aria-label="Shopping bag" className={styles.iconButton}>♧</button></div>
      </nav>

      <section id="home" className={styles.hero} ref={heroRef} data-revealed={heroRevealed}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBanner} aria-label="HappyCorn animated popcorn banner">
          <img src={heroImage} alt="HappyCorn popcorn celebration" />
          <div ref={heroPopLayerRef} className={styles.heroPopcornLayer} aria-hidden="true">
            {heroPopcorns.map(([left, top, rotate, scale, duration], index) => (
              <span key={index} className={styles.heroPopcorn} style={{
                "--left": left + "%", "--top": top + "%", "--rotate": rotate + "deg",
                "--scale": scale, "--duration": duration + "s", "--delay": -(index % 5) * 0.7 + "s"
              } as CSSProperties}><i className={styles.popcornKernel} /></span>
            ))}
          </div>
          <div ref={mouseKernelRef} className={styles.mouseKernel} aria-hidden="true"><i className={styles.popcornKernel} /></div>
          <div className={styles.heroShimmer} />
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>THE HAPPYCORN EXPERIENCE</span>
          <p>Four flavours. One big crunch.</p>
          <CTAButton onClick={() => jumpTo("flavours")}>EXPLORE FLAVOURS <span>→</span></CTAButton>
        </div>
        <div className={styles.heroMarquee}>POP • CRUNCH • SMILE • POP • CRUNCH • SMILE • </div>
      </section>

      <section id="flavours" className={styles.flavourSection} ref={flavourRef} data-revealed={flavourRevealed}>
        <div className={styles.sectionIntro}><span className={styles.sectionEyebrow}>CHOOSE YOUR</span><h2>FLAVOUR<span>.</span></h2><p>Four big personalities. One very happy popcorn.</p></div>
        <div className={styles.flavourGrid}>
          {flavours.map((flavour) => (
            <button type="button" key={flavour.key} className={styles.flavourCard + (activeKey === flavour.key ? " " + styles.flavourCardActive : "")} style={{ "--flavour-color": flavour.color } as CSSProperties} onClick={() => setActiveKey(flavour.key)} aria-pressed={activeKey === flavour.key}>
              <div className={styles.cardTop}><span>{flavour.icon}</span><span>20 g / 40 g</span></div>
              <div className={styles.cardModel}><Popcorn3D model={flavour.model} className={styles.cardModelCanvas} /></div>
              <div className={styles.cardBottom}><h3>{flavour.name}</h3><span className={styles.cardArrow}>↗</span></div>
            </button>
          ))}
        </div>
        <div className={styles.featuredProduct}>
          <div className={styles.featuredCopy}><span className={styles.sectionEyebrow}>NOW POPPING</span><h3>{active.name}</h3><p>{active.short}</p><div className={styles.priceRow}><b>20 g <span>₹10</span></b><b>40 g <span>₹18</span></b></div><CTAButton onClick={() => jumpTo("products")}>VIEW PRODUCT <span>→</span></CTAButton></div>
          <div className={styles.featuredStage} style={{ "--flavour-color": active.color } as CSSProperties}><div className={styles.productShadow} /><Popcorn3D model={active.model} className={styles.featuredModel} /></div>
        </div>
      </section>

      <section id="story" className={styles.journeySection} ref={journeyRef} data-revealed={journeyRevealed}>
        <div className={styles.journeyHeading}><span className={styles.sectionEyebrow}>FROM KERNEL TO CRUNCH</span><h2>THE HAPPY<span>CORN</span> JOURNEY</h2></div>
        <div className={styles.journeyTrack}>
          {[["01","KERNEL","It all starts with a little pop of potential.","🌽"],["02","HEAT","A little heat. A lot of anticipation.","〰️"],["03","POP","Then suddenly… everything gets happy.","💥"],["04","SEASON","Big flavour gets tossed in.","✨"],["05","CRUNCH","That golden, irresistible moment.","🍿"]].map(([num,title,copy,icon]) => (
            <article className={styles.journeyCard} key={num}><span className={styles.journeyNum}>{num}</span><div className={styles.journeyIcon}>{icon}</div><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section id="products" className={styles.productsSection} ref={productsRef} data-revealed={productsRevealed}>
        <div className={styles.productsHeader}><div><span className={styles.sectionEyebrow}>READY TO CRUNCH?</span><h2>FIND YOUR<br /><em>HAPPY.</em></h2></div><p>Small packs. Big happiness. Pick your flavour and make every moment a little more fun.</p></div>
        <div className={styles.productList}>
          {flavours.map((flavour) => (
            <article className={styles.productRow} key={flavour.key}><div className={styles.productRowModel}><Popcorn3D model={flavour.model} className={styles.productRowModelCanvas} /></div><div><span>{flavour.icon} {flavour.key.toUpperCase()}</span><h3>{flavour.name}</h3></div><div className={styles.sizes}><span>20 g <b>₹10</b></span><span>40 g <b>₹18</b></span></div><CTAButton variant="secondary" onClick={() => setActiveKey(flavour.key)}>EXPLORE</CTAButton></article>
          ))}
        </div>
      </section>

      <footer id="contact" className={styles.footer}><div><a className={styles.logoWord} href="#home">Happy<span>Corn</span></a><p>Pop. Crunch. Smile. 😊</p></div><div><span>HAPPY QUESTIONS?</span><a href="mailto:hello@happycorn.in">hello@happycorn.in</a></div><div><span>FOLLOW THE CRUNCH</span><p>@happycorn</p></div></footer>
    </main>
  );
}
