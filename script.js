const grid = document.getElementById("recipesGrid");
const labelBar = document.getElementById("label-bar");

let recipes = [];
let index = 0;
const batchSize = 6;
let observer = null;


// ---- Load CSV ----
fetch("recipes.csv")
  .then(res => res.text())
  .then(text => {
    recipes = parseCSV(text);

    buildLabelBar();   // Create label bar
    loadMore();        // Load first recipes
  })
  .catch(err => console.error("CSV Load Error:", err));


// ---- Parse CSV using header names ----
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


// ---- Shared color class logic ----
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

  recipes.forEach(r => {
    if (r.label) unique.add(r.label.trim());
  });

  unique.forEach(label => {
    const span = document.createElement("span");

    span.className = `category-label ${labelClass(label)}`;
    span.textContent = label;

    labelBar.appendChild(span);
  });
}


// ---- Load recipes smoothly ----
async function loadMore() {
  if (index >= recipes.length) {
    if (observer) observer.disconnect();
    return;
  }

  const slice = recipes.slice(index, index + batchSize);

  for (const r of slice) {
    addRecipeCard(r);
    await new Promise(r => setTimeout(r, 40));
  }

  index += batchSize;
  observeLastCard();
}


// ---- Create Card ----
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


// ---- Infinite scroll watching last card ----
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
