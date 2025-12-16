const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

const perPage = 10;
let currentPage = 1;
let filtered = [...videos];

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
    `;
    card.onclick = () => location.href = `watch.html?id=${v.id}`;
    grid.appendChild(card);
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

render();
