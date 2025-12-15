const TMDB_KEY = "593f936ea6ac7068502a786d74859854";
const BASE = "https://api.themoviedb.org/3";

const trendingList = document.getElementById("trendingList");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchSection = document.getElementById("searchSection");
const trendingSection = document.getElementById("trendingSection");
const playerSection = document.getElementById("playerSection");
const playerContainer = document.getElementById("playerContainer");
const playerPlaceholder = document.getElementById("playerPlaceholder");
const infoContainer = document.getElementById("infoContainer");
const backBtn = document.getElementById("backBtn");
const suggestions = document.getElementById("suggestions");
const sortSelect = document.getElementById("sortSelect");
const genreSelect = document.getElementById("genreSelect");
const typeSelect = document.getElementById("typeSelect");
const ageSelect = document.getElementById("ageSelect");

let debounceTimer;
let currentPage = 1;
let currentSort = sortSelect.value;
let currentGenre = "";
let currentType = "";
let currentAge = "";

// ---------------- Fetch Genres ----------------
async function fetchGenres() {
  const res = await fetch(`${BASE}/genre/movie/list?api_key=${TMDB_KEY}`);
  const data = await res.json();
  data.genres.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    genreSelect.appendChild(opt);
  });
}
fetchGenres();

// ---------------- Fetch Movies/Shows ----------------
async function fetchMovies(page=1) {
  let url = `${BASE}/discover/movie?api_key=${TMDB_KEY}&sort_by=${currentSort}&page=${page}`;
  if(currentGenre) url += `&with_genres=${currentGenre}`;
  if(currentType==="tv") url = `${BASE}/discover/tv?api_key=${TMDB_KEY}&sort_by=${currentSort}&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();
  displayMovies(data.results, trendingList, page>1);
}

// ---------------- Display Movies ----------------
function displayMovies(movies, container, append=false){
  if(!append) container.innerHTML="";
  movies.forEach(movie=>{
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/500x750?text=No+Image";
    const card = document.createElement("div");
    card.className="movie-card";
    card.innerHTML=`<img src="${poster}" alt="${movie.title || movie.name}"><p>${movie.title || movie.name}</p>`;
    card.addEventListener("click", ()=>{
      if(movie.media_type==="tv"||movie.title===undefined) fetchSeries(movie.id);
      else playVidFast(movie.id,"movie");
    });
    container.appendChild(card);
  });
}

// ---------------- Infinite Scroll ----------------
window.addEventListener('scroll',()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 100){
    currentPage++;
    fetchMovies(currentPage);
  }
});

// ---------------- Sorting / Genre / Type / Age ----------------
sortSelect.addEventListener("change",()=>{
  currentSort=sortSelect.value;
  currentPage=1;
  fetchMovies();
});

genreSelect.addEventListener("change",()=>{
  currentGenre=genreSelect.value;
  currentPage=1;
  fetchMovies();
});

typeSelect.addEventListener("change",()=>{
  currentType=typeSelect.value;
  currentPage=1;
  fetchMovies();
});

ageSelect.addEventListener("change",()=>{
  currentAge=ageSelect.value;
  currentPage=1;
  fetchMovies();
});

// ---------------- Live Search ----------------
searchInput.addEventListener("input",()=>{
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();
  if(!query){ suggestions.innerHTML=""; suggestions.style.display="none"; return; }
  debounceTimer=setTimeout(async ()=>{
    const res = await fetch(`${BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    displaySuggestions(data.results);
  },300);
});

function displaySuggestions(movies){
  suggestions.innerHTML="";
  if(!movies || movies.length==0){ suggestions.style.display="none"; return; }
  movies.slice(0,10).forEach(movie=>{
    const div=document.createElement("div");
    div.className="suggestion-item";
    div.textContent=movie.title||movie.name;
    div.addEventListener("click",()=>{
      searchInput.value=movie.title||movie.name;
      suggestions.innerHTML="";
      suggestions.style.display="none";
      displayMovies([movie],searchResults);
      trendingSection.style.display="none";
      searchSection.style.display="block";
      playerSection.style.display="none";
    });
    suggestions.appendChild(div);
  });
  suggestions.style.display="block";
}

