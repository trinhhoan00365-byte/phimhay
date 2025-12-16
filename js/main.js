const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

const perPage = 14;
let currentPage = 1;
let currentFilter = "new";

let videos = [];
let filtered = [];

const WORKER_URL = "https://traingonn.trinhhoan00365.workers.dev";
const HOT_VIEW = 100;

// format view: 1.2K / 1.3M
function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

// ===== INIT FILTER BUTTON (SAFE) =====
function initFilter() {
  const buttons = document.querySelectorAll(".filter-btn");
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.onclick = () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      render();
    };
  });
}

// ===== LOAD VIDEO =====
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(data => {
    videos = data;
    filtered = [...videos];
    initFilter();
    render();
  });

// ===== SORT =====
function applyFilter(list) {
  if (currentFilter === "new") {
    return [...list].sort((a, b) => b.id - a.id);
  }
  if (currentFilter === "view") {
    return [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
  }
  return list;
}

// ===== RENDER =====
function render() {
  grid.innerHTML = "";

  const sorted = applyFilter(filtered);
  const start = (currentPage - 1) * perPage;
  const pageVideos = sorted.slice(start, start + perPage);

  pageVideos.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}">
        <span class="duration">${v.duration}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="card-views" id="view-${v.id}"> 0 view</div>
    `;

    card.onclick = () => location.href = `watch.html?id=${v.id}`;
    grid.appendChild(card);

    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        v.views = d.views;

        const el = document.getElementById("view-" + v.id);
        if (el) el.textContent = " " + formatView(d.views) + " view";

        if (d.views >= HOT_VIEW) {
          const wrap = card.querySelector(".thumb-wrap");
          if (!wrap.querySelector(".hot-badge")) {
            const hot = document.createElement("div");
            hot.className = "hot-badge";
            hot.textContent = "🔥 HOT";
            wrap.appendChild(hot);
          }
        }
      });
  });

  renderPagination(sorted.length);
}

// ===== PAGINATION =====
function renderPagination(totalItems) {
  pagination.innerHTML = "";
  const total = Math.ceil(totalItems / perPage);

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      render();
    };
    pagination.appendChild(btn);
  }
}

// ===== SEARCH =====
searchInput.oninput = () => {
  const key = searchInput.value.toLowerCase();
  filtered = videos.filter(v => v.title.toLowerCase().includes(key));
  currentPage = 1;
  render();
};
