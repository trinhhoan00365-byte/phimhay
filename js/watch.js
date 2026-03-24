const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";
const AFF_ENABLED = false; 
const WORKER_URL = "https://go.avboy.top";

/* =========================
   
   ========================= */
let id = null;

//
const pathMatch = location.pathname.match(/^\/watch\/(\d+)$/);
if (pathMatch) {
  id = Number(pathMatch[1]);
}

// 
if (!id) {
  const params = new URLSearchParams(location.search);
  const qid = params.get("id");
  if (qid) {
    id = Number(qid);
    history.replaceState(null, "", `/watch/${qid}`);
  }
}

if (!id) {
  console.error("❌ Missing video ID");
}

/* =========================
   
   ========================= */
const player = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewsEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const relatedGrid = document.getElementById("related-grid");
const downloadBtn = document.getElementById("download-btn");
const tagBox = document.getElementById("video-tags");

const loadingEl = document.getElementById("watch-loading");
const containerEl = document.getElementById("watch-container");

/* =========================
   
   ========================= */
function hidePageCover() {
  const cover = document.getElementById("page-cover");
  if (cover && !cover.classList.contains("hide")) {
    cover.classList.add("hide");
  }
}

let videos = [];

function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

/* =========================
   LOAD VIDEOS
   ========================= */
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    initWatch();
  });

function initWatch() {
  const video = videos.find(v => v.id === id);

  if (!video) {
    titleEl.textContent = "Video Not Found";
    hidePageCover();
    return;
  }

  
  hidePageCover();

  titleEl.textContent = video.title;
   if(video.tags && tagBox){
  tagBox.innerHTML = video.tags.map(tag =>
    `<a href="/tag/${encodeURIComponent(tag)}" class="tag">${tag}</a>`
  ).join("");
};
  durationEl.textContent = "Duration: " + (video.duration || "");

  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " views";
    });

  /* =========================
     
     ========================= */
  /* ==================== CUSTOM PLAYER ==================== */
player.innerHTML = `
  <div class="player-overlay" id="playerOverlay" 
       style="background-image: url('${video.thumb}')">
    <div class="play-btn"></div>
  </div>

  <video id="nativeVideo" class="player-video" preload="metadata" playsinline controlsList="nodownload"></video>

  <!-- Controls Bar -->
  <div class="controls-bar" id="controlsBar">
    <div class="progress-container" id="progressContainer">
      <div class="progress-bar" id="progressBar"></div>
    </div>
    
    <div class="controls-bottom">
      <div class="left-controls">
        <button class="control-btn" id="playPauseBtn">▶</button>
        <span class="time-display" id="timeDisplay">0:00 / 0:00</span>
      </div>
      
      <div class="right-controls">
        <button class="control-btn" id="volumeBtn">🔊</button>
        <button class="control-btn" id="pipBtn">⛶</button>
        <button class="control-btn" id="fullscreenBtn">⤢</button>
      </div>
    </div>
  </div>
`;

const overlay = document.getElementById("playerOverlay");
const videoEl = document.getElementById("nativeVideo");
const controlsBar = document.getElementById("controlsBar");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const playPauseBtn = document.getElementById("playPauseBtn");
const timeDisplay = document.getElementById("timeDisplay");
const fullscreenBtn = document.getElementById("fullscreenBtn");

// Load video source
videoEl.src = video.video || video.embed;

// Click overlay để play
overlay.onclick = () => {
  if (AFF_ENABLED) window.open(AFF_LINK, "_blank");

  videoEl.play().catch(() => {});
  overlay.style.opacity = "0";
  setTimeout(() => overlay.style.display = "none", 400);

  // Tăng view
  if (!viewed) {
    viewed = true;
    fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
  }
};

// Video controls logic
videoEl.onplay = () => {
  playPauseBtn.textContent = "❚❚";
  document.querySelector(".player-wrapper").classList.add("playing");
};

videoEl.onpause = () => {
  playPauseBtn.textContent = "▶";
};

videoEl.ontimeupdate = () => {
  const percent = (videoEl.currentTime / videoEl.duration) * 100 || 0;
  progressBar.style.width = percent + "%";

  const cur = formatTime(videoEl.currentTime);
  const dur = formatTime(videoEl.duration || 0);
  timeDisplay.textContent = `${cur} / ${dur}`;
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Progress click
progressContainer.onclick = (e) => {
  const rect = progressContainer.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  videoEl.currentTime = pos * videoEl.duration;
};

// Play/Pause button
playPauseBtn.onclick = () => {
  if (videoEl.paused) videoEl.play();
  else videoEl.pause();
};

// Fullscreen
fullscreenBtn.onclick = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    player.requestFullscreen();
  }
};

