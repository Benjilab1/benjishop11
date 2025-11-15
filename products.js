// products.js
// Script front pour la boutique (catégories + produits)

// --------------- LISTE DES PERSONNAGES / CATÉGORIES ---------------
// Tu peux rajouter / modifier les noms ici.
// Ils doivent être EXACTEMENT identiques aux noms que tu utilises :
//  - dans les fichiers images (slugué ensuite)
//  - dans le select "Personnage / Catégorie d’accueil" du panel admin
const BRAINROT_NAMES = [
  "Burguro and Fryuro",
  "Capitano Moby",
  "Celularcini Viciosini",
  "Chillin Chili",
  "Chipso and Queso",
  "Dragon Cannelloni",
  "Esok Sekolah",
  "Eviledon",
  "Fragrama and Chocrama",
  "Garama and Madundung",
  "La Grande Combinasion",
  "Los 67",
  "Los Primos",
  "La Spooky Grande",
  "Perrito Burrito",
  "Mieteteira Bicicleteira",
  "Quesadilla Crocodila",
  "Nucléaro Dinossauro",
  "Los Bros",
  "La Extinct Grande"
].sort((a, b) => a.localeCompare(b));

// catégories à masquer complètement sur la home (si tu veux cacher des persos)
const HIDDEN_CATEGORIES = [
  "Quesadilla Crocodila",
  "Mieteteira Bicicleteira"
];

// --------------- CONFIG IMAGES -----------------
const RAW_DIR = "Photo brainrot site";
const BASE = `./${encodeURIComponent(RAW_DIR)}/`;

function toSlug(name){
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9\s]/g,"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g,"-");
}

function imgUrlFromName(name, ext="webp"){
  return `${BASE}${toSlug(name)}.${ext}`;
}

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#050713'/><text x='50%' y='50%' fill='#7a6ca4' font-size='14' text-anchor='middle' dominant-baseline='middle'>Image manquante</text></svg>"
);

// --------------- RENDU CATEGORIES -----------------
const gridRoot = document.getElementById("grid");

function renderCategories(counts = {}){
  const cats = BRAINROT_NAMES.map(n => ({
    name: n,
    image: imgUrlFromName(n)
  }));

  if (!gridRoot) return;

  gridRoot.innerHTML = `
    <div class="cats-grid">
      ${cats.map(c => `
        <div class="cat-card" data-name="${c.name}">
          <div class="cat-thumb">
            <img src="${c.image}" alt="${c.name}" data-cat="${c.name}">
          </div>
          <div class="cat-body">
            <div class="cat-name">${c.name}</div>
            <div class="cat-count">${counts[c.name] || 0} à vendre</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // fallback images (webp -> png -> jpg -> placeholder)
  gridRoot.querySelectorAll("img[data-cat]").forEach(img => {
    img.addEventListener("error", function onErr(){
      const tried = img.dataset.tried || "webp";
      if (tried === "webp") { img.dataset.tried = "png"; img.src = imgUrlFromName(img.dataset.cat,"png"); }
      else if (tried === "png") { img.dataset.tried = "jpg"; img.src = imgUrlFromName(img.dataset.cat,"jpg"); }
      else { img.removeEventListener("error", onErr); img.src = PLACEHOLDER; }
    });
  });

  // clic sur une carte -> on affiche la liste des produits pour ce perso
  gridRoot.querySelectorAll(".cat-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = card.getAttribute("data-name");
      const u = new URL(location.href);
      u.searchParams.set("perso", name);
      history.replaceState({}, "", u);
      renderProductList(name);
    });
  });
}

// --------------- RENDU PRODUITS -----------------
function cardHTML(p){
  const title = p.title || p.category || "Item";
  const cat   = p.category || "Autre";
  const price = (Number(p.price_eur) || 0).toFixed(2).replace(".",",") + "€";

  let img = p.image;
  if (!img && cat){
    img = imgUrlFromName(cat);
  }
  if (!img) img = PLACEHOLDER;

  return `
    <div class="card" data-id="${p.id || ""}">
      <div class="thumb">
        <img src="${img}" alt="${title}" onerror="this.src='${PLACEHOLDER}'">
      </div>
      <div class="body">
        <div class="title">${title}</div>
        <div class="meta">
          <span class="cat">${cat}</span>
          <span class="price">${price}</span>
        </div>
      </div>
    </div>
  `;
}

function renderProductList(categoryName){
  const items = (window.__ALL_ITEMS__ || []).filter(p => (p.category || "") === categoryName);

  gridRoot.innerHTML = `
    <div class="cat-head">
      <button class="back" id="backToCats">&larr; Catégories</button>
      <h2 style="margin:0">${categoryName}</h2>
    </div>
    <div class="products-grid">
      ${
        items.length
        ? items.map(cardHTML).join("")
        : `<div class="empty">Rien en vente pour ce perso pour le moment.</div>`
      }
    </div>
  `;

  document.getElementById("backToCats").addEventListener("click", () => {
    const u = new URL(location.href);
    u.searchParams.delete("perso");
    history.replaceState({}, "", u);
    renderCategories(window.__COUNTS__ || {});
  });
}

// --------------- CHARGEMENT DES PRODUITS (NETLIFY) -----------------
async function loadProducts(){
  // Affiche déjà toutes les catégories avec "0 à vendre"
  renderCategories();

  try{
    const res = await fetch("/.netlify/functions/products");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const payload = await res.json();

    const rawItems = Array.isArray(payload.items) ? payload.items : payload;
    const all = rawItems
      .filter(Boolean)
      .filter(p => !HIDDEN_CATEGORIES.includes(p.category || ""));

    window.__ALL_ITEMS__ = all;

    const counts = {};
    for (const p of all){
      const cat = (p.category || "").trim();
      if (!cat) continue;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    window.__COUNTS__ = counts;

    // Re-rendu avec les bons compteurs
    renderCategories(counts);

    // Si on a un perso dans l'URL, on affiche direct sa page
    const qs = new URL(location.href).searchParams.get("perso");
    if (qs && BRAINROT_NAMES.includes(qs)){
      renderProductList(qs);
    }
  }catch(err){
    console.warn("API produits indisponible ou erreur :", err);
    // on laisse quand même les catégories visibles avec 0
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
