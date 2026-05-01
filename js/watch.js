const AFF_LINK = "https://broadlyjukeboxunrevised.com/2058173";
function canRedirectAff() {
  const today = new Date().toISOString().split('T')[0];

  let data = JSON.parse(localStorage.getItem('aff_limit')) || {
    date: today,
    count: 0
  };

  // reset nếu sang ngày mới
  if (data.date !== today) {
    data.date = today;
    data.count = 0;
  }

  if (data.count < 2) {
    data.count++;
    localStorage.setItem('aff_limit', JSON.stringify(data));
    return true;
  }

  return false;
}
const AFF_ENABLED = true; 
const WORKER_URL = "https://go.avboy.top";

let id = null;

// Lấy ID từ URL
const pathMatch = location.pathname.match(/^\/watch\/(\d+)$/);
if (pathMatch) {
  id = Number(pathMatch[1]);
}

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
   ELEMENTS
   ========================= */
const player = document.getElementById("player");
const titleEl = document.getElementById("video-title");
const viewsEl = document.getElementById("video-view");
const durationEl = document.getElementById("video-duration");
const relatedGrid = document.getElementById("related-grid");
const downloadBtn = document.getElementById("download-btn");
const tagBox = document.getElementById("video-tags");

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
  }

  durationEl.textContent = "Duration: " + (video.duration || "");

  fetch(WORKER_URL + "/view?id=" + video.id)
    .then(r => r.json())
    .then(d => {
      viewsEl.textContent = formatView(d.views) + " views";
    });

  /* =========================
     PLAYER - GIỐNG Y HỆT ẢNH
     ========================= */
  player.innerHTML = `
    <div class="player-overlay" id="playerOverlay"
         style="background-image:url('${video.thumb}')">

      <div class="play-btn">
  <div class="play-triangle"></div>
</div>

      <!-- Thanh progress + thời gian giống hệt ảnh -->
      <div class="youtube-controls">
        <div class="progress-wrapper">
          <div class="fake-progress-bar"></div>
        </div>
        <div class="time-display">
          00:00 / ${video.duration || "00:00"}
        </div>
      </div>

      <div class="click-hint" id="clickHint"></div>
    </div>

    <video
      id="nativeVideo"
      class="player-video"
      preload="metadata"
      playsinline
      webkit-playsinline
      controls
      controlsList="nodownload"
    ></video>
  `;

  const overlay = document.getElementById("playerOverlay");
  const videoEl = document.getElementById("nativeVideo");
  const hint = document.getElementById("clickHint");

  let click = 0;
  let viewed = false;
  const maxClick = 1;

  // Click để play video
  overlay.onclick = () => {
    click++;

    if (AFF_ENABLED) {
      window.open(AFF_LINK, "_blank");
    }

    if (hint) hint.textContent = ``;

    if (click >= maxClick) {
      if (!viewed) {
        viewed = true;
        fetch(WORKER_URL + "/view?id=" + video.id + "&inc=1").catch(() => {});
      }

      videoEl.src = video.video || video.embed;
      videoEl.play().catch(() => {});
      overlay.style.display = "none";
    }
  };

  /* =========================
     DOWNLOAD BUTTON
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
        const url = WORKER_URL + "/download?url=" + encodeURIComponent(video.download);
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
     RELATED VIDEOS
     ========================= */
  relatedGrid.innerHTML = "";

  let relatedVideos = videos
    .filter(v => v.id !== id)
    .map(v => {
      let score = 0;
      if (video.tags && v.tags) {
        const match = v.tags.filter(tag => video.tags.includes(tag)).length;
        score = match * 10;
      }
      return { ...v, score };
    });

  relatedVideos.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
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
      });
  });

  if (typeof showContent === "function") {
    showContent();
  }
}

/* =========================
   AGE GATE & TAG POPUP
   ========================= */
function initAgeGate(){
  const gate = document.getElementById("ageGate");
  const enterBtn = document.getElementById("ageEnter");

  if(!gate) return;

  const fromInternal = sessionStorage.getItem("fromInternal");

  if(!fromInternal){
    gate.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  sessionStorage.removeItem("fromInternal");

  enterBtn.onclick = () => {
    window.open("https://broadlyjukeboxunrevised.com/2058173", "_blank");
    gate.classList.remove("active");
    document.body.style.overflow = "";
  };
}

document.addEventListener("DOMContentLoaded", initAgeGate);

// Tag popup
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
      const videosData = await res.json();

      const set = new Set();
      videosData.forEach(v => {
        if (v.tags) v.tags.forEach(t => set.add(t));
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
