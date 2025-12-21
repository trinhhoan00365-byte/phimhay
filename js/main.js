const WORKER_URL = "https://go.avboy.top";

let allVideos = [];
let currentPage = 1;
const PER_PAGE = 20;

// ================= FETCH VIDEOS =================
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    allVideos = Array.isArray(data) ? data : [];
    render();
  })
  .catch(err => {
    console.error("Fetch videos error:", err);
  });

// ================= RENDER =================
function render() {
  const params = new URLSearchParams(location.search);
  currentPage = Number(params.get("page") || 1);

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const videos = allVideos.slice(start, end);

  renderCards(videos);
  renderPagination();
}

// ================= RENDER CARDS =================
function renderCards(videos) {
  const grid = document.getElementById("video-grid");
  if (!grid) return;

  grid.innerHTML = "";

  videos.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}" alt="${v.title}">
        <span class="duration">${v.duration || ""}</span>
      </div>
      <h3 class="title">${v.title}</h3>
      <div class="views" id="view-${v.id}">0 view</div>
    `;

    // ====== CHỖ SỬA QUAN TRỌNG: DÙNG SLUG ======
    card.onclick = () => {
      if (v.slug) {
        location.href = `/video/${v.slug}`;
      } else {
        // fallback cho video cũ chưa có slug
        location.href = `watch.html?id=${v.id}`;
      }
    };

    grid.appendChild(card);

    // fetch view
    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("view-" + v.id);
        if (el) el.textContent = formatView(d.views) + " view";
      })
      .catch(() => {});
  });
}

// ================= PAGINATION =================
function renderPagination() {
  const totalPage = Math.ceil(allVideos.length / PER_PAGE);
  const box = document.getElementById("pagination");
  if (!box) return;

  box.innerHTML = "";

  for (let i = 1; i <= totalPage; i++) {
    const btn = document.createElement("a");
    btn.href = `/page/${i}`;
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    box.appendChild(btn);
  }
}

// ================= SEARCH =================
const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = allVideos.filter(v =>
      v.title.toLowerCase().includes(q)
    );
    renderCards(filtered.slice(0, PER_PAGE));
  });
}

// ================= HELPERS =================
function formatView(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}
