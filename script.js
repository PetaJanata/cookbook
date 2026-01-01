const grid = document.getElementById("recipesGrid");
const labelBar = document.getElementById("label-bar");

let allRecipes = [];
let filteredRecipes = [];
let index = 0;
const batchSize = 6;
let observer = null;
let activeFilter = null;


// ---- Load CSV ----
fetch("recipes.csv")
  .then(res => res.text())
  .then(text => {
    allRecipes = parseCSV(text);
    filteredRecipes = allRecipes;

    buildLabelBar();
    resetAndLoad();
  })
  .catch(err => console.error("CSV Load Error:", err));


// ---- Parse CSV ----
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].replace(/\r/g, "").split(",");

  const col = {};
  headers.forEach((h, i) => col[h.trim()] = i);

  return lines.slice(1)
    .map(line => {
      const parts = line.replace(/\r/g, "").split(",");
      return {
        name: parts[col["Name"]],
        image: parts[col["MainPicture"]],
        label: parts[col["Label"]],
        time: parts[col["Time"]]
      };
    })
    .filter(r => r && r.name);
}


// ---- Label → class names ----
function labelClass(label) {
  if (!label) return "";
  const key = label.trim().toLowerCase();

  if (key.includes("breakfast")) return "label-breakfast";
  if (key.includes("main")) return "label-main";
  if (key.includes("baking") || key.includes("dessert")) return "label-baking";
  if (key.includes("snack") || key.includes("side")) return "label-snacks";
  if (key.includes("drink")) return "label-drinks";

  return "";
}


// ---- Build Label Bar ----
function buildLabelBar() {

  const unique = new Set();
  allRecipes.forEach(r => r.label && unique.add(r.label.trim()));

  labelBar.innerHTML = "";

  unique.forEach(label => {
    const span = document.createElement("span");

    span.className = `category-label ${labelClass(label)}`;
    span.textContent = label;

    span.addEventListener("click", () => toggleFilter(label, span));

    labelBar.appendChild(span);
  });
}


// ---- Handle filter click ----
function toggleFilter(label, el) {

  // clicking same label clears filter
  if (activeFilter === label) {
    activeFilter = null;
    filteredRecipes = allRecipes;
    clearActiveStates();
  }
  else {
    activeFilter = label;
    filteredRecipes = allRecipes.filter(r => r.label === label);

    clearActiveStates();
    el.classList.add("active");
  }

  resetAndLoad();
}


function clearActiveStates() {
  document
    .querySelectorAll(".category-label")
    .forEach(l => l.classList.remove("active"));
}


// ---- Reset grid + scroll + index ----
function resetAndLoad() {
  if (observer) observer.disconnect();
  grid.innerHTML = "";
  index = 0;
  loadMore();
}


// ---- Load recipes with smooth stagger ----
async function loadMore() {
  if (index >= filteredRecipes.length) return;

  const slice = filteredRecipes.slice(index, index + batchSize);

  for (const r of slice) {
    addRecipeCard(r);
    await new Promise(r => setTimeout(r, 40));
  }

  index += batchSize;
  observeLastCard();
}


// ---- Create recipe card ----
function addRecipeCard(r) {

  const card = document.createElement("div");
  card.className = "recipe-card";

  card.innerHTML = `
    <img src="${r.image}" alt="${r.name}" loading="lazy">

    <div class="recipe-info">
      <div class="recipe-name">${r.name}</div>

      <div class="recipe-meta">
        <span class="recipe-label ${labelClass(r.label)}">${r.label}</span>
        <span class="recipe-time">${r.time}</span>
      </div>
    </div>
  `;

  grid.appendChild(card);
}


// ---- Infinite scroll ----
function observeLastCard() {

  if (observer) observer.disconnect();

  const cards = document.querySelectorAll(".recipe-card");
  const last = cards[cards.length - 1];
  if (!last) return;

  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMore();
  }, { rootMargin: "200px" });

  observer.observe(last);
}


// URL //
const cards = document.querySelectorAll(".recipe-card");
const labels = document.querySelectorAll(".category-label");

function filterRecipes(category) {

  cards.forEach(card => {
    const cardCat = card.dataset.category;
    card.style.display =
      (!category || cardCat === category) ? "" : "none";
  });

  // highlight selected label
  labels.forEach(label =>
    label.classList.toggle("active", label.dataset.filter === category)
  );
}

function setCategoryUrl(category) {
  const base = "/cookbook";

  if (!category) {
    history.pushState({}, "", `${base}/`);
  } else {
    history.pushState({}, "", `${base}/categories/${category}`);
  }
}

// when user clicks label
labels.forEach(label => {
  label.addEventListener("click", () => {
    const category = label.dataset.filter;
    setCategoryUrl(category);
    filterRecipes(category);
  });
});

// read category from URL when page loads
function initFromUrl() {
  const path = window.location.pathname.toLowerCase();

  const match = path.match(/\/categories\/([^/]+)/);
  const category = match ? match[1] : null;

  filterRecipes(category);
}

initFromUrl();
