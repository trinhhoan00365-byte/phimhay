const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";
const WORKER_URL = "https://go.avboy.top";

/* =========================
   GET VIDEO ID (PATH + QUERY)
   ========================= */
let id = null;

// CASE 1: /watch/123
const pathMatch = location.pathname.match(/^\/watch\/(\d+)$/);
if (pathMatch) {
  id = Number(pathMatch[1]);
}

// CASE 2: /watch.html?id=123
if (!id) {
  const params = new URLSearchParams(location.search);
  const qid = params.get("id");
  if (qid) {
    id = Number(qid);
    // ÉP URL ĐẸP
    history.replaceState(null, "", `/watch/${qid}`);
  }
}

if (!id) {
  console.error("❌ Missing video ID");
}

/* =========================
   DOM
   ========================= */
const player = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewsEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const relatedGrid = document.getElementById("related-grid");
const downloadBtn = document.getElementById("download-btn");

const loadingEl = document.getElementById("watch-loading");
const containerEl = document.getElementById("watch-container");

let videos = [];

function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

/* =========================
   LOAD VIDEOS
   ========================= */
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    initWatch();
  });

function initWatch() {
  const video = videos.find(v => v.id === id);
  if (!video) {
    titleEl.textContent = "Video không tồn tại";
    showContent();
    return;
  }

  titleEl.textContent = video.title;
  durationEl.textContent = "⏱ " + (video.duration || "");

  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " view";
    });

  player.innerHTML = `
  <div class="player-overlay" id="playerOverlay"
       style="background-image:url('${video.thumb}')">
    <div class="play-btn"></div>
    <div class="click-hint" id="clickHint">
      Click 0/2 times to watch video
    </div>
  </div>
  <iframe class="player-iframe" src="" allowfullscreen></iframe>
`;

  const overlay = document.getElementById("playerOverlay");
  const iframe = player.querySelector("iframe");

  let click = 0;
let viewed = false;
const maxClick = 2;
const hint = document.getElementById("clickHint");

overlay.onclick = () => {
  click++;

  // popup aff (phải gắn với click)
  window.open(AFF_LINK, "_blank");

  // cập nhật text dưới nút play
  if (hint) {
    hint.textContent = `Click ${click}/${maxClick} times to watch video`;
  }

  // đủ số click thì mở video
  if (click >= maxClick) {

    // 🔥 tăng view CHỈ 1 LẦN
    if (!viewed) {
      viewed = true;
      fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
    }

    iframe.src = video.embed;
    overlay.style.display = "none";

    
  }
};

  let downloadClick = 0;
let resetTimer = null;
let lastClickTime = 0;

if (video.download) {
  downloadBtn.onclick = (e) => {
    e.preventDefault();

    // 🚫 CHẶN CLICK SPAM QUÁ NHANH ( < 800ms )
    const now = Date.now();
    if (now - lastClickTime < 800) return;
    lastClickTime = now;

    downloadClick++;

    // ⏱ RESET NẾU USER BỎ GIỮA CHỪNG (15 GIÂY)
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      downloadClick = 0;
      downloadBtn.textContent = "Download";
      downloadBtn.style.opacity = "1";
    }, 15000);

    // 🔥 CLICK 1
    if (downloadClick === 1) {
      window.open(AFF_LINK, "_blank");
      downloadBtn.textContent = "Click again to download";
      downloadBtn.style.opacity = "0.9";
      return;
    }

    // 🔥 CLICK 2
    if (downloadClick === 2) {
      window.open(AFF_LINK, "_blank");
      downloadBtn.textContent = "Download now";
      downloadBtn.style.opacity = "1";
      return;
    }

    // 🔥 CLICK 3 → DOWNLOAD
    if (downloadClick === 3) {
      const url =
        WORKER_URL +
        "/download?url=" +
        encodeURIComponent(video.download);

      window.location.href = url;

      // 🔁 RESET SAU KHI DOWNLOAD
      downloadClick = 0;
      clearTimeout(resetTimer);
      downloadBtn.textContent = "Download";
      downloadBtn.style.opacity = "1";
    }
  };
} else {
  downloadBtn.style.display = "none";
}

  relatedGrid.innerHTML = "";
  videos
  .filter(v => v.id !== id)
  .sort((a, b) => (b.views || 0) - (a.views || 0))
  .slice(0, 20)
  .forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}">
        <span class="duration">${v.duration || ""}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="related-views" id="rv-${v.id}">0 view</div>
    `;

    card.onclick = () => location.href = `/watch/${v.id}`;
    relatedGrid.appendChild(card);

    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("rv-" + v.id);
        if (el) el.textContent = formatView(d.views) + " view";
      })
      .catch(() => {});
  });
  showContent();
}

function showContent() {
  if (loadingEl) loadingEl.style.display = "none";
  if (containerEl) containerEl.classList.remove("hidden");
  const cover = document.getElementById("page-cover");
  if (cover) cover.classList.add("hide");
}
(function fixMobileFullscreenBack() {
  const video = document.querySelector("video");
  if (!video) return;

  let historyFixed = false;
  let justExitedFullscreen = false;

  // 1️⃣ Khi play video → push lại URL hiện tại
  video.addEventListener("play", () => {
    if (historyFixed) return;

    history.pushState(
      { fullscreenFix: true },
      "",
      window.location.href
    );

    historyFixed = true;
  });

  // 2️⃣ Bắt sự kiện fullscreen change (iOS + Android)
  const onFullscreenChange = () => {
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!isFullscreen) {
      // vừa thoát fullscreen
      justExitedFullscreen = true;

      // reset cờ sau 1 giây
      setTimeout(() => {
        justExitedFullscreen = false;
      }, 1000);
    }
  };

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);

  // 3️⃣ Chặn browser back ngay sau khi thoát fullscreen
  window.addEventListener("popstate", (e) => {
    if (justExitedFullscreen) {
      history.pushState(
        { fullscreenFix: true },
        "",
        window.location.href
      );
    }
  });
})();
/* =========================
   FIX FULLSCREEN BACK – STABLE (NO TIMEOUT)
   ========================= */
(function stableFullscreenFix() {
  let blockNextBack = false;

  // luôn giữ ít nhất 2 history state
  history.replaceState({ watch: true }, "", location.href);
  history.pushState({ watch: true }, "", location.href);

  function onFsChange() {
    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!isFullscreen) {
      // vừa thoát fullscreen
      blockNextBack = true;
    }
  }

  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);

  window.addEventListener("popstate", () => {
    if (blockNextBack) {
      history.pushState({ watch: true }, "", location.href);
      blockNextBack = false; // reset SAU KHI CHẶN
    }
  });

  // reset khi user click link thật sự
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.href && !a.href.includes("/watch")) {
      blockNextBack = false;
    }
  });
})();
