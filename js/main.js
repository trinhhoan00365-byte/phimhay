const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

const perPage = 20;
let currentPage = 1;
let isLoading = false;

let filterView = "view_desc";
let filterTime = "all";

let videos = [];
let filtered = [];

const WORKER_URL = "https://go.avboy.top";

/* =========================
   GET PAGE FROM URL
   ========================= */
const urlParams = new URLSearchParams(window.location.search);
const pageParam = parseInt(urlParams.get("page"));
if (!isNaN(pageParam) && pageParam > 0) {
  currentPage = pageParam;
}

// FORMAT VIEW
function formatView(n){
  if(n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if(n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n;
}

// LOAD VIDEO LIST
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(data => {
    videos = data;
    filtered = [...videos];
    render();
  });

// APPLY FILTER
function applyFilter(list){
  let result = [...list];

  if(filterView === "view_desc"){
    result.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
  if(filterView === "view_asc"){
    result.sort((a, b) => (a.views || 0) - (b.views || 0));
  }

  return result;
}

// MAIN RENDER (WITH LOADING EFFECT)
function render(){
  if(isLoading) return;
  isLoading = true;

  grid.classList.add("fade-out");

  setTimeout(() => {
    grid.innerHTML = "";

    // skeleton loading
    for(let i = 0; i < perPage; i++){
      const sk = document.createElement("div");
      sk.className = "skeleton";
      grid.appendChild(sk);
    }

    grid.classList.remove("fade-out");
    grid.classList.add("fade-in");

    setTimeout(renderContent, 180);
  }, 150);
}

// RENDER REAL CONTENT
function renderContent(){
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
        if(el){
          el.textContent = formatView(d.views) + " view";
        }
      })
      .catch(() => {});
  });

  renderPagination(sorted.length);
  isLoading = false;
}

// PAGINATION (UPDATE URL)
function renderPagination(total){
  pagination.innerHTML = "";
  const pages = Math.ceil(total / perPage);

  for(let i = 1; i <= pages; i++){
    const btn = document.createElement("button");
    btn.textContent = i;

    if(i === currentPage){
      btn.classList.add("active");
    }

    btn.onclick = () => {
      if(i === currentPage || isLoading) return;

      currentPage = i;

      // update URL without reload
      const url = new URL(window.location);
      url.searchParams.set("page", i);
      window.history.pushState({}, "", url);

      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
    };

    pagination.appendChild(btn);
  }
}

/* =========================
   HANDLE BACK / FORWARD
   ========================= */
window.onpopstate = () => {
  const p = parseInt(new URLSearchParams(location.search).get("page"));
  currentPage = !isNaN(p) && p > 0 ? p : 1;
  render();
};

// SEARCH
searchInput.oninput = () => {
  const key = searchInput.value.toLowerCase();
  filtered = videos.filter(v => v.title.toLowerCase().includes(key));
  currentPage = 1;

  const url = new URL(window.location);
  url.searchParams.delete("page");
  window.history.pushState({}, "", url);

  render();
};

// FILTER
document.getElementById("filterView").onchange = e => {
  filterView = e.target.value;
  currentPage = 1;
  render();
};

document.getElementById("filterTime").onchange = e => {
  filterTime = e.target.value;
  currentPage = 1;
  render();
};
