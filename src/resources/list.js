const resourceListSection = document.querySelector("#resource-list-section");

function createResourceArticle(resource) {
    const article = document.createElement("article");

    const title = document.createElement("h2");
    title.textContent = resource.title;

    const description = document.createElement("p");
    description.textContent = resource.description;

    const link = document.createElement("a");
    link.textContent = "View Resource & Discussion";
    link.href = `details.html?id=${resource.id}`;

    article.appendChild(title);
    article.appendChild(description);
    article.appendChild(link);

    return article;
}

async function loadResources() {
    const response = await fetch("./api/index.php");
    const result = await response.json();

    resourceListSection.innerHTML = "";

    if (result.success) {
        result.data.forEach(resource => {
            resourceListSection.appendChild(createResourceArticle(resource));
        });
    }
}

loadResources();
