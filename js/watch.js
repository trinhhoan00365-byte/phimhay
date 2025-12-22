const WORKER_URL = "https://go.avboy.top"; // giữ nguyên domain worker của bạn
const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";

/* ===============================
   LẤY ID TỪ URL
   /video/slug--123456789
   =============================== */
const lastPart = location.pathname.split("/").filter(Boolean).pop();
const videoId = lastPart && lastPart.includes("--")
  ? lastPart.split("--").pop()
  : null;

/* ===============================
   DOM ELEMENTS
   =============================== */
const playerEl = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const downloadBtn = document.getElementById("download-btn");
const relatedGrid = document.getElementById("related-grid");

/* ===============================
   LOAD VIDEOS
   =============================== */
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(videos => {
    if (!videoId || !Array.isArray(videos)) {
      showNotFound();
      return;
    }

    const video = videos.find(v => String(v.id) === String(videoId));
    if (!video) {
      showNotFound();
      return;
    }

    renderVideo(video);
    renderViews(video.id);
    renderRelated(videos, video.id);
  })
  .catch(() => showNotFound());

/* ===============================
   RENDER VIDEO
   =============================== */
function renderVideo(video) {
  titleEl.textContent = video.title || "Video";
  durationEl.textContent = video.duration || "";

  playerEl.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
      style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
    </div>
    <iframe
      class="player-iframe"
      src=""
      allow="autoplay; fullscreen"
      allowfullscreen
    ></iframe>
  `;

  const overlay = document.getElementById("playerOverlay");
  const iframe = playerEl.querySelector("iframe");

  let clickCount = 0;
  let viewed = false;

  overlay.onclick = () => {
    clickCount++;
    window.open(AFF_LINK, "_blank");

    if (clickCount === 2) {
      iframe.src = video.embed;
      overlay.style.display = "none";

      if (!viewed) {
        viewed = true;
        fetch(`${WORKER_URL}/view?id=${video.id}&inc=1`).catch(() => {});
      }
    }
  };

  // download
  if (video.download) {
    downloadBtn.href = video.download;
    downloadBtn.style.display = "inline-block";
  } else {
    downloadBtn.style.display = "none";
  }
}

/* ===============================
   VIEW COUNT
   =============================== */
function renderViews(id) {
  fetch(`${WORKER_URL}/view?id=${id}`)
    .then(r => r.json())
    .then(d => {
      viewEl.textContent = formatView(d.views) + " view";
    })
    .catch(() => {
      viewEl.textContent = "0 view";
    });
}

/* ===============================
   RELATED VIDEOS
   =============================== */
function renderRelated(videos, currentId) {
  relatedGrid.innerHTML = "";

  videos
    .filter(v => v.id !== currentId)
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
        <div class="views" id="rv-${v.id}">0 view</div>
      `;

      card.onclick = () => {
        const slug = slugify(v.title);
        location.href = `/video/${slug}--${v.id}`;
      };

      relatedGrid.appendChild(card);

      fetch(`${WORKER_URL}/view?id=${v.id}`)
        .then(r => r.json())
        .then(d => {
          const el = document.getElementById("rv-" + v.id);
          if (el) el.textContent = formatView(d.views) + " view";
        });
    });
}

/* ===============================
   HELPERS
   =============================== */
function showNotFound() {
  titleEl.textContent = "Video không tồn tại";
  viewEl.textContent = "0 view";
  durationEl.textContent = "";
  playerEl.innerHTML = "";
  downloadBtn.style.display = "none";
  relatedGrid.innerHTML = "";
}

function formatView(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
