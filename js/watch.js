const AFF_LINK = "https://go.natzus.click";
const WORKER_URL = "https://traingonn.trinhhoan00365.workers.dev";

const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

const player = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewsEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const relatedGrid = document.getElementById("related-grid");
const downloadBtn = document.getElementById("download-btn");
const iosBtn = document.getElementById("iosFullscreenBtn");

const loadingEl = document.getElementById("watch-loading");
const containerEl = document.getElementById("watch-container");

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
let videos = [];

/* ===== SHOW IOS FULLSCREEN BUTTON EARLY ===== */
if (iosBtn && isIOS) {
  iosBtn.style.display = "flex";
}

/* ===== FORMAT VIEW ===== */
function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

/* ===== LOAD VIDEOS ===== */
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    initWatch();
  })
  .catch(() => showContent());

/* ===== INIT ===== */
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
    .then(d => viewsEl.textContent = formatView(d.views) + " view");

  player.insertAdjacentHTML("beforeend", `
    <div class="player-overlay" id="playerOverlay" style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
    </div>
    <iframe class="player-iframe" src="" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>
  `);

  const overlay = document.getElementById("playerOverlay");
  const iframe = player.querySelector("iframe");

  let click = 0;
  let viewed = false;

  /* iOS fullscreen click */
  if (iosBtn && isIOS) {
    iosBtn.onclick = (e) => {
      e.stopPropagation();
      if (!viewed) {
        viewed = true;
        fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
      }
      window.open(video.embed, "_blank");
    };
  }

  /* Play overlay */
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
    }
  };

  if (video.download) {
    downloadBtn.href = video.download;
  } else {
    downloadBtn.style.display = "none";
  }

  relatedGrid.innerHTML = "";
  videos.filter(v => v.id !== id).forEach(v => {
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}">
        <span class="duration">${v.duration || ""}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="related-views" id="rv-${v.id}">0 view</div>
    `;
    c.onclick = () => location.href = `watch.html?id=${v.id}`;
    relatedGrid.appendChild(c);

    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("rv-" + v.id);
        if (el) el.textContent = formatView(d.views) + " view";
      });
  });

  showContent();
}

/* ===== SHOW CONTENT ===== */
function showContent() {
  if (loadingEl) loadingEl.style.display = "none";
  if (containerEl) containerEl.classList.remove("hidden");
  const cover = document.getElementById("page-cover");
  if (cover) cover.classList.add("hide");
}
