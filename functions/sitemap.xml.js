export async function onRequest() {

  const res = await fetch("https://go.avboy.top/videos");
  const videos = await res.json();

  const site = "https://avboy.top";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // homepage
  xml += `
  <url>
    <loc>${site}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  // video pages
  videos.forEach(v => {
    xml += `
    <url>
      <loc>${site}/watch/${v.id}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  // tag pages
  const tagSet = new Set();

  videos.forEach(v => {
    if (v.tags) {
      v.tags.forEach(t => tagSet.add(t));
    }
  });

  tagSet.forEach(tag => {
    xml += `
    <url>
      <loc>${site}/tag/${encodeURIComponent(tag)}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  });

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml"
    }
  });

}
