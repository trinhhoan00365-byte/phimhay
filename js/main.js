const grid = document.getElementById("video-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search");

const perPage = 14;
let currentPage = 1;

let filterView = "view_desc";
let filterTime = "all";

let videos = [];
let filtered = [];

const WORKER_URL = "https://traingonn.trinhhoan00365.workers.dev";

// FORMAT VIEW
function formatView(n){
  if(n>=1000000) return (n/1000000).toFixed(1)+"M";
  if(n>=1000) return (n/1000).toFixed(1)+"K";
  return n;
}

// LOAD VIDEO
fetch(WORKER_URL+"/videos")
  .then(r=>r.json())
  .then(data=>{
    videos=data;
    filtered=[...videos];
    render();
  });

// APPLY FILTER
function applyFilter(list){
  let result=[...list];

  if(filterView==="view_desc"){
    result.sort((a,b)=>(b.views||0)-(a.views||0));
  }
  if(filterView==="view_asc"){
    result.sort((a,b)=>(a.views||0)-(b.views||0));
  }

  return result;
}

// RENDER
function render(){
  grid.innerHTML="";

  const sorted=applyFilter(filtered);
  const start=(currentPage-1)*perPage;
  const pageVideos=sorted.slice(start,start+perPage);

  pageVideos.forEach(v=>{
    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <img class="thumb" src="${v.thumb}">
      <h3>${v.title}</h3>
      <div class="card-views"> ${formatView(v.views||0)} view</div>
    `;

    card.onclick=()=>location.href=`watch.html?id=${v.id}`;
    grid.appendChild(card);
  });

  renderPagination(sorted.length);
}

// PAGINATION
function renderPagination(total){
  pagination.innerHTML="";
  const pages=Math.ceil(total/perPage);

  for(let i=1;i<=pages;i++){
    const btn=document.createElement("button");
    btn.textContent=i;
    if(i===currentPage) btn.style.background="#ff9800";
    btn.onclick=()=>{
      currentPage=i;
      render();
    };
    pagination.appendChild(btn);
  }
}

// SEARCH
searchInput.oninput=()=>{
  const key=searchInput.value.toLowerCase();
  filtered=videos.filter(v=>v.title.toLowerCase().includes(key));
  currentPage=1;
  render();
};

// FILTER EVENTS
document.getElementById("filterView").onchange=e=>{
  filterView=e.target.value;
  currentPage=1;
  render();
};

document.getElementById("filterTime").onchange=e=>{
  filterTime=e.target.value;
  currentPage=1;
  render();
};
