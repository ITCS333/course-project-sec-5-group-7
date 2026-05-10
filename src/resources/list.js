const resourceListSection = document.querySelector("#resource-list-section");

function createResourceArticle(resource) {
  const article = document.createElement("article");

  const title = document.createElement("h2");
  title.textContent = resource.title;

  const desc = document.createElement("p");
  desc.textContent = resource.description;

  const link = document.createElement("a");
  link.href = `details.html?id=${resource.id}`;
  link.textContent = "View Resource & Discussion";

  article.appendChild(title);
  article.appendChild(desc);
  article.appendChild(link);

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
