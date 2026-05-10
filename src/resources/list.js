const resourceListSection = document.querySelector("#resource-list-section");

function createResourceArticle(resource) {
  const article = document.createElement("article");

  const h = document.createElement("h2");
  h.textContent = resource.title;

  const p = document.createElement("p");
  p.textContent = resource.description;

  const a = document.createElement("a");
  a.href = `details.html?id=${resource.id}`;
  a.textContent = "View Resource & Discussion";

  article.appendChild(h);
  article.appendChild(p);
  article.appendChild(a);

  return article;
}

async function loadResources() {
  const res = await fetch("./api/index.php");
  const result = await res.json();

  resourceListSection.innerHTML = "";

  for (let i = 0; i < result.data.length; i++) {
    resourceListSection.appendChild(createResourceArticle(result.data[i]));
  }
}

loadResources();
