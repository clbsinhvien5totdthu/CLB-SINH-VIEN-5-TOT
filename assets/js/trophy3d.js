/* Cúp vàng 3D cho trang Thành tích (three.js r186, WebGLRenderer).
   - Dựng hoàn toàn bằng code (LatheGeometry, Torus, Extrude), không cần file model.
   - Kéo chuột/vuốt để xoay, bấm vào cúp để quay nhanh + bắn tia sáng, di chuột để nghiêng nhẹ.
   - Tự dừng khi cuộn khỏi màn hình hoặc ẩn tab; tắt chuyển động nếu người dùng bật "giảm chuyển động".
   - Lỗi WebGL/tải module: giữ nguyên hình cúp SVG làm dự phòng. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const host = document.querySelector("#trophy3d");
const hero = document.querySelector(".tt-hero");
if (host && hero) {
  try { start(); } catch (err) { console.warn("3D cúp không chạy, dùng hình dự phòng.", err); }
}

function start() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.6, 12.5);
  camera.lookAt(0, 0.1, 0);

  const key = new THREE.DirectionalLight(0xfff1c9, 2.2); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.PointLight(0x6fb8ff, 70, 30); rim.position.set(-6, 3, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14b, metalness: 1, roughness: 0.2 });
  const goldDeep = new THREE.MeshStandardMaterial({ color: 0xc58a1e, metalness: 1, roughness: 0.32 });
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x14233d, metalness: 0.55, roughness: 0.3 });

  const trophy = new THREE.Group();
  const spin = new THREE.Group();           /* phần quay quanh trục dọc */
  trophy.add(spin);

  /* đế */
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.42, 64), plinthMat); plinth.position.y = 0.21;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.09, 64), goldDeep); ring.position.y = 0.46;
  spin.add(plinth, ring);

  /* thân + chén cúp: một đường cong xoay tròn */
  const profile = [
    [0.8, 0.5], [0.74, 0.58], [0.5, 0.68], [0.26, 0.86], [0.17, 1.1], [0.2, 1.35], [0.34, 1.46], [0.2, 1.6], [0.16, 1.9], [0.3, 2.3],
    [0.7, 2.7], [1.05, 3.2], [1.2, 3.8], [1.22, 4.35], [1.16, 4.62], [1.1, 4.62], [1.14, 4.35], [1.12, 3.8], [0.98, 3.25], [0.6, 2.8], [0.1, 2.5]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), new THREE.MeshStandardMaterial({ color: 0xf2c14b, metalness: 1, roughness: 0.18, side: THREE.DoubleSide }));
  spin.add(cup);

  /* hai quai cúp */
  const handleGeo = new THREE.TorusGeometry(0.66, 0.085, 16, 48, Math.PI);
  const hr = new THREE.Mesh(handleGeo, gold); hr.position.set(1.14, 3.75, 0); hr.rotation.z = -Math.PI / 2;
  const hl = new THREE.Mesh(handleGeo, gold); hl.position.set(-1.14, 3.75, 0); hl.rotation.z = Math.PI / 2;
  spin.add(hr, hl);

  /* ngôi sao trước chén */
  const starShape = (outer, inner) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? inner : outer;
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath(); return s;
  };
  const starGeo = new THREE.ExtrudeGeometry(starShape(0.42, 0.18), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  const emblem = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd36b, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.3 }));
  emblem.position.set(0, 3.75, 1.2); spin.add(emblem);

  trophy.position.y = -2.35;
  scene.add(trophy);

  /* các ngôi sao nhỏ bay quanh */
  const orbit = new THREE.Group(); scene.add(orbit);
  const miniGeo = new THREE.ExtrudeGeometry(starShape(0.2, 0.09), { depth: 0.04, bevelEnabled: false });
  const minis = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(miniGeo, gold);
    const a = (i / 7) * Math.PI * 2;
    m.userData = { a, r: 2.5 + (i % 3) * 0.28, y: -0.9 + (i % 4) * 0.95, sp: 0.35 + (i % 3) * 0.12, ph: i * 1.3 };
    orbit.add(m); minis.push(m);
  }

  /* bụi vàng lấp lánh */
  const spark = document.createElement("canvas"); spark.width = spark.height = 64;
  const g = spark.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,244,200,1)"); grd.addColorStop(0.3, "rgba(255,210,100,.7)"); grd.addColorStop(1, "rgba(255,200,80,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const sparkTex = new THREE.CanvasTexture(spark); sparkTex.colorSpace = THREE.SRGBColorSpace;
  const N = 110, pos = new Float32Array(N * 3), seed = [];
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 7; pos[i * 3 + 1] = (Math.random() - 0.5) * 7.5; pos[i * 3 + 2] = (Math.random() - 0.5) * 4; seed.push(0.15 + Math.random() * 0.4); }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ map: sparkTex, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe39a }));
  dust.frustumCulled = false; scene.add(dust);

  /* kích thước theo khung chứa */
  const resize = () => {
    const w = host.clientWidth || 300, h = host.clientHeight || 340;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host); resize();

  /* tương tác: nghiêng theo chuột, kéo để xoay, bấm để quay nhanh */
  let tx = 0, ty = 0, drag = false, lastX = 0, vel = 0, burst = 0, moved = 0;
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener("pointerleave", () => { tx = ty = 0; });
  host.addEventListener("pointerdown", e => { drag = true; moved = 0; lastX = e.clientX; host.setPointerCapture(e.pointerId); host.classList.add("grabbing"); });
  host.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); spin.rotation.y += dx * 0.012; vel = dx * 0.012; });
  const endDrag = () => { if (!drag) return; drag = false; host.classList.remove("grabbing"); if (moved < 5) burst = 1; };
  host.addEventListener("pointerup", endDrag); host.addEventListener("pointercancel", endDrag);

  const timer = new THREE.Timer(); timer.connect(document);
  let visible = true;
  const frame = () => {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05), t = timer.getElapsed();
    if (!drag) {
      burst = Math.max(0, burst - dt * 0.9);
      spin.rotation.y += (0.5 + burst * 9) * dt + vel; vel *= 0.92;
    }
    trophy.rotation.x += (ty * 0.12 - trophy.rotation.x) * 0.06;
    trophy.rotation.z += (-tx * 0.06 - trophy.rotation.z) * 0.06;
    trophy.position.y = -2.35 + Math.sin(t * 1.2) * 0.08;
    emblem.material.emissiveIntensity = 0.55 + Math.sin(t * 2.2) * 0.2 + burst * 1.2;
    for (const m of minis) {
      const u = m.userData, a = u.a + t * u.sp + burst * 2;
      m.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 1.4 + u.ph) * 0.18, Math.sin(a) * u.r * 0.6);
      m.rotation.set(t * 0.8 + u.ph, t * 1.1, 0);
    }
    const p = pGeo.attributes.position;
    for (let i = 0; i < N; i++) { let y = p.array[i * 3 + 1] + seed[i] * dt * (1 + burst * 6); if (y > 3.8) y = -3.8; p.array[i * 3 + 1] = y; }
    p.needsUpdate = true;
    dust.material.size = 0.2 + burst * 0.18;
    renderer.render(scene, camera);
  };
  const run = () => renderer.setAnimationLoop(frame);

  if (reduced) { spin.rotation.y = 0.5; renderer.render(scene, camera); }
  else {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? run() : renderer.setAnimationLoop(null); }, { threshold: 0.01 }).observe(host);
    run();
  }
  hero.classList.add("has3d");
}
