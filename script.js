const grid = document.getElementById("recipesGrid");
const sentinel = document.getElementById("sentinel");

let recipes = [];
let index = 0;
const batchSize = 6; // 3 × 2 rows


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
    .filter(r => r && r.name); // skip blanks
}


// ---- Render a batch ----
function loadMore() {

  // nothing left? stop observing
  if (index >= recipes.length) {
    observer.unobserve(sentinel);
    return;
  }

  const slice = recipes.slice(index, index + batchSize);
  slice.forEach(addRecipeCard);
  index += batchSize;
}


function addRecipeCard(r) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  card.innerHTML = `
    <img src="${r.image}" alt="${r.name}">
    <div class="recipe-info">
      <div class="recipe-name">${r.name}</div>
      <span class="recipe-label">${r.label}</span>
      <span class="recipe-time">${r.time}</span>
    </div>
  `;

  grid.appendChild(card);
}


// ---- Infinite Scroll (reliable) ----
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMore();
    }
  });
}, {
  root: null,
  rootMargin: "200px",   // load a bit early
  threshold: 0
});

observer.observe(sentinel);
