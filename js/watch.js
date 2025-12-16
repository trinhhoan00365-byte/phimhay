const AFF_LINK = "https://go.natzus.click";
const WORKER_URL = "https://traingonn.trinhhoan00365.workers.dev";

const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

const viewsEl = document.getElementById("views");
const durationEl = document.getElementById("duration");
const iframe = document.getElementById("player");
const overlay = document.getElementById("playerOverlay");
const related = document.getElementById("related");
const wrapper = document.querySelector(".player-wrapper");
const downloadBtn = document.getElementById("downloadBtn");

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
    videos = data;
    initWatch();
  });

function initWatch() {
  const video = videos.find(v => v.id === id);

  if (!video) {
    document.getElementById("title").textContent = "Video không tồn tại";
    return;
  }

  document.getElementById("title").textContent = video.title;
  durationEl.textContent = "⏱ " + video.duration;

  // lấy view hiện tại
  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = "👁 " + formatView(d.views) + " view";
    });

  wrapper.style.backgroundImage = `url(${video.thumb})`;
  iframe.src = "";

  // ===== PLAY LOGIC (2 CLICK AFF) =====
  let playClick = 0;
  let viewed = false;

  overlay.onclick = () => {
    playClick++;

    // mỗi click đều mở AFF
    window.open(AFF_LINK, "_blank");

    // click lần 2 mới cho chạy video
    if (playClick === 2) {

      // tăng view đúng 1 lần
      if (!viewed) {
        viewed = true;
        fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1")
          .catch(() => {});
      }

      iframe.src = video.embed;
      overlay.style.display = "none";
      wrapper.style.backgroundImage = "none";
    }
  };

  // DOWNLOAD
  if (video.download) {
    downloadBtn.href = video.download;
  } else {
    downloadBtn.style.display = "none";
  }

  // ===== VIDEO KHÁC =====
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
    related.appendChild(card);

    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("related-view-" + v.id);
        if (el) el.textContent = "👁 " + formatView(d.views) + " view";
      });
  });
}
