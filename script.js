const config = {
  // ⚠️ HTML hiện có 6 thẻ QR (n1 → n6) nhưng ở đây mới chỉ khai báo 4 liên kết.
  // Nếu chưa có link cho N5 / N6, hãy điền vào bên dưới, nếu không 2 nút này sẽ luôn
  // hiện thông báo "Liên kết chưa được cập nhật."
  qrLinks: {
    n1: "https://zalo.me/g/tjktxh194?joinSrc=9",
    n2: "https://zalo.me/g/qxsgxi306?joinSrc=9",
    n3: "https://zalo.me/g/lftmjc820",
    n4: "https://zalo.me/g/kzcnvk517?joinSrc=9",
    n5: "https://zalo.me/g/kkysjf15itpkg5mnhy1l",
    n6: ""
  },
  // socialLinks hiện KHÔNG được dùng ở đâu trong file này (footer đang gắn href
  // trực tiếp trong HTML). Điền link thật rồi initSocialLinks() bên dưới sẽ tự
  // cập nhật href cho các thẻ .social-link[data-social="..."] tương ứng.
  socialLinks: { fanpage: "", facebook: "", tiktok: "", discord: "", email: "", address: "" }
};
 
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let toastTimer;
 
function qs(selector, root = document) { return root.querySelector(selector); }
function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }
 
