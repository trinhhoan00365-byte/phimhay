// ================= CONFIG =================
const WORKER_URL = "https://go.avboy.top"; // domain worker của bạn
const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173"; // 🔥 LINK AFF CỦA BẠN

// ================= GET VIDEO ID =================
let videoId = null;

// URL dạng /watch/abcd
const match = location.pathname.match(/\/watch\/([^\/]+)/);
if (match) videoId = match[1];

// fallback cũ ?id=
if (!videoId) {
  const params = new URLSearchParams(location.search);
  videoId = params.get("id");
}

if (!videoId) {
  showNotFound();
  throw new Error("NO VIDEO ID");
}

// ================= INIT =================
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

// ================= RENDER MAIN =================
function renderMain(video) {
  const playerBox = document.getElementById("player");
  const titleEl = document.getElementById("video-title");
  const viewEl = document.getElementById("view-count");

  if (titleEl) titleEl.textContent = video.title || "";

  let clicked = 0;
  let viewed = false;

  playerBox.innerHTML = `
    <div id="playerOverlay" class="player-overlay" style="background-image:url('${video.thumb}')">
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
    }
  };

  // load view
  fetch(`${WORKER_URL}/view?id=${video.id}`)
    .then(r => r.json())
    .then(d => {
      if (viewEl) viewEl.textContent = `${d.views || 0} view`;
    });
}

// ================= RELATED =================
function renderRelated(videos, currentId) {
  const box = document.getElementById("related-videos");
  if (!box) return;

  box.innerHTML = "";

  videos
    .filter(v => String(v.id) !== String(currentId))
    .slice(0, 12)
    .forEach(v => {
      const a = document.createElement("a");
      a.href = `/watch/${v.id}`;
      a.className = "related-card";
      a.innerHTML = `
        <div class="thumb">
          <img src="${v.thumb}" loading="lazy">
        </div>
        <div class="info">
          <div class="title">${v.title || ""}</div>
        </div>
      `;
      box.appendChild(a);
    });
}

// ================= NOT FOUND =================
function showNotFound() {
  document.body.innerHTML = `
    <div style="color:white;text-align:center;padding:40px">
      <h2>Video không tồn tại</h2>
      <a href="/" style="color:#c084fc">← Quay về trang chủ</a>
    </div>
  `;
}
