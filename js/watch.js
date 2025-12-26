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
const fullscreenBtn = document.getElementById("openFullscreenBtn");

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
    <div
      class="player-overlay"
      id="playerOverlay"
      style="background-image:url('${video.thumb}')"
    >
      <div class="play-btn"></div>
    </div>
    <iframe class="player-iframe" src="" allowfullscreen></iframe>
  `;

  const overlay = document.getElementById("playerOverlay");
  const iframe = player.querySelector("iframe");

  let click = 0;
  let viewed = false;

  overlay.onclick = () => {
    click++;
    window.open(AFF_LINK, "_blank");

    if (click === 2) {
      if (!viewed) {
        viewed = true;
        fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
      }

      iframe.src = video.embed;
      overlay.style.display = "none";

      if (fullscreenBtn) {
        fullscreenBtn.style.display = "inline-block";
        fullscreenBtn.onclick = () => {
          location.href = video.embed;
        };
      }
    }
  };

  if (video.download) {
    downloadBtn.href = video.download;
  } else {
    downloadBtn.style.display = "none";
  }

  relatedGrid.innerHTML = "";
  videos
  .filter(v => v.id !== id)
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

    // 👉 FETCH VIEW GIỐNG TRANG CHỦ
    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("rv-" + v.id);
        if (el) {
          el.textContent = formatView(d.views) + " view";
        }
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
