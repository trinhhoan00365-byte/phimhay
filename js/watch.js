const WORKER_URL = "https://go.avboy.top";
const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";

/* ===============================
   GET VIDEO ID (FIX)
   =============================== */
function getVideoInfo() {
  const qs = new URLSearchParams(location.search);
  const slug = qs.get("slug");

  if (slug) {
    const m = slug.match(/--(\d+)$/);
    if (m) return { id: m[1], slug };
  }

  const id = qs.get("id");
  if (id) return { id, slug: null };

  return null;
}

const info = getVideoInfo();

/* ===============================
   DOM
   =============================== */
const playerEl = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const downloadBtn = document.getElementById("download-btn");
const relatedGrid = document.getElementById("related-grid");

/* ===============================
   LOAD VIDEO
   =============================== */
if (!info) {
  showNotFound();
} else {
  fetch(`${WORKER_URL}/videos`)
    .then(r => r.json())
    .then(videos => {
      if (!Array.isArray(videos)) return showNotFound();

      const video = videos.find(v => String(v.id) === String(info.id));
      if (!video) return showNotFound();

      // đảm bảo slug luôn tồn tại
      video.slug = video.slug || `${slugify(video.title)}--${video.id}`;

      renderVideo(video);
      renderViews(video);
      renderRelated(videos, video.id);
    })
    .catch(showNotFound);
}

/* ===============================
   RENDER VIDEO
   =============================== */
function renderVideo(video) {
  titleEl.textContent = video.title || "Video";
  durationEl.textContent = video.duration || "";

  playerEl.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
      style="background-image:url('${video.thumb || ""}')">
      <div class="play-btn"></div>
    </div>
    <iframe
      class="player-iframe"
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
      iframe.src = video.embed || video.iframe || video.url || "";
      overlay.remove();

      if (!viewed) {
        viewed = true;
        fetch(`${WORKER_URL}/view?slug=${video.slug}&inc=1`).catch(() => {});
      }
    }
  };

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
function renderViews(video) {
  fetch(`${WORKER_URL}/view?slug=${video.slug}`)
    .then(r => r.json())
    .then(d => {
      viewEl.textContent = formatView(d.views) + " view";
    })
    .catch(() => {
      viewEl.textContent = "0 view";
    });
}

/* ===============================
   RELATED
   =============================== */
function renderRelated(videos, currentId) {
  relatedGrid.innerHTML = "";

  videos
    .filter(v => String(v.id) !== String(currentId))
    .slice(0, 12)
    .forEach(v => {
      const card = document.createElement("div");
      card.className = "card";

      const slug = v.slug || `${slugify(v.title)}--${v.id}`;

      card.innerHTML = `
        <div class="thumb-wrap">
          <img class="thumb" src="${v.thumb || ""}">
          <span class="duration">${v.duration || ""}</span>
        </div>
        <h3>${v.title}</h3>
        <div class="views" id="rv-${v.id}">0 view</div>
      `;

      card.onclick = () => {
        location.href = `/video/${slug}`;
      };

      relatedGrid.appendChild(card);

      fetch(`${WORKER_URL}/view?slug=${slug}`)
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
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

function slugify(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
