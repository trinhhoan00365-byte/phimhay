const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

const perPage = 14;
let currentPage = 1;
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

// LOAD VIDEO FROM WORKER
fetch(WORKER_URL + "/videos")
  .then(res => res.json())
  .then(data => {
    videos = data;
    filtered = [...videos];
    render();
  });

function render() {
  grid.innerHTML = "";
  const start = (currentPage - 1) * perPage;
  const pageVideos = filtered.slice(start, start + perPage);

  pageVideos.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}">
        <span class="duration">${v.duration}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="card-views" id="view-${v.id}">0 view</div>
    `;

    card.onclick = () => location.href = `watch.html?id=${v.id}`;
    grid.appendChild(card);

    // LẤY VIEW
    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("view-" + v.id);
        if (el) el.textContent = " " + formatView(d.views) + " view";

        // HOT
        if (d.views >= HOT_VIEW) {
          const wrap = card.querySelector(".thumb-wrap");
          if (wrap && !wrap.querySelector(".hot-badge")) {
            const hot = document.createElement("div");
            hot.className = "hot-badge";
            hot.textContent = "🔥 HOT";
            wrap.appendChild(hot);
          }
        }
      });
  });

  renderPagination();
}

function renderPagination() {
  pagination.innerHTML = "";
  const total = Math.ceil(filtered.length / perPage);

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

searchInput.oninput = () => {
  const key = searchInput.value.toLowerCase();
  filtered = videos.filter(v => v.title.toLowerCase().includes(key));
  currentPage = 1;
  render();
};
