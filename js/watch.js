const WORKER_URL = "https://go.avboy.top";

// ===== LẤY ID TỪ URL =====
let videoId = null;

// /watch/abcd
const match = location.pathname.match(/\/watch\/(.+)/);
if (match) videoId = match[1];

// fallback ?id=
if (!videoId) {
  videoId = new URLSearchParams(location.search).get("id");
}

// DEBUG: in ID ra màn hình
document.body.innerHTML = `
  <div style="color:white;padding:20px">
    <h3>DEBUG</h3>
    <p><b>URL:</b> ${location.href}</p>
    <p><b>videoId:</b> ${videoId}</p>
    <pre id="debug"></pre>
  </div>
`;

if (!videoId) {
  document.getElementById("debug").textContent = "❌ KHÔNG LẤY ĐƯỢC ID";
  throw new Error("NO ID");
}

// ===== FETCH VIDEO =====
fetch(WORKER_URL + "/videos")
  .then(r => r.json())
  .then(videos => {
    document.getElementById("debug").textContent =
      "VIDEO IDS:\n" + videos.map(v => String(v.id)).join("\n");

    const found = videos.find(v => String(v.id) === String(videoId));

    if (!found) {
      document.getElementById("debug").textContent +=
        "\n\n❌ KHÔNG MATCH ID";
      return;
    }

    document.getElementById("debug").textContent +=
      "\n\n✅ MATCH VIDEO:\n" + JSON.stringify(found, null, 2);
  })
  .catch(err => {
    document.getElementById("debug").textContent = "FETCH ERROR\n" + err;
  });
