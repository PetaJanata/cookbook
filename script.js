
const grid = document.getElementById("recipesGrid");
const sentinel = document.getElementById("sentinel");

let recipes = [];
let batchSize = 6;   // 3 per row × 2 rows on HD
let index = 0;

/******** Load CSV *********/
fetch("recipes.csv")
  .then(res => res.text())
  .then(text => {
    recipes = parseCSV(text);
    loadMore(); // initial load
  });

/******** Parse CSV into objects *********/
function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .slice(1) // skip header
    .map(line => {
      const parts = line.split(",");
      return {
        name: parts[0],
        image: parts[1],
        label: parts[2],
        time: parts[3]
      };
    });
}

/******** Render a batch *********/
function loadMore() {
  const slice = recipes.slice(index, index + batchSize);
  slice.forEach(addRecipeCard);
  index += batchSize;

  if (index >= recipes.length) observer.disconnect();
}

/******** Create card *********/
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

/******** Infinite scroll via IntersectionObserver *********/
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    loadMore();
  }
});

observer.observe(sentinel);
