const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";
const WORKER_URL = "https://go.avboy.top";

// ================= GET KEY (SLUG HOẶC ID) =================
const params = new URLSearchParams(location.search);
const key = params.get("key") || params.get("id");

// ================= DOM =================
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

// ================= HELPERS =================
function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

// ================= FETCH VIDEOS =================
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    initWatch();
  });

// ================= INIT =================
function initWatch() {
  const video = videos.find(v =>
    v.slug === key || String(v.id) === String(key)
  );

  if (!video) {
    titleEl.textContent = "Video không tồn tại";
    showContent();
    return;
  }

  titleEl.textContent = video.title;
  durationEl.textContent = "⏱ " + (video.duration || "");

  // ===== VIEW COUNT =====
  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " view";
    });

  // ===== PLAYER =====
  player.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
      style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
    </div>
    <iframe class="player-iframe" allowfullscreen></iframe>
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

  // ===== DOWNLOAD =====
  if (video.download) {
    downloadBtn.href = video.download;
    downloadBtn.style.display = "inline-block";
  } else {
    downloadBtn.style.display = "none";
  }

  // ===== RELATED =====
  relatedGrid.innerHTML = "";

  videos
    .filter(v => v.id !== video.id)
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

      card.onclick = () => {
        location.href = "/video/" + v.slug;
      };

      relatedGrid.appendChild(card);

      fetch(WORKER_URL + "/view?id=" + v.id)
        .then(r => r.json())
        .then(d => {
          const el = document.getElementById("rv-" + v.id);
          if (el) el.textContent = formatView(d.views) + " view";
        });
    });

  showContent();
}

// ================= SHOW =================
function showContent() {
  if (loadingEl) loadingEl.style.display = "none";
  if (containerEl) containerEl.classList.remove("hidden");

  const cover = document.getElementById("page-cover");
  if (cover) cover.classList.add("hide");
}
