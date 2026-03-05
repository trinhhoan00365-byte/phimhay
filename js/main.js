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

    const params = new URLSearchParams(location.search);
    const tagFilter = params.get("tag");
    const tagTitle = document.getElementById("tag-title");

    if (tagFilter) {
      videos = videos.filter(v =>
        v.tags && v.tags.includes(tagFilter)
      );

      document.title = tagFilter + " videos | avboy.top";

      if (tagTitle) {
        tagTitle.textContent = tagFilter.toUpperCase() + " Videos";
        tagTitle.style.display = "block";
      }
    } else {
      if (tagTitle) {
        tagTitle.style.display = "none";
      }
    }

    filtered = [...videos]; // 🔥 QUAN TRỌNG: phải đặt sau filter

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

// RENDER REAL CONTENT (🔥 HOT VERSION)
function renderContent(){
  grid.innerHTML = "";

  const sorted = applyFilter(filtered);
  const start = (currentPage - 1) * perPage;
  const pageVideos = sorted.slice(start, start + perPage);

  pageVideos.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    // 
    const isHot = (v.views || 0) >= 20000;
    const hotBadge = isHot ? `<span class="hot-badge">🔥 HOT</span>` : "";

    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${v.thumb}">
        ${hotBadge}
        <span class="duration">${v.duration || ""}</span>
      </div>
      <h3>${v.title}</h3>
      <div class="card-views" id="view-${v.id}">0 views</div>
    `;

    card.onclick = () => {
       sessionStorage.setItem("fromInternal", "yes");
       location.href = `/watch/${v.id}`;
    };

    grid.appendChild(card);

    // Fetch view
    fetch(WORKER_URL + "/view?id=" + v.id)
      .then(r => r.json())
      .then(d => {
        v.views = d.views; // 

        const el = document.getElementById("view-" + v.id);
        if(el){
          el.textContent = formatView(d.views) + " views";
        }

        // 
        if(d.views >= 20000){
          const wrap = card.querySelector(".thumb-wrap");
          if(wrap && !wrap.querySelector(".hot-badge")){
            wrap.insertAdjacentHTML(
              "afterbegin",
              `<span class="hot-badge">🔥 HOT</span>`
            );
          }
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
/* =========================
   AGE GATE PRO
   ========================= */

function initAgeGate(){
  const gate = document.getElementById("ageGate");
  const enterBtn = document.getElementById("ageEnter");

  if(!gate) return;

  
  gate.classList.add("active");
  document.body.style.overflow = "hidden";

  enterBtn.onclick = () => {

  //
  window.open("https://relinkzz.pages.dev", "_blank");

  // 
  gate.classList.remove("active");
  document.body.style.overflow = "";
};
}

// Thêm vào cuối watch.js
// ... (các code khác ở trên vẫn giữ nguyên)

// Thay phần tags cũ bằng đoạn này
document.addEventListener("DOMContentLoaded", () => {
  const tagBtn = document.querySelector(".tag-btn");
  const tagPopup = document.getElementById("tag-popup");
  const tagClose = document.getElementById("tag-close");
  const tagList = document.getElementById("tag-list");

  if (!tagBtn) {
    console.warn("Tag button not found in index.html");
    return;
  }

  tagBtn.addEventListener("click", async () => {
    console.log("Tags button clicked in index.html"); // để debug

    tagPopup.classList.add("active");

    try {
      const res = await fetch(WORKER_URL + "/videos");
      const videos = await res.json();

      const set = new Set();
      videos.forEach(v => {
        if (v.tags && Array.isArray(v.tags)) {  // thêm check Array.isArray để an toàn
          v.tags.forEach(t => set.add(t));
        }
      });

      const tags = [...set].sort();
      tagList.innerHTML = tags.length > 0
        ? tags.map(tag =>
            `<a class="tag-item" href="/?tag=${encodeURIComponent(tag)}">${tag}</a>`
          ).join("")
        : "Chưa có tag nào trong video";

    } catch (e) {
      console.error("Lỗi fetch tags:", e);
      tagList.innerHTML = "Không tải được tags (kiểm tra console)";
    }
  });

  tagClose.addEventListener("click", () => {
    tagPopup.classList.remove("active");
  });
});

// ... (nếu có code khác ở dưới thì giữ nguyên)