// ---------------- Series ----------------
async function fetchSeries(tvId){
  const res = await fetch(`${BASE}/tv/${tvId}?api_key=${TMDB_KEY}`);
  const tvData = await res.json();
  const seasonsContainer = document.createElement("div");
  seasonsContainer.className="seasons-grid";
  tvData.seasons.forEach(season=>{
    const seasonDiv=document.createElement("div");
    seasonDiv.className="season-card";
    seasonDiv.textContent=`Season ${season.season_number}`;
    seasonDiv.addEventListener("click",()=>displayEpisodes(tvId,season.season_number));
    seasonsContainer.appendChild(seasonDiv);
  });
  playerContainer.innerHTML="";
  playerContainer.appendChild(seasonsContainer);
  setInfo(tvData,"tv");
  trendingSection.style.display="none";
  searchSection.style.display="none";
  playerSection.style.display="block";
}

async function displayEpisodes(tvId, seasonNum){
  const res = await fetch(`${BASE}/tv/${tvId}/season/${seasonNum}?api_key=${TMDB_KEY}`);
  const seasonData=await res.json();
  const episodesContainer=document.createElement("div");
  episodesContainer.className="episodes-grid";
  seasonData.episodes.forEach(ep=>{
    const epDiv=document.createElement("div");
    epDiv.className="episode-card";
    epDiv.textContent=`Ep ${ep.episode_number}: ${ep.name}`;
    epDiv.addEventListener("click",()=>playVidFast(tvId,"tv",seasonNum,ep.episode_number));
    episodesContainer.appendChild(epDiv);
  });
  playerContainer.innerHTML="";
  playerContainer.appendChild(episodesContainer);
}

// ---------------- VidFast / Placeholder Player ----------------
function playVidFast(id,type="movie",season=1,episode=1){
  let url="";
  if(type==="movie") url=`https://vidfast.pro/movie/${id}?autoPlay=true`;
  else url=`https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`;

  // Placeholder image before loading
  fetch(`${BASE}/${type==='movie'?'movie':'tv'}/${id}?api_key=${TMDB_KEY}`)
    .then(res=>res.json())
    .then(data=>{
      const poster = data.poster_path?`https://image.tmdb.org/t/p/w500${data.poster_path}`:"";
      const backdrop = data.backdrop_path?`https://image.tmdb.org/t/p/original${data.backdrop_path}`:"";
      playerPlaceholder.src=`https://wsrv.nl/?url=${poster}&bg=black&blur=3&tint=black`;
      setInfo(data,type,backdrop);
    });

  // Show video container after placeholder
  playerContainer.style.display="block";
  playerContainer.innerHTML=`<iframe src="${url}" allowfullscreen allow="encrypted-media"></iframe>`;
  trendingSection.style.display="none";
  searchSection.style.display="none";
  playerSection.style.display="block";
}

// ---------------- Info Section ----------------
function setInfo(data,type,backdrop=""){
  infoContainer.innerHTML="";
  infoContainer.style.backgroundImage=`url(${backdrop})`;
  let html=`<h2>${data.title||data.name}</h2>`;
  if(data.overview) html+=`<p>${data.overview}</p>`;
  if(data.vote_average) html+=`<p>Rating: ${data.vote_average}</p>`;
  if(type==='movie' && data.release_date) html+=`<p>Release: ${data.release_date}</p>`;
  if(type==='tv' && data.first_air_date) html+=`<p>First Air: ${data.first_air_date}</p>`;

  // Cast placeholders
  html+=`<div class="cast-grid">`;
  for(let i=0;i<6;i++){
    html+=`<img src="https://via.placeholder.com/60x60?text=Cast" alt="Cast">`;
  }
  html+=`</div>`;
  infoContainer.innerHTML=html;
}

// ---------------- Back Button ----------------
backBtn.addEventListener("click",()=>{
  trendingSection.style.display="block";
  searchSection.style.display="none";
  playerSection.style.display="none";
});

// ---------------- Init ----------------
fetchMovies();
