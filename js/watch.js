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

/* =========================
   PAGE COVER FIX (🔥 QUAN TRỌNG)
   ========================= */
function hidePageCover() {
  const cover = document.getElementById("page-cover");
  if (cover && !cover.classList.contains("hide")) {
    cover.classList.add("hide");
  }
}

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
    hidePageCover();
    return;
  }

  // 🔥 ẨN PAGE COVER NGAY KHI CÓ VIDEO
  hidePageCover();

  titleEl.textContent = video.title;
  durationEl.textContent = "⏱ " + (video.duration || "");

  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " view";
    });

  /* =========================
     PLAYER (VIDEO NATIVE)
     ========================= */
  player.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
         style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
      <div class="click-hint" id="clickHint">
        Click 0/2 times to watch video
      </div>
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
  const hint = document.getElementById("clickHint");

  overlay.onclick = () => {
    click++;

    // popup aff
    window.open(AFF_LINK, "_blank");

    if (hint) {
      hint.textContent = `Click ${click}/${maxClick} times to watch video`;
    }

    if (click >= maxClick) {
      if (!viewed) {
        viewed = true;
        fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
      }

      videoEl.src = video.video || video.embed;
      videoEl.play().catch(() => {});
      overlay.style.display = "none";
    }
  };

  /* =========================
     DOWNLOAD LOGIC (GIỮ NGUYÊN)
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
        downloadBtn.style.opacity = "1";
      }, 15000);

      if (downloadClick === 1) {
        window.open(AFF_LINK, "_blank");
        downloadBtn.textContent = "Click again to download";
        downloadBtn.style.opacity = "0.9";
        return;
      }

      if (downloadClick === 2) {
        window.open(AFF_LINK, "_blank");
        downloadBtn.textContent = "Download now";
        downloadBtn.style.opacity = "1";
        return;
      }

      if (downloadClick === 3) {
        const url =
          WORKER_URL +
          "/download?url=" +
          encodeURIComponent(video.download);

        window.location.href = url;

        downloadClick = 0;
        clearTimeout(resetTimer);
        downloadBtn.textContent = "Download";
        downloadBtn.style.opacity = "1";
      }
    };
  } else {
    downloadBtn.style.display = "none";
  }

  /* =========================
     RELATED VIDEOS (GIỮ NGUYÊN)
     ========================= */
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

  // giữ nguyên nếu bạn còn dùng ở nơi khác
  if (typeof showContent === "function") {
    showContent();
  }
}
