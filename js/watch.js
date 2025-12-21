const API_BASE = "https://avboy.top"; // nếu API videos ở domain khác thì đổi

/* ===============================
   LẤY SLUG TỪ URL
   /video/abcd-xyz  ->  abcd-xyz
   =============================== */
const pathParts = location.pathname.split("/").filter(Boolean);
const key = pathParts[pathParts.length - 1];

/* ===============================
   ELEMENTS
   =============================== */
const playerBox = document.getElementById("player-box");
const titleEl = document.getElementById("video-title");
const viewEl = document.getElementById("video-view");
const downloadBtn = document.getElementById("download-btn");
const relatedBox = document.getElementById("related-videos");

/* ===============================
   LOAD VIDEO
   =============================== */
loadVideo();

async function loadVideo() {
  try {
    const res = await fetch(API_BASE + "/videos");
    const videos = await res.json();

    if (!Array.isArray(videos)) {
      showNotFound();
      return;
    }

    const video = videos.find(v =>
      v.slug === key || String(v.id) === String(key)
    );

    if (!video) {
      showNotFound();
      return;
    }

    renderVideo(video);
    loadViews(video.id);
    renderRelated(videos, video.id);

  } catch (err) {
    console.error(err);
    showNotFound();
  }
}

/* ===============================
   RENDER VIDEO
   =============================== */
function renderVideo(video) {
  titleEl.textContent = video.title || "Video";

  // iframe / embed
  playerBox.innerHTML = `
    <div class="video-wrapper">
      ${video.embed}
    </div>
  `;

  // download
  if (video.download) {
    downloadBtn.href = video.download;
    downloadBtn.style.display = "inline-flex";
  } else {
    downloadBtn.style.display = "none";
  }
}

/* ===============================
   VIEW COUNT
   =============================== */
async function loadViews(id) {
  try {
    const res = await fetch(`${API_BASE}/view?id=${id}&inc=1`);
    const data = await res.json();
    viewEl.textContent = (data.views || 0) + " view";
  } catch {
    viewEl.textContent = "0 view";
  }
}

/* ===============================
   RELATED VIDEOS
   =============================== */
function renderRelated(videos, currentId) {
  const list = videos
    .filter(v => v.id !== currentId)
    .slice(0, 12);

  relatedBox.innerHTML = list.map(v => `
    <a class="related-card" href="/video/${v.slug || v.id}">
      <div class="thumb">
        <img src="${v.thumb}" alt="">
        <span class="duration">${v.duration || ""}</span>
      </div>
      <div class="info">
        <div class="title">${v.title}</div>
        <div class="view">${formatView(v.views || 0)}</div>
      </div>
    </a>
  `).join("");
}

/* ===============================
   HELPERS
   =============================== */
function showNotFound() {
  titleEl.textContent = "Video không tồn tại";
  playerBox.innerHTML = "";
  viewEl.textContent = "0 view";
  downloadBtn.style.display = "none";
  relatedBox.innerHTML = "";
}

function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n;
}
