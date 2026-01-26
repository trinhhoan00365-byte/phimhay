const AFF_LINK = "https://s.shopee.vn/1gCegRiWIN"; 
const WORKER_URL = "https://go.avboy.top";

/* =========================
   GET ID
========================= */
let id = null;

const pathMatch = location.pathname.match(/^\/watch\/(\d+)$/);
if (pathMatch) id = Number(pathMatch[1]);

if (!id) {
  const params = new URLSearchParams(location.search);
  const qid = params.get("id");
  if (qid) {
    id = Number(qid);
    history.replaceState(null, "", `/watch/${qid}`);
  }
}

if (!id) {
  console.error("❌ Missing video ID");
}

/* =========================
   ELEMENTS
========================= */
const player = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewsEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const relatedGrid = document.getElementById("related-grid");
const downloadBtn = document.getElementById("download-btn");

const loadingEl = document.getElementById("watch-loading");
const containerEl = document.getElementById("watch-container");

/* =========================
   HELPERS
========================= */
function hidePageCover() {
  const cover = document.getElementById("page-cover");
  if (cover && !cover.classList.contains("hide")) {
    cover.classList.add("hide");
  }
}

function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

/* 🔥 CÁCH MỞ SHOPEE CHUẨN */
function openShopee(link) {
  const a = document.createElement("a");
  a.href = link;
  a.target = "_self";
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* =========================
   LOAD VIDEOS
========================= */
let videos = [];

fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    initWatch();
  });

function initWatch() {
  const video = videos.find(v => v.id === id);

  if (!video) {
    titleEl.textContent = "Video Not Found";
    hidePageCover();
    return;
  }

  hidePageCover();

  titleEl.textContent = video.title;
  durationEl.textContent = "Duration: " + (video.duration || "");

  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " views";
    });

  /* =========================
     PLAYER
  ========================= */
  player.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
         style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
    </div>

    <video
      id="nativeVideo"
      class="player-video"
      preload="metadata"
      playsinline
      webkit-playsinline
      controls
      controlsList="nodownload"
    ></video>
  `;

  const overlay = document.getElementById("playerOverlay");
  const videoEl = document.getElementById("nativeVideo");

  let click = 0;
  let viewed = false;
  const maxClick = 2;

  /* 🔥 CLICK 1–2: CHỈ MỞ SHOPEE */
  overlay.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    click++;
    openShopee(AFF_LINK);

    if (click < maxClick) return;

    // click >= 2 → play video (CLICK SAU)
    if (!viewed) {
      viewed = true;
      fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
    }

    setTimeout(() => {
      videoEl.src = video.video || video.embed;
      videoEl.play().catch(() => {});
      overlay.style.display = "none";
    }, 300);
  };

  /* =========================
     DOWNLOAD
  ========================= */
  let downloadClick = 0;
  let resetTimer = null;
  let lastClickTime = 0;

  if (video.download) {
    downloadBtn.onclick = (e) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastClickTime < 800) return;
      lastClickTime = now;

      downloadClick++;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        downloadClick = 0;
        downloadBtn.textContent = "Download";
      }, 15000);

      if (downloadClick <= 2) {
        openShopee(AFF_LINK);
        downloadBtn.textContent = "Click again to download";
        return;
      }

      if (downloadClick === 3) {
        location.assign(
          WORKER_URL +
          "/download?url=" +
          encodeURIComponent(video.download)
        );
        downloadClick = 0;
        clearTimeout(resetTimer);
        downloadBtn.textContent = "Download";
      }
    };
  } else {
    downloadBtn.style.display = "none";
  }

  /* =========================
     RELATED
  ========================= */
  relatedGrid.innerHTML = "";
  videos
    .filter(v => v.id !== id)
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
        <div class="related-views" id="rv-${v.id}">0 views</div>
      `;

      card.onclick = () => location.href = `/watch/${v.id}`;
      relatedGrid.appendChild(card);

      fetch(WORKER_URL + "/view?id=" + v.id)
        .then(r => r.json())
        .then(d => {
          const el = document.getElementById("rv-" + v.id);
          if (el) el.textContent = formatView(d.views) + " views";
        })
        .catch(() => {});
    });

  if (typeof showContent === "function") showContent();
}
