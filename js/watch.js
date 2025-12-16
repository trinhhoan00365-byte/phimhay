const AFF_LINK = "https://go.natzus.click";
const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

const iframe = document.getElementById("player");
const overlay = document.getElementById("playerOverlay");
const related = document.getElementById("related");
const wrapper = document.querySelector(".player-wrapper");

const video = videos.find(v => v.id === id);

if (!video) {
  document.getElementById("title").textContent = "Video không tồn tại";
} else {
  document.getElementById("title").textContent = video.title;

  // ⚠️ QUAN TRỌNG: iframe CHƯA có src
  iframe.src = "";

  // SET POSTER (THUMBNAIL)
  wrapper.style.backgroundImage = `url(${video.thumb})`;

  overlay.onclick = () => {
  // 1️⃣ Mở tab affiliate (KHÔNG BỊ BLOCK)
  window.open(AFF_LINK, "_blank");

  // 2️⃣ Chạy video
  iframe.src = video.embed;
  overlay.style.display = "none";
  wrapper.style.backgroundImage = "none";
};
}

// VIDEO KHÁC
videos
  .filter(v => v.id !== id)
  .forEach(v => {
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
    related.appendChild(card);
  });
