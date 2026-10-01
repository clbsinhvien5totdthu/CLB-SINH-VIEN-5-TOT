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
 
  if (startButton) {
    startButton.addEventListener("click", async () => {
 
      // Bật nhạc ngay trong chính user interaction
      await startMusic();
 
      // Đóng intro
      if (intro) {
        intro.classList.add("hidden");
 
        setTimeout(() => {
          intro.remove();
        }, 1000);
      }
 
      // Cho phép body scroll lại
      document.body.classList.remove("intro-active");
    });
  }
 
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

/* ---------- BAN CHỦ NHIỆM: dữ liệu (thêm nhiệm kỳ mới = thêm 1 object vào đầu/cuối mảng) ---------- */
const BCN_TERMS = [
  { id: "2022-2023", period: "Nhiệm kỳ 2022 – 2023", photo: "assets/bcn-2022-2023.jpg",
    members: [["Chủ nhiệm", "[Họ và tên]"], ["Phó Chủ nhiệm", "[Họ và tên]"], ["Trưởng ban Truyền thông", "[Họ và tên]"], ["Trưởng ban Sự kiện", "[Họ và tên]"]],
    letter: ["[Thay bằng nội dung bức thư của Ban chủ nhiệm nhiệm kỳ 2022 – 2023.]", "Mỗi đoạn là một phần tử trong mảng letter."] },
  { id: "2023-2024", period: "Nhiệm kỳ 2023 – 2024", photo: "assets/bcn-2023-2024.jpg",
    members: [["Chủ nhiệm", "[Họ và tên]"], ["Phó Chủ nhiệm", "[Họ và tên]"], ["Trưởng ban Truyền thông", "[Họ và tên]"], ["Trưởng ban Sự kiện", "[Họ và tên]"]],
    letter: ["[Thay bằng nội dung bức thư của Ban chủ nhiệm nhiệm kỳ 2023 – 2024.]"] },
  { id: "2024-2025", period: "Nhiệm kỳ 2024 – 2025", photo: "assets/bcn-2024-2025.jpg",
    members: [["Chủ nhiệm", "[Họ và tên]"], ["Phó Chủ nhiệm", "[Họ và tên]"], ["Trưởng ban Truyền thông", "[Họ và tên]"], ["Trưởng ban Sự kiện", "[Họ và tên]"]],
    letter: ["[Thay bằng nội dung bức thư của Ban chủ nhiệm nhiệm kỳ 2024 – 2025.]"] }
];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function initBCN() {
  const hall = qs("#bcnHall"), panel = qs("#bcnPanel"), overlay = qs("#bcnOverlay");
  if (!hall || !panel || !overlay) return;
  const closeBtn = qs(".bcn-close", panel);
  let lastTrigger = null;

  const envelope = '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="2" y="6" width="60" height="40" rx="4" fill="#fffaf0" stroke="#a9722f" stroke-width="2"/><path d="M4 9l28 21L60 9" fill="none" stroke="#a9722f" stroke-width="2"/><circle cx="32" cy="30" r="6" fill="#e0503c"/></svg>';

  BCN_TERMS.forEach((t, i) => {
    const room = el("section", "bcn-room");
    const shelf = el("button", "shelf");
    shelf.type = "button";
    shelf.dataset.index = i;
    shelf.setAttribute("aria-haspopup", "dialog");
    shelf.setAttribute("aria-label", `Mở ${t.period}`);
    const plate = el("span", "shelf-plate", t.period);
    const row = el("span", "shelf-row");
    const letter = el("span", "shelf-letter");
    letter.innerHTML = envelope;
    letter.appendChild(el("small", "", "Lá thư"));
    const frame = el("span", "shelf-frame");
    const img = el("img");
    img.src = t.photo; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", () => { img.remove(); });
    frame.append(img, el("em", "", "ẢNH BCN"));
    const mascot = el("span", "shelf-mascot");
    const m = el("img"); m.src = "assets/mascot.png"; m.alt = "Mascot CLB"; m.loading = "lazy";
    m.addEventListener("error", () => { m.remove(); mascot.classList.add("no-img"); });
    mascot.appendChild(m);
    row.append(letter, frame, mascot);
    shelf.append(plate, row, el("span", "shelf-board"));
    shelf.addEventListener("click", () => open(i, shelf));
    room.appendChild(shelf);
    hall.appendChild(room);
  });

  function open(i, trigger) {
    const t = BCN_TERMS[i];
    lastTrigger = trigger;
    qsa(".shelf.is-active").forEach(s => s.classList.remove("is-active"));
    trigger.classList.add("is-active");
    qs("#bcnPeriod").textContent = "Hành lang kỷ niệm";
    qs("#bcnTitle").textContent = t.period;
    const photo = qs("#bcnPhoto");
    photo.hidden = false; photo.src = t.photo; photo.alt = `Ảnh tập thể Ban chủ nhiệm ${t.period}`;
    photo.onerror = () => { photo.hidden = true; };
    const list = qs("#bcnMembers"); list.replaceChildren();
    t.members.forEach(([role, name]) => {
      const li = el("li"); li.append(el("span", "", role), el("strong", "", name)); list.appendChild(li);
    });
    const letter = qs("#bcnLetter"); letter.replaceChildren();
    t.letter.forEach(p => letter.appendChild(el("p", "", p)));
    overlay.hidden = false;
    document.body.classList.add("bcn-lock");
    requestAnimationFrame(() => {
      overlay.classList.add("show");
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      panel.scrollTop = 0;
      closeBtn?.focus({ preventScroll: true });
    });
  }

  function close() {
    if (!panel.classList.contains("open")) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    document.body.classList.remove("bcn-lock");
    qsa(".shelf.is-active").forEach(s => s.classList.remove("is-active"));
    setTimeout(() => { overlay.hidden = true; }, 320);
    lastTrigger?.focus({ preventScroll: true });
  }

  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (!panel.classList.contains("open")) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    const f = qsa("button, a[href]", panel);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
    initMissingAssets, initBCN, initVisibilityPause, initBackgroundMusic
  ].forEach(fn => {
    try { fn(); } catch (err) { console.warn(`[${fn.name}]`, err); }
  });
}
document.addEventListener("DOMContentLoaded", init);
