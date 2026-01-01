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
    buildLabelBar();
    initFromUrl(); // <-- only on initial load
  })
  .catch(err => console.error("CSV Load Error:", err));

// ---- Parse CSV with trimming ----
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].replace(/\r/g, "").split(",");

  const col = {};
  headers.forEach((h, i) => col[h.trim()] = i);

  return lines.slice(1)
    .map(line => {
      const parts = line.replace(/\r/g, "").split(",");
      return {
        name: parts[col["Name"]].trim(),
        image: parts[col["MainPicture"]].trim(),
        label: parts[col["Label"]].trim(),
        time: parts[col["Time"]].trim()
      };
    })
    .filter(r => r && r.name && r.image);
}

// ---- Map label to class for colors ----
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

// ---- Build label bar ----
function buildLabelBar() {
  const unique = [...new Set(allRecipes.map(r => r.label))];
  labelBar.innerHTML = "";

  unique.forEach(label => {
    const span = document.createElement("span");
    span.className = `category-label ${labelClass(label)}`;
    span.textContent = label;
    span.dataset.slug = label.toLowerCase().replace(/\s+/g, "-");

    span.addEventListener("click", () =>
      clickFilter(label, span.dataset.slug)
    );

    labelBar.appendChild(span);
  });
}

// ---- Handle filter click ----
function clickFilter(labelText, slug) {
  if (activeFilter === slug) {
    activeFilter = null;
    filteredRecipes = allRecipes;
    history.pushState({}, "", "/cookbook/");
  } else {
    activeFilter = slug;
    filteredRecipes = allRecipes.filter(r => r.label === labelText);
    history.pushState({}, "", `/cookbook/categories/${slug}`);
  }

  clearActiveStates();
  document
    .querySelectorAll(`[data-slug="${slug}"]`)
    .forEach(el => el.classList.add("active"));

  resetAndLoad();
}

function clearActiveStates() {
  document.querySelectorAll(".category-label").forEach(el => el.classList.remove("active"));
}

// ---- Reset grid + scroll ----
function resetAndLoad() {
  if (observer) observer.disconnect();
  grid.innerHTML = "";
  index = 0;
  loadMore();
}

// ---- Load recipes dynamically ----
async function loadMore() {
  if (index >= filteredRecipes.length) return;

  const slice = filteredRecipes.slice(index, index + batchSize);
  for (const r of slice) {
    addRecipeCard(r);
    await new Promise(res => setTimeout(res, 30));
  }

  index += batchSize;
  observeLastCard();
}

// ---- Create recipe card ----
function addRecipeCard(r) {
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.dataset.category = r.label.toLowerCase().replace(/\s+/g, "-");

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

// ---- Init from URL ----
function initFromUrl() {
  const path = window.location.pathname.toLowerCase();
  const match = path.match(/\/categories\/([^/]+)/);
  const slug = match ? match[1] : null;

  if (!slug) {
    filteredRecipes = allRecipes;
    resetAndLoad();
    return;
  }

  const recipe = allRecipes.find(r =>
    r.label && r.label.toLowerCase().replace(/\s+/g, "-") === slug
  );

  if (!recipe) {
    filteredRecipes = allRecipes;
    resetAndLoad();
    return;
  }

  activeFilter = slug;
  filteredRecipes = allRecipes.filter(r => r.label === recipe.label);

  clearActiveStates();
  document
    .querySelectorAll(`[data-slug="${slug}"]`)
    .forEach(el => el.classList.add("active"));

  resetAndLoad();
}