// Double click to fullscreen
player.ondblclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else player.requestFullscreen();
};
  /* =========================
   
     ========================= */
  let downloadClick = 0;
  let resetTimer = null;
  let lastClickTime = 0;

  if (video.download) {
    downloadBtn.onclick = (e) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastClickTime < 800) return;
      lastClickTime = now;

      downloadClick++;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        downloadClick = 0;
        downloadBtn.textContent = "Download";
        downloadBtn.style.opacity = "1";
      }, 15000);

      if (downloadClick === 1) {
        window.open(AFF_LINK, "_blank");
        downloadBtn.textContent = "Click again to download";
        downloadBtn.style.opacity = "0.9";
        return;
      }

      if (downloadClick === 2) {
        window.open(AFF_LINK, "_blank");
        downloadBtn.textContent = "Download now";
        downloadBtn.style.opacity = "1";
        return;
      }

      if (downloadClick === 3) {
        const url =
          WORKER_URL +
          "/download?url=" +
          encodeURIComponent(video.download);

        window.location.href = url;

        downloadClick = 0;
        clearTimeout(resetTimer);
        downloadBtn.textContent = "Download";
        downloadBtn.style.opacity = "1";
      }
    };
  } else {
    downloadBtn.style.display = "none";
  }

  /* =========================
     
     ========================= */
  relatedGrid.innerHTML = "";


let relatedVideos = videos
  .filter(v => v.id !== id)
  .map(v => {

    let score = 0;

    if (video.tags && v.tags) {

      const match = v.tags.filter(tag =>
        video.tags.includes(tag)
      ).length;

      score = match * 10;
    }

    return {
      ...v,
      score
    };
  });


relatedVideos.sort((a, b) => {

  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return (b.views || 0) - (a.views || 0);
});


relatedVideos.slice(0, 20).forEach(v => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="thumb-wrap">
          <img class="thumb" src="${v.thumb}">
          <span class="duration">${v.duration || ""}</span>
        </div>
        <h3>${v.title}</h3>
        <div class="related-views" id="rv-${v.id}">0 views</div>
      `;

      card.onclick = () => {
  sessionStorage.setItem("fromInternal", "yes");
  location.href = `/watch/${v.id}`;
};
      relatedGrid.appendChild(card);

      fetch(WORKER_URL + "/view?id=" + v.id)
        .then(r => r.json())
        .then(d => {
          const el = document.getElementById("rv-" + v.id);
          if (el) el.textContent = formatView(d.views) + " views";
        })
        .catch(() => {});
    });

  // 
  if (typeof showContent === "function") {
    showContent();
  }
}
//
   function initAgeGate(){
  const gate = document.getElementById("ageGate");
  const enterBtn = document.getElementById("ageEnter");

  if(!gate) return;

  const fromInternal = sessionStorage.getItem("fromInternal");

  // 
  if(!fromInternal){
    gate.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // 
  sessionStorage.removeItem("fromInternal");

  enterBtn.onclick = () => {

  // 
  window.open("https://broadlyjukeboxunrevised.com/2058173", "_blank");

  // 
  gate.classList.remove("active");
  document.body.style.overflow = "";
};
}

document.addEventListener("DOMContentLoaded", initAgeGate);
// Thêm vào cuối watch.js
document.addEventListener("DOMContentLoaded", () => {
  const tagBtn = document.querySelector(".tag-btn");
  const tagPopup = document.getElementById("tag-popup");
  const tagClose = document.getElementById("tag-close");
  const tagList = document.getElementById("tag-list");

  if (!tagBtn) return;

  tagBtn.addEventListener("click", async () => {
    tagPopup.classList.add("active");

    try {
      const res = await fetch(WORKER_URL + "/videos");
      const videos = await res.json();

      const set = new Set();
      videos.forEach(v => {
        if (v.tags) {
          v.tags.forEach(t => set.add(t));
        }
      });

      const tags = [...set].sort();
      tagList.innerHTML = tags.map(tag =>
        `<a class="tag-item" href="/?tag=${encodeURIComponent(tag)}">${tag}</a>`
      ).join("");
    } catch (e) {
      tagList.innerHTML = "Cannot load tags";
    }
  });

  tagClose.addEventListener("click", () => {
    tagPopup.classList.remove("active");
  });
});
