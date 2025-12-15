const API = "https://netstream-backend.up.railway.app/api";
const IMG = "https://image.tmdb.org/t/p/w500";

const rows = document.getElementById("rows");
const modal = document.getElementById("modal");
const titleEl = document.getElementById("title");
const desc = document.getElementById("desc");
const iframePlayer = document.getElementById("iframe-player");
const videoPlayer = document.getElementById("video-player");
const noStream = document.getElementById("no-stream");
const trailer = document.getElementById("trailer");

const authModal = document.getElementById("auth-modal");
const authTitle = document.getElementById("auth-title");
const authUsername = document.getElementById("auth-username");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");

const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");

let token = localStorage.getItem("token") || null;

function clearPlayers() {
  iframePlayer.style.display = "none";
  videoPlayer.style.display = "none";
  noStream.style.display = "none";
  iframePlayer.src = "";
  videoPlayer.src = "";
  trailer.src = "";
}

// ---------------- Initial Trending ----------------
fetch(API + "/trending").then(r=>r.json()).then(d=>{ renderRow("Trending Now", d.results||[]); });

function renderRow(title, items) {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `<h3>${title}</h3><div class="list"></div>`;
  const list = row.querySelector(".list");
  items.filter(i=>i.poster_path).forEach(i=>{
    const c = document.createElement("div");
    c.className="card";
    c.innerHTML=`<img src="${IMG+i.poster_path}">`;
    c.onclick = ()=>openModal(i.media_type, i.id);
    list.appendChild(c);
  });
  rows.appendChild(row);
}

async function openModal(type, id) {
  clearPlayers();
  const d = await fetch(`${API}/details/${type}/${id}`).then(r=>r.json());
  const v = await fetch(`${API}/videos/${type}/${id}`).then(r=>r.json());
  const p = await fetch(`${API}/play/${type}/${id}`).then(r=>r.json());

  titleEl.textContent = d.title||d.name||"";
  desc.textContent = d.overview||"";

  if(p.mode==="iframe"&&p.url){ iframePlayer.style.display="block"; iframePlayer.src=p.url; }
  else if(p.mode==="html5"&&p.url){ videoPlayer.style.display="block"; videoPlayer.src=p.url; }
  else{ noStream.style.display="block"; }

  const yt = (v.results||[]).find(x=>x.site==="YouTube");
  if(yt) trailer.src=`https://www.youtube.com/embed/${yt.key}?autoplay=0`;
  modal.classList.remove("hidden");
}

document.getElementById("close").onclick=()=>{ clearPlayers(); modal.classList.add("hidden"); };
document.getElementById("search").oninput=async e=>{
  const q=e.target.value.trim();
  if(!q) return;
  rows.innerHTML="";
  const r=await fetch(API+"/search?q="+encodeURIComponent(q)).then(r=>r.json());
  renderRow("Search Results", r.results||[]);
};

// ---------------- Auth ----------------
loginBtn.onclick=()=>{ openAuth("login"); };
signupBtn.onclick=()=>{ openAuth("signup"); };
logoutBtn.onclick=()=>{ localStorage.removeItem("token"); token=null; logoutBtn.style.display="none"; loginBtn.style.display="inline"; signupBtn.style.display="inline"; alert("Logged out"); };

function openAuth(mode){
  authModal.classList.remove("hidden");
  authTitle.textContent = mode==="login"?"Login":"Signup";
  authUsername.style.display = mode==="signup"?"block":"none";
  authSubmit.onclick = ()=>submitAuth(mode);
}

document.getElementById("close-auth").onclick=()=>{ authModal.classList.add("hidden"); };

async function submitAuth(mode){
  const data = { email: authEmail.value, password: authPassword.value };
  if(mode==="signup") data.username = authUsername.value;
  const r = await fetch(API+"/auth/"+mode,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  const res = await r.json();
  if(res.error) return alert(res.error);
  token = res.token;
  localStorage.setItem("token", token);
  authModal.classList.add("hidden");
  loginBtn.style.display="none"; signupBtn.style.display="none"; logoutBtn.style.display="inline";
  alert(mode==="login"?"Logged in":"Account created");
}
