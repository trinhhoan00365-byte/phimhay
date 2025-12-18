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

/* ===== FORMAT VIEW ===== */
function formatView(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

/* ===== LOAD VIDEO LIST ===== */
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    initWatch();
  })
  .catch(() => showContent());

/* ===== INIT WATCH ===== */
function initWatch() {
  const video = videos.find(v => v.id === id);
  if (!video) {
    titleEl.textContent = "Video không tồn tại";
    showContent();
    return;
  }

  titleEl.textContent = video.title;
  durationEl.textContent = video.duration ? "⏱ " + video.duration : "";

  /* VIEW */
  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " view";
    });

  /* PLAYER */
  player.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
      style="background-image:url('${video.thumb}')">
      <div class="play-btn"></div>
    </div>
    <iframe
      class="player-iframe"
      src=""
      allowfullscreen
      webkitallowfullscreen
      mozallowfullscreen
    ></iframe>
  `;

  const overlay = document.getElementById("playerOverlay");
  const iframe = player.querySelector("iframe");

  let click = 0;
  let viewed = false;

  /* ===== iOS FULLSCREEN BUTTON (FIXED) ===== */
  if (iosBtn) {
    if (isIOS) {
      iosBtn.style.display = "inline-block";
      iosBtn.textContent = "⤢ Xem toàn màn hình";
      iosBtn.onclick = () => {
        if (!viewed) {
          viewed = true;
          fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
        }
        // ✅ CÁCH DUY NHẤT IOS CHO PHÉP
        location.href = video.embed;
      };
    } else {
      iosBtn.style.display = "none";
    }
  }

  /* PLAY OVERLAY */
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

  /* DOWNLOAD */
  if (video.download) {
    downloadBtn.href = video.download;
  } else {
    downloadBtn.style.display = "none";
  }

  /* RELATED */
  relatedGrid.innerHTML = "";
  videos.filter(v => v.id !== id).forEach(v => {
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
    card.onclick = () => location.href = `watch.html?id=${v.id}`;
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

/* ===== SHOW CONTENT ===== */
function showContent() {
  if (loadingEl) loadingEl.style.display = "none";
  if (containerEl) containerEl.classList.remove("hidden");
  const cover = document.getElementById("page-cover");
  if (cover) cover.classList.add("hide");
}
