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

let videos = [];

// format view: 1.2K / 1.3M
function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

// LOAD VIDEOS
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data)) return;
    videos = data;
    initWatch();
  })
  .catch(err => console.error("Video load error:", err));

function initWatch() {
  const video = videos.find(v => v.id === id);

  if (!video) {
    titleEl.textContent = "Video không tồn tại";
    return;
  }

  // TITLE + DURATION
  titleEl.textContent = video.title;
  durationEl.textContent = "⏱ " + video.duration;

  // VIEW
  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = " " + formatView(d.views) + " view";
    });

  // PLAYER OVERLAY (2 CLICK AFF)
  player.innerHTML = `
  <div
    class="player-overlay"
    id="playerOverlay"
    style="
      background-image: url('${video.thumb}');
      background-size: cover;
      background-position: center;
    "
  >
    ▶
  </div>
  <iframe src="" allowfullscreen></iframe>
`;

  const iframe = player.querySelector("iframe");
  const overlay = document.getElementById("playerOverlay");

  let playClick = 0;
  let viewed = false;

  overlay.onclick = () => {
    playClick++;
    window.open(AFF_LINK, "_blank");

    if (playClick === 2) {
      if (!viewed) {
        viewed = true;
        fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
      }
      iframe.src = video.embed;
      overlay.style.display = "none";
    }
  };

  // DOWNLOAD
  if (video.download) {
    downloadBtn.href = video.download;
  } else {
    downloadBtn.style.display = "none";
  }

  // RELATED VIDEOS
  relatedGrid.innerHTML = "";

  videos.filter(v => v.id !== id).forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}">
        <span class="duration">${v.duration}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="related-views" id="related-view-${v.id}">👁 0 view</div>
    `;

    card.onclick = () => location.href = `watch.html?id=${v.id}`;
    relatedGrid.appendChild(card);

    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("related-view-" + v.id);
        if (el) el.textContent = " " + formatView(d.views) + " view";
      });
  });
}
