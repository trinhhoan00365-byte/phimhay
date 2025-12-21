// ===== CONFIG =====
const WORKER_URL = "https://go.avboy.top";
const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";

// ===== GET VIDEO ID =====
let videoId = null;

// /watch/abcd
const match = location.pathname.match(/\/watch\/([^\/]+)/);
if (match) videoId = match[1];

// fallback ?id=
if (!videoId) {
  const params = new URLSearchParams(location.search);
  videoId = params.get("id");
}

if (!videoId) {
  showNotFound();
  throw new Error("NO VIDEO ID");
}

// ===== DOM =====
const playerBox = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewEl = document.getElementById("video-view");
const relatedGrid = document.getElementById("related-grid");
const downloadBtn = document.getElementById("download-btn");
const fullscreenBtn = document.getElementById("openFullscreenBtn");

// ===== INIT =====
initWatch();

async function initWatch() {
  try {
    const res = await fetch(WORKER_URL + "/videos");
    const videos = await res.json();

    if (!Array.isArray(videos)) {
      showNotFound();
      return;
    }

    const video = videos.find(v => String(v.id) === String(videoId));
    if (!video) {
      showNotFound();
      return;
    }

    renderMain(video);
    renderRelated(videos, video.id);

  } catch (e) {
    console.error(e);
    showNotFound();
  }
}

// ===== RENDER MAIN =====
function renderMain(video) {
  titleEl.textContent = video.title || "";

  let clicked = 0;
  let viewed = false;

  playerBox.innerHTML = `
    <div id="playerOverlay" class="player-overlay"
      style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
    </div>
    <iframe id="videoFrame" src="" allowfullscreen></iframe>
  `;

  const overlay = document.getElementById("playerOverlay");
  const iframe = document.getElementById("videoFrame");

  overlay.onclick = () => {
    clicked++;
    window.open(AFF_LINK, "_blank");

    if (clicked >= 2) {
      iframe.src = video.embed;
      overlay.style.display = "none";

      if (!viewed) {
        viewed = true;
        fetch(`${WORKER_URL}/view?id=${video.id}&inc=1`).catch(() => {});
      }

      fullscreenBtn.style.display = "inline-block";
      fullscreenBtn.onclick = () => {
        window.open(video.embed, "_blank");
      };
    }
  };

  // load view
  fetch(`${WORKER_URL}/view?id=${video.id}`)
    .then(r => r.json())
    .then(d => {
      viewEl.textContent = (d.views || 0) + " view";
    });

  // download
  if (video.download) {
    downloadBtn.href = video.download;
    downloadBtn.style.display = "inline-block";
  } else {
    downloadBtn.style.display = "none";
  }
}

// ===== RELATED =====
function renderRelated(videos, currentId) {
  relatedGrid.innerHTML = "";

  videos
    .filter(v => String(v.id) !== String(currentId))
    .slice(0, 12)
    .forEach(v => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb-wrap">
          <img class="thumb" src="${v.thumb}">
          <span class="duration">${v.duration || ""}</span>
        </div>
        <h3>${v.title}</h3>
      `;
      card.onclick = () => {
        location.href = "/watch/" + v.id;
      };
      relatedGrid.appendChild(card);
    });
}

// ===== NOT FOUND =====
function showNotFound() {
  document.body.innerHTML = `
    <div style="color:white;text-align:center;padding:40px">
      <h2>Video không tồn tại</h2>
      <a href="/" style="color:#c084fc">← Quay về trang chủ</a>
    </div>
  `;
}
