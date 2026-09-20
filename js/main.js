const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

const perPage = 20;
let currentPage = 1;
let isLoading = false;

let filterView = "view_desc";


let videos = [];
let filtered = [];

const WORKER_URL = "https://go.avboy.top";

/* =========================
   
   ========================= */
const urlParams = new URLSearchParams(window.location.search);
const pageParam = parseInt(urlParams.get("page"));

const isHotPage = urlParams.get("hot") === "1";

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
// LOAD VIDEO LIST
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(async data => {

    videos = Array.isArray(data) ? data : [];

    const params = new URLSearchParams(location.search);
    const tagFilter = params.get("tag");
    const hotFilter = params.get("hot") === "1";

    const tagTitle = document.getElementById("tag-title");
    const pageTitle = document.querySelector(".page-title");

    /* =========================
       LẤY VIEW THẬT
       ========================= */

    if (hotFilter) {

      // Lấy views hiện tại của tất cả video
      await Promise.all(
        videos.map(async v => {
          try {
            const res = await fetch(
              WORKER_URL + "/view?id=" + v.id
            );

            if (res.ok) {
              const d = await res.json();
              v.views = Number(d.views) || 0;
            } else {
              v.views = Number(v.views) || 0;
            }

          } catch (e) {
            v.views = Number(v.views) || 0;
          }
        })
      );

      // Chỉ lấy video >= 1000 views
      videos = videos.filter(v =>
        (Number(v.views) || 0) >= 1000
      );

      // Nhiều views nhất lên trước
      videos.sort((a, b) =>
        (Number(b.views) || 0) -
        (Number(a.views) || 0)
      );

      document.title = "Hots | avboy.top";

      if (pageTitle) {
        pageTitle.textContent = "🔥 Hots";
      }

      if (tagTitle) {
        tagTitle.style.display = "none";
      }

    }

    /* =========================
       TAG FILTER
       ========================= */

    else if (tagFilter) {

      videos = videos.filter(v =>
        Array.isArray(v.tags) &&
        v.tags.includes(tagFilter)
      );

      document.title =
        tagFilter + " videos | avboy.top";

      if (pageTitle) {
        pageTitle.textContent = "Gay Porn Videos";
      }

      if (tagTitle) {
        tagTitle.textContent =
          tagFilter.toUpperCase() + " Videos";

        tagTitle.style.display = "block";
      }

    }

    /* =========================
       NORMAL HOME
       ========================= */

    else {

      document.title = "avboy.top";

      if (pageTitle) {
        pageTitle.textContent = "Gay Porn Videos";
      }

      if (tagTitle) {
        tagTitle.style.display = "none";
      }

    }

    // Sau khi filter xong mới render
    filtered = [...videos];

    currentPage = 1;

    render();

  })
  .catch(err => {
    console.error("[main.js] Failed to load videos:", err);

    if (grid) {
      grid.innerHTML = `
        <div style="
          grid-column:1/-1;
          text-align:center;
          color:#aaa;
          padding:40px 20px;
        ">
          Cannot load videos
        </div>
      `;
    }
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
    const isHot = (v.views || 0) >= 1000;
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
       location.href = `/videos/${v.slug}-${v.id}`;
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
  const key = searchInput.value.toLowerCase().trim();

  filtered = videos.filter(v =>
    v.title.toLowerCase().includes(key)
  );

  currentPage = 1;

  const url = new URL(window.location);
  url.searchParams.delete("page");

  window.history.pushState({}, "", url);

  render();
};

/* =========================
   AGE GATE PRO
   ========================= */

function initAgeGate(){
  const gate = document.getElementById("ageGate");
  const enterBtn = document.getElementById("ageEnter");

  if(!gate) return;

  if(sessionStorage.getItem("ageOk")) return;

  gate.classList.add("active");
  document.body.style.overflow = "hidden";

  enterBtn.onclick = () => {

    sessionStorage.setItem("ageOk", "1");

    window.open("https://relinkzz.pages.dev", "_blank");

    gate.classList.remove("active");
    document.body.style.overflow = "";
  };
}
//
document.addEventListener("DOMContentLoaded", () => {
  console.log("[main.js] DOMContentLoaded fired – starting tag handler");

  const tagBtn   = document.querySelector(".tag-btn");
  const tagPopup = document.getElementById("tag-popup");
  const tagClose = document.getElementById("tag-close");
  const tagList  = document.getElementById("tag-list");

  console.log("[main.js] tagBtn found:", !!tagBtn);
  console.log("[main.js] tagPopup found:", !!tagPopup);

  if (!tagBtn || !tagPopup || !tagClose || !tagList) {
    console.warn("[main.js] ");
    return;
  }

  tagBtn.addEventListener("click", async () => {
    console.log("[main.js] !");

    tagPopup.classList.add("active");
    tagList.innerHTML = "Loading tags..."; // hiển thị ngay để biết popup mở

    try {
      const res = await fetch(WORKER_URL + "/videos");
      if (!res.ok) throw new Error("Fetch fail: " + res.status);

      const videos = await res.json();

      const set = new Set();
      videos.forEach(v => {
        if (v.tags && Array.isArray(v.tags)) {
          v.tags.forEach(t => set.add(t.trim()));
        }
      });

      const tags = [...set].sort((a, b) => a.localeCompare(b));

      tagList.innerHTML = tags.length > 0
        ? tags.map(tag => 
            `<a class="tag-item" href="/?tag=${encodeURIComponent(tag)}">${tag}</a>`
          ).join("")
        : "none";

    } catch (e) {
      console.error("[main.js]", e);
      tagList.innerHTML = "none";
    }
  });

  tagClose.addEventListener("click", () => {
    tagPopup.classList.remove("active");
  });

  console.log("[main.js] Tag handler");
});
document.addEventListener("DOMContentLoaded", initAgeGate);
