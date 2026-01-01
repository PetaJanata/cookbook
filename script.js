const grid = document.getElementById("recipesGrid");

let recipes = [];
let index = 0;
const batchSize = 6;  // 3 × 2 rows
let observer = null;


// ---- Load CSV ----
fetch("recipes.csv")
  .then(res => res.text())
  .then(text => {
    recipes = parseCSV(text);
    loadMore();
  })
  .catch(err => console.error("CSV Load Error:", err));


// ---- Parse CSV using HEADER NAMES ----
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


const labelClassMap = {
  "Breakfast": "label-breakfast",
  "Main Dish": "label-main",
  "Baking & desserts": "label-baking",
  "Snacks & Sides": "label-snacks",
  "Drinks": "label-drinks"
};

let uniqueLabels = new Set();

recipes.forEach(r => uniqueLabels.add(r.label));

const labelBar = document.getElementById("label-bar");

uniqueLabels.forEach(label => {
  const span = document.createElement("span");

  span.className = `category-label ${labelClassMap[label] || ""}`;
  span.textContent = label;

  labelBar.appendChild(span);
});



// ---- Label → class mapping ----
function labelClass(label) {
  if (!label) return "";

  const key = label.trim().toLowerCase();

  if (key.includes("breakfast")) return "label-breakfast";
  if (key.includes("main")) return "label-main-dish";
  if (key.includes("baking") || key.includes("dessert")) return "label-baking-desserts";
  if (key.includes("snack") || key.includes("side")) return "label-snacks-sides";
  if (key.includes("drink")) return "label-drinks";

  return ""; // fallback style
}


// ---- Load a batch (with tiny stagger → smooth UI) ----
async function loadMore() {
  if (index >= recipes.length) {
    if (observer) observer.disconnect();
    return;
  }

  const slice = recipes.slice(index, index + batchSize);

  for (const r of slice) {
    addRecipeCard(r);
    await new Promise(r => setTimeout(r, 40)); // small delay for smoother paint
  }

  index += batchSize;
  observeLastCard();
}


// ---- Create Card ----
function addRecipeCard(r) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  const labelCls = labelClass(r.label);

  card.innerHTML = `
  <img src="${r.image}" alt="${r.name}" loading="lazy">

  <div class="recipe-info">
    <div class="recipe-name">${r.name}</div>

    <div class="recipe-meta">
      <span class="recipe-label ${labelCls}">${r.label}</span>
      <span class="recipe-time">${r.time}</span>
    </div>
  </div>
`;


  grid.appendChild(card);
}


// ---- Observe LAST CARD for infinite scroll ----
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