function showToast(message) {
  const toast = qs(".toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
 
function initNavbar() {
  const header = qs(".site-header");
  const menuBtn = qs(".menu-toggle");
  const menu = qs(".mobile-menu");
  const closeMenu = () => {
    if (!menu || !menuBtn) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn?.addEventListener("click", () => {
    if (!menu) return;
    const open = !menu.classList.contains("open");
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  qsa(".mobile-menu a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  document.addEventListener("click", e => { if (!e.target.closest(".site-header")) closeMenu(); });
  // Đăng ký với vòng scroll gộp chung (xem initScrollLoop) thay vì tự thêm
  // listener riêng — tránh nhiều listener cùng đọc/ghi layout mỗi lần cuộn.
  onScroll(() => header?.classList.toggle("scrolled", scrollY > 20));
}

/**
 * Vòng lặp scroll DÙNG CHUNG cho toàn trang: thay vì mỗi tính năng (header,
 * thanh tiến trình, nút back-to-top...) tự gắn 1 "scroll" listener riêng
 * (mỗi listener chạy ngay lập tức, có thể hàng chục lần/giây trên điện
 * thoại), tất cả đăng ký callback vào đây và chỉ được chạy TỐI ĐA 1 lần
 * mỗi khung hình (requestAnimationFrame) — giảm đáng kể giật/lag khi cuộn.
 */
const scrollCallbacks = [];
function onScroll(callback) {
  scrollCallbacks.push(callback);
}
function initScrollLoop() {
  let ticking = false;
  const run = () => {
    scrollCallbacks.forEach(callback => callback());
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(run);
  }, { passive: true });
  run();
}
 
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = qs(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });
}
 
function initScrollReveal() {
  const items = qsa(".reveal");
  if (reducedMotion) {
    items.forEach(el => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
  items.forEach(el => observer.observe(el));
}
 
function initFAQ() {
  const items = qsa(".faq-item");
  const setters = new Map();
  items.forEach((item, i) => {
    const btn = qs("button", item), ans = qs(".faq-answer", item);
    if (!btn || !ans) return;
    ans.id = ans.id || `faq-a-${i}`;
    btn.id = btn.id || `faq-q-${i}`;
    btn.setAttribute("aria-controls", ans.id);
    ans.setAttribute("role", "region");
    ans.setAttribute("aria-labelledby", btn.id);
    const set = open => {
      item.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      ans.style.height = open ? `${ans.scrollHeight}px` : "0px";
    };
    setters.set(item, set);
    btn.addEventListener("click", () => {
      const was = item.classList.contains("open");
      setters.forEach((fn, other) => { if (other !== item) fn(false); });
      set(!was);
    });
    btn.addEventListener("keydown", e => {
      const list = qsa("button", item.closest(".faq-list") || document);
      const at = list.indexOf(btn);
      const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      list[(to + list.length) % list.length].focus();
    });
  });
  const openFromHash = () => {
    const t = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t && setters.has(t)) setters.forEach((fn, other) => fn(other === t));
  };
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
  window.addEventListener("resize", () =>
    qsa(".faq-item.open .faq-answer").forEach(a => { a.style.height = `${a.scrollHeight}px`; }), { passive: true });
}

function initQRButtons() {
  qsa(".qr-card").forEach(card => {
    const key = card.dataset.qr;
    const openBtn = qs(".qr-open", card);
    const copyBtn = qs(".qr-copy", card);
    openBtn.addEventListener("click", () => {
      const link = config.qrLinks[key];
      if (!link) {
        showToast("Liên kết chưa được cập nhật.");
        return;
      }
      window.open(link, "_blank", "noopener,noreferrer");
    });
    copyBtn.addEventListener("click", async () => {
      const link = config.qrLinks[key];
      if (!link) {
        showToast("Liên kết chưa được cập nhật.");
        return;
      }
      try {
        await navigator.clipboard.writeText(link);
        showToast("Đã sao chép liên kết!");
      } catch {
        showToast("Không thể sao chép trên thiết bị này.");
      }
    });
  });
}
 
/**
 * Mục "Mạng xã hội": mỗi thẻ .social-hub-card có data-url (và data-copy tùy chọn).
 * Nút đầu mở liên kết (mailto:/tel: sẽ điều hướng trực tiếp, còn lại mở tab mới),
 * nút sau sao chép liên kết/email/số điện thoại vào clipboard.
 */
function initSocialHub() {
  qsa(".social-hub-card").forEach(card => {
    const url = card.dataset.url;
    const copyText = card.dataset.copy || url;
    const openBtn = qs(".social-open", card);
    const copyBtn = qs(".social-copy", card);
    openBtn?.addEventListener("click", () => {
      if (!url) {
        showToast("Liên kết chưa được cập nhật.");
        return;
      }
      if (url.startsWith("mailto:") || url.startsWith("tel:")) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
    copyBtn?.addEventListener("click", async () => {
      if (!copyText) {
        showToast("Liên kết chưa được cập nhật.");
        return;
      }
      try {
        await navigator.clipboard.writeText(copyText);
        showToast("Đã sao chép!");
      } catch {
        showToast("Không thể sao chép trên thiết bị này.");
      }
    });
  });
}

/**
 * Hiệu ứng "nam châm": các nút .magnetic (đã có sẵn class trong HTML nhưng
 * trước đây chưa có hiệu ứng nào) sẽ hơi nhích theo con trỏ khi rê chuột qua,
 * tạo cảm giác nút "hút" chuột lại gần — chỉ bật trên desktop, tắt khi
 * prefers-reduced-motion.
 */
function initMagneticButtons() {
  if (reducedMotion || window.matchMedia("(max-width: 767px)").matches) return;
  qsa(".magnetic").forEach(btn => {
    btn.addEventListener("pointermove", event => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

/**
 * Hiệu ứng pháo giấy nhỏ khi bấm các nút CTA chính (.button-primary),
 * tạo cảm giác vui mắt, thưởng cho hành động "tham gia".
 */
function initConfettiBurst() {
  if (reducedMotion) return;
  const colors = ["#22d3ee", "#1677ff", "#7c3aed", "#ffffff"];
  qsa(".button-primary").forEach(btn => {
    btn.addEventListener("click", event => {
      const rect = btn.getBoundingClientRect();
      const originX = event.clientX || rect.left + rect.width / 2;
      const originY = event.clientY || rect.top + rect.height / 2;
      // Ít hạt hơn trên điện thoại: đỡ tạo/xoá DOM node dồn dập khi bấm.
      const bitCount = window.matchMedia("(max-width:767px)").matches ? 8 : 16;
      for (let i = 0; i < bitCount; i++) {
        const bit = document.createElement("span");
        bit.className = "confetti-bit";
        const angle = Math.random() * Math.PI * 2;
        const distance = 55 + Math.random() * 65;
        bit.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        bit.style.setProperty("--dy", `${Math.sin(angle) * distance - 35}px`);
        bit.style.left = `${originX}px`;
        bit.style.top = `${originY}px`;
        bit.style.background = colors[i % colors.length];
        document.body.appendChild(bit);
        bit.addEventListener("animationend", () => bit.remove());
      }
    });
  });
}

/**
 * Modal "Xem chi tiết" cho các .activity-card (mục Hoạt động nổi bật).
 * HTML/CSS đã dựng sẵn #activityModal + data-title/data-tag/data-img/data-alt/data-desc
 * trên từng .activity-card, nhưng trước đây KHÔNG có JS nào mở/đóng modal này —
 * bấm vào ảnh hoạt động sẽ không có phản hồi gì cả. Hàm dưới đây bổ sung phần đó.
 */
function initActivityModal() {
  const modal = qs("#activityModal");
  const cards = qsa(".activity-card");
  if (!modal || !cards.length) return;

  const img = qs("#activityModalImg", modal);
  const video = qs("#activityModalVideo", modal);
  const tag = qs("#activityModalTag", modal);
  const title = qs("#activityModalTitle", modal);
  const desc = qs("#activityModalDesc", modal);
  const media = qs(".activity-modal-media", modal);
  let lastFocused = null;

  function openModal(card) {
    lastFocused = document.activeElement;
    media.classList.remove("activity-missing");
    tag.textContent = card.dataset.tag || "";
    title.textContent = card.dataset.title || "";
    desc.textContent = card.dataset.desc || "";

    if (card.dataset.video) {
      media.classList.add("is-video");
      video.poster = card.dataset.poster || "";
      video.innerHTML = "";
      if (card.dataset.videoWebm) {
        const sourceWebm = document.createElement("source");
        sourceWebm.src = card.dataset.videoWebm;
        sourceWebm.type = "video/webm";
        video.appendChild(sourceWebm);
      }
      const sourceMp4 = document.createElement("source");
      sourceMp4.src = card.dataset.video;
      sourceMp4.type = "video/mp4";
      video.appendChild(sourceMp4);
      video.controls = true;
      video.muted = false;
      video.load();
      video.play().catch(() => {});
    } else {
      media.classList.remove("is-video");
      video.pause();
      video.removeAttribute("src");
      video.innerHTML = "";
      img.src = card.dataset.img || "";
      img.alt = card.dataset.alt || card.dataset.title || "";
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    qs(".activity-modal-close", modal)?.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    video.pause();
    lastFocused?.focus();
  }

  img.addEventListener("error", () => media.classList.add("activity-missing"));

  cards.forEach(card => {
    card.addEventListener("click", () => openModal(card));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(card);
      }
    });
  });

  qsa("[data-close]", modal).forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
}

/**
 * Video mini-loop 5s trong thẻ "Hoạt động nổi bật" (mục đầu tiên).
 * Chỉ tải & phát khi thẻ thực sự lọt vào khung nhìn (IntersectionObserver),
 * và tự tạm dừng khi cuộn ra khỏi màn hình — tiết kiệm dữ liệu & pin trên
 * điện thoại thay vì để video tự phát ngay khi tải trang.
 */
function initActivityVideos() {
  const videos = qsa(".activity-video");
  if (!videos.length) return;

  const saveData = navigator.connection?.saveData === true;

  videos.forEach(video => {
    let loaded = false;

    function loadSources() {
      if (loaded) return;
      loaded = true;
      qsa("source", video).forEach(source => {
        if (source.dataset.src) source.src = source.dataset.src;
      });
      video.load();
    }

    if (reducedMotion || saveData) {
      // Không tự phát: chỉ hiển thị ảnh poster, tôn trọng chế độ tiết kiệm
      // dữ liệu / giảm chuyển động của người dùng.
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadSources();
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 });

    observer.observe(video);
  });
}

/**
 * Gán href thật cho các nút mạng xã hội ở footer dựa trên config.socialLinks.
 * Nếu để trống, thẻ tương ứng sẽ bị vô hiệu hoá (tránh dẫn tới href="#" chết).
 */
function initSocialLinks() {
  qsa(".social-link[data-social]").forEach(link => {
    const key = link.dataset.social;
    const url = config.socialLinks[key];
    if (url) {
      link.href = key === "email" ? `mailto:${url}` : url;
      link.removeAttribute("aria-disabled");
    } else if (link.getAttribute("href") === "#") {
      link.setAttribute("aria-disabled", "true");
      link.addEventListener("click", event => event.preventDefault());
    }
  });
}
 
function initCardTilt() {
  if (reducedMotion || window.matchMedia("(max-width: 767px)").matches) return;
  qsa(".tilt").forEach(card => {
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - .5) * 7;
      const rotateX = (.5 - y) * 7;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}
 
function initParallax() {
  const glow = qs(".cursor-glow");
  const scene = qs(".scene");
  // Hiệu ứng bám theo con trỏ chuột chỉ có ý nghĩa (và chỉ hiển thị qua CSS)
  // trên máy có chuột thật — bỏ qua hoàn toàn trên cảm ứng/điện thoại để
  // không phải chạy pointermove + rAF liên tục mỗi lần chạm/vuốt màn hình.
  if (reducedMotion || window.matchMedia("(pointer:coarse)").matches) return;
  let mx = innerWidth / 2, my = innerHeight / 2, raf = 0;
  document.addEventListener("pointermove", event => {
    mx = event.clientX; my = event.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      if (glow) {
        glow.style.left = `${mx}px`;
        glow.style.top = `${my}px`;
      }
      if (scene && innerWidth > 767) {
        const rx = (my / innerHeight - .5) * -4;
        const ry = (mx / innerWidth - .5) * 6;
        scene.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      raf = 0;
    });
  }, { passive: true });
}
 
function initParticles() {
  const canvas = qs("#particle-canvas");
  if (!canvas || reducedMotion) return;
  // CSS đã ẩn #particle-canvas trên điện thoại (≤900px) — không khởi tạo
  // canvas/loop vẽ ở đây nữa, vì trước đây vòng lặp vẫn chạy vô hạn dù
  // canvas không hiển thị, gây tốn CPU vô ích trên điện thoại.
  if (window.matchMedia("(max-width:900px)").matches) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let particles = [];
  let width = 0, height = 0;
  let running = false;
  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(50, Math.max(20, Math.floor(width / 25)));
    particles = Array.from({length: count}, () => ({
      x: Math.random()*width, y: Math.random()*height,
      r: Math.random()*1.5+.4, vx:(Math.random()-.5)*.12, vy:(Math.random()-.5)*.12,
      a:Math.random()*.5+.15
    }));
  };
  const frame = () => {
    if (!running) return;
    ctx.clearRect(0,0,width,height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0 || p.x > width) p.vx *= -1;
      if(p.y < 0 || p.y > height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(34,211,238,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(frame);
  };
  // Chỉ chạy vòng lặp vẽ khi section chứa canvas thực sự lọt vào khung
  // nhìn — cuộn qua khỏi màn hình sẽ tự dừng, tiết kiệm pin/CPU.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !running) {
        running = true;
        frame();
      } else if (!entry.isIntersecting) {
        running = false;
      }
    });
  }, { threshold: 0.05 });
  observer.observe(canvas.parentElement);
  addEventListener("resize", resize, {passive:true});
  resize();
}
 
function initScrollProgress() {
  const bar = qs(".scroll-progress span");
  const timeline = qs(".timeline-line span");
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max ? scrollY / max : 0;
    bar.style.width = `${progress * 100}%`;
    if (timeline) {
      const rect = qs(".timeline").getBoundingClientRect();
      const visible = Math.min(1, Math.max(0, (innerHeight * .7 - rect.top) / Math.max(rect.height * .72, 1)));
      timeline.style.height = `${visible * 100}%`;
    }
  };
  onScroll(update); update();
}
 
function initBackToTop() {
  const btn = qs(".back-top");
  onScroll(() => btn.classList.toggle("visible", scrollY > 600));
  btn.addEventListener("click", () => scrollTo({top:0, behavior: reducedMotion ? "auto" : "smooth"}));
}
 
function initActiveNavigation() {
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  qsa(".nav-links a, .mobile-menu a:not(.button)").forEach(link => {
    const on = (link.getAttribute("href") || "").split("#")[0].toLowerCase() === page;
    link.classList.toggle("active", on);
    if (on) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
}

function initReducedMotion() {
  document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
}
 
function initLoading() {
  window.addEventListener("load", () => {
    setTimeout(() => qs("#preloader")?.classList.add("loaded"), 450);
  });
  setTimeout(() => qs("#preloader")?.classList.add("loaded"), 1800);
}
 
function initMissingAssets() {
  qsa("img").forEach(img => {
    img.addEventListener("error", () => {
      img.style.visibility = "hidden";
      img.closest(".brand-logo,.footer-logo")?.classList.add("asset-missing");
    });
  });
}
function initBackgroundMusic() {
  const music = qs("#bgMusic");
  const toggle = qs("#musicToggle");
  const intro = qs("#intro-screen");
  const startButton = qs("#startExperience");
 
  if (!music) return;
 
  music.loop = true;
  // Không tải trước file nhạc nền khi vừa vào trang (tốn băng thông/CPU
  // giải mã trên điện thoại) — chỉ tải khi người dùng thực sự bấm phát.
  music.preload = "none";
  music.volume = 0.35;
 
  let playing = false;
 
  function updateMusicButton() {
    if (!toggle) return;
 
    toggle.classList.toggle("playing", playing);
 
    toggle.textContent = playing ? "♫" : "♪";
 
    toggle.setAttribute(
      "aria-label",
      playing ? "Tắt nhạc nền" : "Bật nhạc nền"
    );
  }
 
  async function startMusic() {
    try {
      music.muted = false;
      await music.play();
 
      playing = true;
      updateMusicButton();
 
    } catch (error) {
      console.log("Không thể phát nhạc:", error);
    }
  }
 
  function stopMusic() {
    music.pause();
    playing = false;
    updateMusicButton();
  }
 
  /* =========================================
     BẤM "BẮT ĐẦU HÀNH TRÌNH"
  ========================================= */
 
  // Bật nhạc ngay trong thao tác bấm, KHÔNG await: không bắt người dùng chờ tải mp3. Đóng intro do initIntro() lo.
  startButton?.addEventListener("click", () => { startMusic(); });
 
  /* =========================================
     NÚT NHẠC
  ========================================= */
 
  if (toggle) {
    toggle.addEventListener("click", async event => {
      event.stopPropagation();
 
      if (playing) {
        stopMusic();
      } else {
        await startMusic();
      }
    });
  }
 
  music.addEventListener("play", () => {
    playing = true;
    updateMusicButton();
  });
 
  music.addEventListener("pause", () => {
    playing = false;
    updateMusicButton();
  });
 
  updateMusicButton();
}

/* ---------- BAN CHỦ NHIỆM: hành lang cuộn ngang ----------
   Mỗi nhiệm kỳ = 1 gian. Cuộn sang PHẢI để đi tới nhiệm kỳ kế tiếp.
   Thêm nhiệm kỳ mới: thêm 1 object vào BCN_TERMS (đặt SAU nhiệm kỳ cũ). Khi có dữ liệu thật, bỏ `upcoming: true`
   và điền members (ảnh toàn thân tỉ lệ 3:4), keepsakes (kỷ vật từng ban, có thể thêm ảnh ở phần tử thứ 4), letter.
   Ảnh đặt tại assets/bcn/<id>/<tên>.jpg */
const BCN_ROLES = [
  "Chủ nhiệm", "Phó Chủ nhiệm", "Phó Chủ nhiệm", "Trưởng ban Sáng tạo", "Trưởng ban Văn Nghệ",
  "Trưởng ban Truyền thông", "Trưởng ban Kỹ thuật", "Trưởng ban Nhân sự", "Trưởng ban Tư vấn"
];
/* Kỷ vật tượng trưng của 6 ban: [tên ban, mã biểu tượng, mô tả, (ảnh thật – tuỳ chọn)] */
const BCN_KEEPSAKES = [
  ["Ban Sáng tạo", "sangtao", "Bóng đèn ý tưởng – nơi mọi chương trình của CLB bắt đầu. Thay mô tả này bằng kỷ vật thật của Ban Sáng tạo."],
  ["Ban Văn Nghệ", "vannghe", "Nốt nhạc và tiếng hát của những đêm diễn. Thay mô tả này bằng kỷ vật thật của Ban Văn Nghệ."],
  ["Ban Truyền thông", "truyenthong", "Ống kính lưu giữ và lan tỏa hình ảnh CLB. Thay mô tả này bằng kỷ vật thật của Ban Truyền thông."],
  ["Ban Kỹ thuật", "kythuat", "Bánh răng vận hành mọi sự kiện trơn tru. Thay mô tả này bằng kỷ vật thật của Ban Kỹ thuật."],
  ["Ban Nhân sự", "nhansu", "Sợi dây gắn kết các thành viên. Thay mô tả này bằng kỷ vật thật của Ban Nhân sự."],
  ["Ban Tư vấn", "tuvan", "Những cuộc trò chuyện giúp bạn trẻ tìm đúng hướng. Thay mô tả này bằng kỷ vật thật của Ban Tư vấn."]
];
const BCN_DIR = "assets/bcn/2026-2027/";
const BCN_TERMS = [
  { id: "2026-2027",
    members: [
      ["Chủ nhiệm", "Kim Thư", BCN_DIR + "kim-thu.jpg"],
      ["Phó Chủ nhiệm", "Trương Ngọc Hân", BCN_DIR + "truong-ngoc-han.jpg"],
      ["Phó Chủ nhiệm", "Thanh Tài", BCN_DIR + "thanh-tai.jpg"],
      ["Trưởng ban Sáng tạo", "Thiên Lan", BCN_DIR + "thien-lan.jpg"],
      ["Trưởng ban Văn Nghệ", "Trung", BCN_DIR + "trung.jpg"],
      ["Trưởng ban Truyền thông", "Quách Huyền", BCN_DIR + "quach-huyen.jpg"],
      ["Trưởng ban Kỹ thuật", "Quốc Cường", BCN_DIR + "quoc-cuong.jpg"],
      ["Trưởng ban Nhân sự", "Nguyễn Ngọc Hân", BCN_DIR + "nguyen-ngoc-han.jpg"],
      ["Trưởng ban Tư vấn", "Phương Anh", BCN_DIR + "phuong-anh.jpg"]
    ],
    letter: ["[Thay bằng nội dung bức thư của Ban chủ nhiệm nhiệm kỳ 2026 – 2027.]", "Mỗi đoạn là một phần tử trong mảng letter."] },
  { id: "2027-2028", upcoming: true, letter: ["Gian này đang chờ thế hệ tiếp theo viết nên câu chuyện của mình."] },
];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

/* Khung ảnh 3:4 (toàn thân); thiếu ảnh thì hiện chữ cái đầu (hoặc dấu ? cho nhiệm kỳ sắp tới) */
function bcnPhoto(src, name, unknown) {
  const wrap = el("span", "bcn-sq bcn-tall");
  const hint = el("em", "", unknown ? "?" : (name.replace(/[\[\]]/g, "").trim()[0] || "5").toUpperCase());
  wrap.append(hint);
  if (src) {
    const img = el("img");
    img.src = src; img.alt = name; img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", () => img.remove());
    wrap.append(img);
  }
  return wrap;
}

/* Biểu tượng kỷ vật (SVG đơn giản, nét trắng trên huy hiệu màu) */
const BCN_ICONS = {
  sangtao: '<path d="M32 10a14 14 0 0 0-8 25.5V42h16v-6.5A14 14 0 0 0 32 10z"/><path d="M26 48h12M28 54h8"/>',
  vannghe: '<path d="M26 44V18l22-5v26"/><circle cx="21" cy="44" r="6"/><circle cx="43" cy="39" r="6"/>',
  truyenthong: '<rect x="8" y="20" width="48" height="32" rx="6"/><circle cx="32" cy="36" r="10"/><path d="M22 20l4-7h12l4 7"/>',
  kythuat: '<circle cx="32" cy="32" r="16" stroke-width="8" stroke-dasharray="7.2 6.3"/><circle cx="32" cy="32" r="9"/>',
  nhansu: '<circle cx="23" cy="24" r="7"/><circle cx="43" cy="26" r="6"/><path d="M9 50c0-9 6-14 14-14s14 5 14 14M38 38c8-1 17 3 17 12"/>',
  tuvan: '<path d="M10 14h44a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H30l-12 10V44h-8a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z"/><path d="M20 26h24M20 34h14"/>'
};
const BCN_COLORS = { sangtao: "#f2a516", vannghe: "#d9467a", truyenthong: "#2f7fd6", kythuat: "#4c9a63", nhansu: "#8a5cc7", tuvan: "#e0703a" };
function bcnBadge(key, cls) {
  const b = el("span", `bcn-badge ${cls || ""}`);
  b.style.setProperty("--bc", BCN_COLORS[key] || "#c0661a");
  b.innerHTML = `<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${BCN_ICONS[key] || ""}</svg>`;
  return b;
}

let bcnUid = 0;
/* Dải cờ treo + dây đèn trang trí đỉnh tường */
function bcnBunting() {
  const id = `bf${++bcnUid}`;
  const wrap = el("div", "bcn-bunting"); wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `<svg width="100%" height="46" preserveAspectRatio="none"><defs><pattern id="${id}" width="132" height="46" patternUnits="userSpaceOnUse">
    <polygon points="6,6 36,6 21,40" fill="#e0503c"/><polygon points="40,6 70,6 55,40" fill="#f5b43c"/>
    <polygon points="74,6 104,6 89,40" fill="#2f9fd6"/><polygon points="108,6 138,6 123,40" fill="#4c9a63"/></pattern></defs>
    <path d="M0 6 H100%" stroke="#7a4b1e" stroke-width="2"/><rect y="4" width="100%" height="42" fill="url(#${id})"/></svg>`;
  return wrap;
}
const BCN_PLANT = '<svg viewBox="0 0 90 150" aria-hidden="true"><path d="M45 100C20 90 12 60 22 30c14 10 22 34 23 70zM45 100c4-34 16-58 34-70 8 32-2 62-34 70zM45 100c-2-28 2-52 0-80 12 24 12 54 0 80z" fill="#4c9a63"/><path d="M26 100h38l-6 44H32z" fill="#c0661a"/><rect x="22" y="94" width="46" height="10" rx="4" fill="#a9541a"/></svg>';

function initBCN() {
  const hall = qs("#bcnHall"), zoom = qs("#bcnZoom");
  if (!hall || !zoom) return;
  const stage = qs(".bcn-stage", zoom), closeBtn = qs(".bcn-close", zoom);
  const prev = qs(".bcn-prev", zoom), next = qs(".bcn-next", zoom);
  const envelope = '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="2" y="6" width="60" height="40" rx="4" fill="#fffaf0" stroke="#a9722f" stroke-width="2"/><path d="M4 9l28 21L60 9" fill="none" stroke="#a9722f" stroke-width="2"/><circle cx="32" cy="30" r="6" fill="#e0503c"/></svg>';
  let items = [], at = 0, trigger = null, timer = 0;

  const mascot = cls => {
    const s = el("span", `bcn-mascot ${cls}`), m = el("img");
    m.src = "assets/mascot.png"; m.alt = "Mascot CLB Sinh viên 5 Tốt"; m.decoding = "async";
    m.addEventListener("error", () => { m.remove(); s.classList.add("no-img"); });
    s.appendChild(m); return s;
  };

  /* khung chứa: thanh năm + dải cuộn + nút */
  const years = el("nav", "bcn-years"); years.setAttribute("aria-label", "Chuyển nhanh giữa các nhiệm kỳ");
  const rail = el("div", "bcn-rail"), view = el("div", "bcn-viewport"), corridor = el("div", "bcn-corridor");
  view.tabIndex = 0; view.setAttribute("role", "region"); view.setAttribute("aria-label", "Hành lang Ban chủ nhiệm – cuộn ngang, sang phải là nhiệm kỳ kế tiếp");
  view.appendChild(corridor);
  const arrow = (cls, txt, label, d) => {
    const a = el("button", `bcn-scroll ${cls}`, txt); a.type = "button"; a.setAttribute("aria-label", label);
    a.addEventListener("click", () => view.scrollBy({ left: d * Math.max(260, view.clientWidth * .75), behavior: reducedMotion ? "auto" : "smooth" }));
    return a;
  };
  const aL = arrow("bcn-scroll-l", "‹", "Cuộn sang trái – nhiệm kỳ trước", -1), aR = arrow("bcn-scroll-r", "›", "Cuộn sang phải – nhiệm kỳ kế tiếp", 1);
  rail.append(view, aL, aR);
  hall.append(years, rail, el("p", "bcn-hint", "← Kéo, vuốt hoặc dùng nút ‹ › · Cuộn sang phải để tới nhiệm kỳ kế tiếp →"));

  BCN_TERMS.forEach((t, ti) => {
    const period = `Nhiệm kỳ ${t.id.replace("-", " – ")}`;
    const members = t.members || BCN_ROLES.map(r => [r, "Sắp cập nhật", ""]);
    const keeps = t.keepsakes || BCN_KEEPSAKES;
    const room = el("section", "bcn-room"); room.id = `nk-${t.id}`; room.setAttribute("aria-label", period);
    const wall = el("div", "bcn-wall"), frames = el("div", "bcn-frames"), shelf = el("div", "bcn-shelf");
    const list = [];
    const add = (btn, label, build) => {
      btn.type = "button"; btn.setAttribute("aria-label", label); btn.setAttribute("aria-haspopup", "dialog");
      const item = { btn, build };
      list.push(item);
      btn.addEventListener("click", () => open(list, item, btn));
      return btn;
    };

    members.forEach(([role, name, src]) => {
      const b = el("button", "bcn-frame");
      const tag = el("span", "bcn-tag"); tag.append(el("strong", "", name), el("small", "", role));
      b.append(bcnPhoto(src, name, t.upcoming), tag);
      frames.appendChild(add(b, `Phóng to ảnh: ${name} – ${role}`, () => [bcnPhoto(src, name, t.upcoming), el("h2", "", name), el("p", "", `${role} · ${period}`)]));
    });

    /* kệ kỷ vật: lá thư + kỷ vật 6 ban + mascot */
    const lb = el("button", "bcn-obj"); lb.innerHTML = envelope; lb.appendChild(el("small", "", "Lá thư"));
    add(lb, `Mở lá thư ${period}`, () => {
      const paper = el("div", "bcn-paper");
      (t.letter || []).forEach(p => paper.appendChild(el("p", "", p)));
      return [el("h2", "", "Thư gửi thế hệ sau"), el("p", "", period), paper];
    });
    shelf.appendChild(lb);
    keeps.forEach(([ban, key, desc, img]) => {
      const kb = el("button", "bcn-obj bcn-keep");
      const pic = img ? Object.assign(el("img", "bcn-keep-img"), { src: img, alt: `Kỷ vật ${ban}`, loading: "lazy" }) : bcnBadge(key);
      if (img) pic.addEventListener("error", () => pic.replaceWith(bcnBadge(key)));
      kb.append(pic, el("small", "", ban));
      add(kb, `Xem kỷ vật ${ban} – ${period}`, () => {
        const big = img ? Object.assign(el("img", "bcn-keep-big"), { src: img, alt: `Kỷ vật ${ban}` }) : bcnBadge(key, "bcn-badge-big");
        return [big, el("h2", "", `Kỷ vật ${ban}`), el("p", "", period), el("p", "bcn-desc", t.upcoming ? "Kỷ vật của ban sẽ được lưu giữ tại đây." : desc)];
      });
      shelf.appendChild(kb);
    });
    const mb = el("button", "bcn-obj"); mb.append(mascot("bcn-mascot-sm"), el("small", "", "Mascot"));
    add(mb, `Phóng to mascot ${period}`, () => [mascot("bcn-mascot-big"), el("h2", "", "Mascot CLB"), el("p", "", period)]);
    shelf.append(mb, el("span", "bcn-shelf-board"));

    const floor = el("div", "bcn-floor"); floor.setAttribute("aria-hidden", "true");
    const pl = el("span", "bcn-plant bcn-plant-l"), pr = el("span", "bcn-plant bcn-plant-r"); pl.innerHTML = pr.innerHTML = BCN_PLANT;
    floor.append(pl, pr);
    wall.append(bcnBunting(), el("span", "shelf-plate", period), frames, shelf);
    room.append(wall, floor);
    corridor.appendChild(room);

    /* cánh cửa dẫn sang nhiệm kỳ sau */
    const nextTerm = BCN_TERMS[ti + 1];
    if (nextTerm) {
      const door = el("div", "bcn-door"); door.setAttribute("aria-hidden", "true");
      door.append(el("span", "bcn-door-arch"), el("span", "bcn-door-sign", `Nhiệm kỳ ${nextTerm.id.replace("-", " – ")} →`));
      corridor.appendChild(door);
    }
    const chip = el("button", "bcn-year", t.id.replace("-", " – ")); chip.type = "button";
    if (t.upcoming) chip.classList.add("soon");
    chip.addEventListener("click", () => view.scrollTo({ left: room.offsetLeft - 24, behavior: reducedMotion ? "auto" : "smooth" }));
    years.appendChild(chip);
  });

  /* trạng thái nút/ nhiệm kỳ đang xem */
  const sync = () => {
    const max = view.scrollWidth - view.clientWidth;
    aL.hidden = view.scrollLeft < 8; aR.hidden = view.scrollLeft > max - 8;
    const rooms = qsa(".bcn-room", corridor), chips = qsa(".bcn-year", years);
    let cur = 0; rooms.forEach((r, i) => { if (r.offsetLeft - 24 <= view.scrollLeft + view.clientWidth * .35) cur = i; });
    chips.forEach((c, i) => c.classList.toggle("on", i === cur));
  };
  view.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
  addEventListener("resize", sync); sync();

  /* kéo chuột để cuộn ngang (vuốt trên cảm ứng đã có sẵn) */
  let sx = 0, sl = 0, down = false, dragged = false;
  view.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.button !== 0) return; down = true; dragged = false; sx = e.clientX; sl = view.scrollLeft; });
  addEventListener("pointermove", e => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (!dragged && Math.abs(dx) > 6) { dragged = true; view.classList.add("dragging"); }
    if (dragged) view.scrollLeft = sl - dx;
  });
  addEventListener("pointerup", () => { if (!down) return; down = false; view.classList.remove("dragging"); setTimeout(() => { dragged = false; }, 0); });
  view.addEventListener("click", e => { if (dragged) { e.stopPropagation(); e.preventDefault(); } }, true);

  function render() {
    stage.replaceChildren(...items[at].build());
    stage.scrollTop = 0;
    prev.hidden = next.hidden = items.length < 2;
  }
  function open(list, item, btn) {
    clearTimeout(timer);
    items = list; at = list.indexOf(item); trigger = btn;
    const r = btn.getBoundingClientRect();
    stage.style.setProperty("--dx", `${r.left + r.width / 2 - innerWidth / 2}px`);
    stage.style.setProperty("--dy", `${r.top + r.height / 2 - innerHeight / 2}px`);
    render();
    zoom.hidden = false; void zoom.offsetWidth;
    zoom.classList.add("show");
    document.body.classList.add("bcn-lock");
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (zoom.hidden || !zoom.classList.contains("show")) return;
    zoom.classList.remove("show");
    document.body.classList.remove("bcn-lock");
    timer = setTimeout(() => { zoom.hidden = true; }, reducedMotion ? 0 : 380);
    trigger?.focus({ preventScroll: true });
  }
  const step = d => { at = (at + d + items.length) % items.length; render(); };

  closeBtn.addEventListener("click", close);
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  zoom.addEventListener("click", e => { if (e.target === zoom) close(); });
  document.addEventListener("keydown", e => {
    if (zoom.hidden || !zoom.classList.contains("show")) return;
    if (e.key === "Escape") return close();
    if (e.key === "ArrowLeft" && items.length > 1) return step(-1);
    if (e.key === "ArrowRight" && items.length > 1) return step(1);
    if (e.key !== "Tab") return;
    const f = qsa("button:not([hidden])", zoom), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/* ---------- THÀNH TÍCH: phòng vinh danh giấy khen ----------
   Thêm giấy khen = thêm 1 object vào TT_ITEMS (không cần sửa HTML/CSS):
   { title: "Tên giấy khen", issuer: "Đơn vị trao tặng", date: "2026", level: "Cấp trường" | "Cấp tỉnh" | "Cấp Trung ương" | ...,
     note: "Mô tả ngắn (không bắt buộc)", img: "assets/thanhtich/ten-file.jpg" }
   - Có img: hiện ảnh giấy khen thật. Không có img: hiện mẫu giấy khen trang trí từ title.
   - placeholder: true = mục giữ chỗ (xóa dòng này khi điền dữ liệu thật). Sắp xếp: mới nhất trước. */
const TT_ITEMS = [
  { title: "[Tên giấy khen 1]", issuer: "[Đơn vị trao tặng]", date: "2026", level: "Cấp Trung ương", note: "Mục giữ chỗ – thay bằng thông tin và ảnh giấy khen thật.", placeholder: true },
  { title: "[Tên giấy khen 2]", issuer: "[Đơn vị trao tặng]", date: "2026", level: "Cấp tỉnh", note: "Mục giữ chỗ – thay bằng thông tin và ảnh giấy khen thật.", placeholder: true },
  { title: "[Tên giấy khen 3]", issuer: "[Đơn vị trao tặng]", date: "2025", level: "Cấp tỉnh", note: "Mục giữ chỗ – thay bằng thông tin và ảnh giấy khen thật.", placeholder: true },
  { title: "[Tên giấy khen 4]", issuer: "[Đơn vị trao tặng]", date: "2025", level: "Cấp trường", note: "Mục giữ chỗ – thay bằng thông tin và ảnh giấy khen thật.", placeholder: true },
  { title: "[Tên giấy khen 5]", issuer: "[Đơn vị trao tặng]", date: "2024", level: "Cấp trường", note: "Mục giữ chỗ – thay bằng thông tin và ảnh giấy khen thật.", placeholder: true },
  { title: "[Tên giấy khen 6]", issuer: "[Đơn vị trao tặng]", date: "2024", level: "Cấp trường", note: "Mục giữ chỗ – thay bằng thông tin và ảnh giấy khen thật.", placeholder: true },
];
const TT_LEVELS = { "Cấp Trung ương": "tw", "Cấp tỉnh": "tinh", "Cấp trường": "truong" };

/* Mẫu giấy khen trang trí (co giãn theo khung nhờ đơn vị cqw) */
function ttCert(it) {
  const c = el("div", "tt-cert");
  c.innerHTML = '<span class="tt-cert-corner c1"></span><span class="tt-cert-corner c2"></span><span class="tt-cert-corner c3"></span><span class="tt-cert-corner c4"></span>';
  const body = el("div", "tt-cert-body");
  body.append(el("small", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"), el("b", "tt-cert-h", "GIẤY KHEN"), el("i", "tt-cert-line"),
    el("span", "tt-cert-t", it.title), el("small", "tt-cert-s", it.issuer || ""));
  const seal = el("span", "tt-seal"); seal.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6l3.8 7.7 8.5 1.2-6.2 6 1.5 8.4L20 25.3l-7.6 4 1.5-8.4-6.2-6 8.5-1.2z" fill="#fff3c4"/></svg>';
  c.append(body, seal);
  return c;
}
/* Ảnh thật nếu có; lỗi/thiếu ảnh thì dùng mẫu trang trí */
function ttPaper(it) {
  const p = el("span", "tt-paper");
  if (it.img) {
    const img = el("img"); img.src = it.img; img.alt = `Giấy khen: ${it.title}`; img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", () => { img.remove(); p.appendChild(ttCert(it)); });
    p.appendChild(img);
  } else p.appendChild(ttCert(it));
  return p;
}

function initThanhTich() {
  const wall = qs("#ttWall"), zoom = qs("#ttZoom");
  if (!wall || !zoom) return;
  const filters = qs("#ttFilters"), count = qs("#ttCount");
  const stage = qs(".tt-stage", zoom), closeBtn = qs(".tt-close", zoom), prev = qs(".tt-prev", zoom), next = qs(".tt-next", zoom);
  const all = [...TT_ITEMS].sort((a, b) => String(b.date).localeCompare(String(a.date), "vi", { numeric: true }));
  const real = all.filter(i => !i.placeholder).length;
  count.textContent = real ? `Hiện có ${real} giấy khen được trưng bày` : "Đang cập nhật – các khung bên dưới là chỗ giữ cho giấy khen thật của CLB.";

  let shown = all, cur = "Tất cả", at = 0, trigger = null, timer = 0;
  const levels = ["Tất cả", ...new Set(all.map(i => i.level).filter(Boolean))];
  if (levels.length < 3) filters.hidden = true;
  levels.forEach(l => {
    const b = el("button", "tt-chip", l); b.type = "button"; b.setAttribute("aria-pressed", l === cur ? "true" : "false");
    b.addEventListener("click", () => { cur = l; qsa(".tt-chip", filters).forEach(x => x.setAttribute("aria-pressed", String(x === b))); render(); });
    filters.appendChild(b);
  });

  function render() {
    shown = cur === "Tất cả" ? all : all.filter(i => i.level === cur);
    wall.replaceChildren();
    shown.forEach((it, i) => {
      const card = el("button", "tt-card"); card.type = "button"; card.style.setProperty("--i", i);
      card.setAttribute("aria-haspopup", "dialog"); card.setAttribute("aria-label", `Xem giấy khen: ${it.title}`);
      const frame = el("span", "tt-frame"), mat = el("span", "tt-mat");
      mat.appendChild(ttPaper(it)); frame.appendChild(mat);
      const lv = el("span", `tt-level lv-${TT_LEVELS[it.level] || "khac"}`, it.level || "Giấy khen");
      const plate = el("span", "tt-plate"); plate.append(el("strong", "", it.title), el("small", "", [it.issuer, it.date].filter(Boolean).join(" · ")));
      card.append(el("span", "tt-lamp"), frame, lv, plate);
      card.addEventListener("click", () => open(i, card));
      wall.appendChild(card);
    });
    wall.appendChild(Object.assign(el("div", "tt-empty"), { innerHTML: "<span>+</span><b>Chỗ trống cho thành tích tiếp theo</b>" }));
  }
  function build() {
    const it = shown[at], big = ttPaper(it); big.classList.add("tt-paper-big");
    const meta = el("p", "tt-meta"); meta.textContent = [it.level, it.issuer, it.date].filter(Boolean).join(" · ");
    stage.replaceChildren(big, el("h2", "", it.title), meta, ...(it.note ? [el("p", "tt-note", it.note)] : []));
    stage.scrollTop = 0; prev.hidden = next.hidden = shown.length < 2;
  }
  function open(i, btn) {
    clearTimeout(timer); at = i; trigger = btn;
    const r = btn.getBoundingClientRect();
    stage.style.setProperty("--dx", `${r.left + r.width / 2 - innerWidth / 2}px`);
    stage.style.setProperty("--dy", `${r.top + r.height / 2 - innerHeight / 2}px`);
    build(); zoom.hidden = false; void zoom.offsetWidth; zoom.classList.add("show");
    document.body.classList.add("bcn-lock"); closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (zoom.hidden || !zoom.classList.contains("show")) return;
    zoom.classList.remove("show"); document.body.classList.remove("bcn-lock");
    timer = setTimeout(() => { zoom.hidden = true; }, reducedMotion ? 0 : 380);
    trigger?.focus({ preventScroll: true });
  }
  const step = d => { at = (at + d + shown.length) % shown.length; build(); };
  closeBtn.addEventListener("click", close); prev.addEventListener("click", () => step(-1)); next.addEventListener("click", () => step(1));
  zoom.addEventListener("click", e => { if (e.target === zoom) close(); });
  document.addEventListener("keydown", e => {
    if (zoom.hidden || !zoom.classList.contains("show")) return;
    if (e.key === "Escape") return close();
    if (e.key === "ArrowLeft" && shown.length > 1) return step(-1);
    if (e.key === "ArrowRight" && shown.length > 1) return step(1);
    if (e.key !== "Tab") return;
    const f = qsa("button:not([hidden])", zoom), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  render();

  /* tia sáng lấp lánh ở phần đầu trang */
  const sp = qs(".tt-sparks");
  if (sp && !reducedMotion) for (let i = 0; i < 22; i++) {
    const d = el("i"); d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${(3 + Math.random() * 4).toFixed(1)}s;--l:${(Math.random() * 5).toFixed(1)}s;--s:${(2 + Math.random() * 3).toFixed(1)}px`;
    sp.appendChild(d);
  }
}

/* Intro: chỉ hiện 1 lần mỗi phiên (quay lại "Trang chủ" không bị chặn nữa), đóng ngay khi bấm,
   và khóa Tab vào nội dung phía sau khi intro còn mở. */
function initIntro() {
  const intro = qs("#intro-screen"), btn = qs("#startExperience");
  if (!intro) return;
  const page = qsa("header.site-header, main, footer");
  const finish = () => { document.body.classList.remove("intro-active"); page.forEach(n => { n.inert = false; }); };
  let seen = false;
  try { seen = sessionStorage.getItem("introSeen") === "1"; } catch {}
  if (seen) { intro.remove(); finish(); return; }
  page.forEach(n => { n.inert = true; });
  btn?.focus({ preventScroll: true });
  btn?.addEventListener("click", () => {
    try { sessionStorage.setItem("introSeen", "1"); } catch {}
    intro.classList.add("hidden"); finish();
    setTimeout(() => intro.remove(), 1000);
  });
}

/* Tạm dừng video/nhạc khi ẩn tab, chỉ phát lại phần đã bị mình dừng */
function initVisibilityPause() {
  const paused = new Set();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      qsa("video, audio").forEach(m => { if (!m.paused) { m.pause(); paused.add(m); } });
    } else {
      paused.forEach(m => m.play().catch(() => {}));
      paused.clear();
    }
  });
}

/* Lazy-load mọi ảnh ngoài header/preloader/intro */
function initLazyImages() {
  qsa("img:not([loading])").forEach(img => {
    if (img.closest(".site-header, #preloader, .intro-screen")) return;
    img.loading = "lazy";
    img.decoding = "async";
  });
}

/* Mỗi tính năng chạy độc lập: 1 phần tử thiếu hoặc 1 lỗi không làm gãy cả script */
function init() {
  [
    initScrollLoop, initNavbar, initSmoothScroll, initScrollReveal, initFAQ,
    initQRButtons, initActivityModal, initActivityVideos, initSocialLinks,
    initSocialHub, initMagneticButtons, initConfettiBurst, initCardTilt,
    initParallax, initParticles, initScrollProgress, initBackToTop,
    initActiveNavigation, initReducedMotion, initLoading, initLazyImages,
    initMissingAssets, initIntro, initBCN, initThanhTich, initVisibilityPause, initBackgroundMusic
  ].forEach(fn => {
    try { fn(); } catch (err) { console.warn(`[${fn.name}]`, err); }
  });
}
document.addEventListener("DOMContentLoaded", init);
