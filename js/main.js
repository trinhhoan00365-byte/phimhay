const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

if (!grid || !pagination || !searchInput) {
  console.error("Missing required DOM elements");
}

let perPage = 4; // mobile: 2 cột × 2 hàng
let currentPage = 1;
let isLoading = false;

let filterView = "view_desc";
let filterTime = "all";

let videos = [];
let filtered = [];

const WORKER_URL = "https://traingonn.trinhhoan00365.workers.dev";

/* =========================
   CALC PER PAGE
   ========================= */
function calcPerPage() {
  if (window.innerWidth >= 768) {
    perPage = 16; // PC: 4 cột × 4 hàng
  } else {
    perPage = 4; // mobile
  }
}

/* =========================
   GET PAGE FROM URL
   ========================= */
const urlParams = new URLSearchParams(window.location.search);
const pageParam = parseInt(urlParams.get("page"));
if (!isNaN(pageParam) && pageParam > 0) {
  currentPage = pageParam;
}

// FORMAT VIEW
function formatView(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

// LOAD VIDEO LIST
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(data => {
    videos = Array.isArray(data) ? data : [];
    filtered = [...videos];
    calcPerPage();
    render();
  })
  .catch(err => {
    console.error("Load video failed", err);
  });

// APPLY FILTER
function applyFilter(list) {
  let result = [...list];

  if (filterView === "view_desc") {
    result.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
  if (filterView === "view_asc") {
    result.sort((a, b) => (a.views || 0) - (b.views || 0));
  }

  return result;
}

// MAIN RENDER
function render() {
  if (isLoading || !grid) return;
  isLoading = true;

  grid.classList.add("fade-out");

  setTimeout(() => {
    grid.innerHTML = "";

    for (let i = 0; i < perPage; i++) {
      const sk = document.createElement("div");
      sk.className = "skeleton";
      grid.appendChild(sk);
    }

    grid.classList.remove("fade-out");
    grid.classList.add("fade-in");

    setTimeout(renderContent, 180);
  }, 150);
}

// RENDER CONTENT
function renderContent() {
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
        <span class="duration">${v.duration || ""}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="card-views" id="view-${v.id}">0 view</div>
    `;

    card.onclick = () => {
      location.href = `watch.html?id=${v.id}`;
    };

    grid.appendChild(card);

    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("view-" + v.id);
        if (el) el.textContent = formatView(d.views) + " view";
      });
  });

  renderPagination(sorted.length);
  isLoading = false;
}

// PAGINATION
function renderPagination(total) {
  if (!pagination) return;
  pagination.innerHTML = "";

  const pages = Math.ceil(total / perPage);
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");

    btn.onclick = () => {
      if (isLoading || i === currentPage) return;
      currentPage = i;

      const url = new URL(window.location);
      url.searchParams.set("page", i);
      window.history.pushState({}, "", url);

      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
    };

    pagination.appendChild(btn);
  }
}

// BACK / FORWARD
window.onpopstate = () => {
  const p = parseInt(new URLSearchParams(location.search).get("page"));
  currentPage = !isNaN(p) && p > 0 ? p : 1;
  render();
};

// SEARCH
if (searchInput) {
  searchInput.oninput = () => {
    const key = searchInput.value.toLowerCase();
    filtered = videos.filter(v => v.title.toLowerCase().includes(key));
    currentPage = 1;
    render();
  };
}

// FILTER SAFE
const filterViewEl = document.getElementById("filterView");
if (filterViewEl) {
  filterViewEl.onchange = e => {
    filterView = e.target.value;
    currentPage = 1;
    render();
  };
}

const filterTimeEl = document.getElementById("filterTime");
if (filterTimeEl) {
  filterTimeEl.onchange = e => {
    filterTime = e.target.value;
    currentPage = 1;
    render();
  };
}

// RESIZE
window.addEventListener("resize", () => {
  const old = perPage;
  calcPerPage();
  if (old !== perPage) {
    currentPage = 1;
    render();
  }
});
