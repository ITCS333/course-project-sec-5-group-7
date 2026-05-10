const resourceListSection = document.querySelector("#resource-list");

const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const orderSelect = document.querySelector("#order-select");

function createResourceArticle(resource) {
    const li = document.createElement("li");

    const title = document.createElement("h3");
    title.textContent = resource.title;

    const description = document.createElement("p");
    description.textContent = resource.description || "";

    const link = document.createElement("a");
    link.textContent = "View Resource";
    link.href = `details.html?id=${resource.id}`;

    li.appendChild(title);
    li.appendChild(description);
    li.appendChild(link);

    return li;
}

async function loadResources() {
    let url = "./api/index.php";

    const search = searchInput?.value || "";
    const sort = sortSelect?.value || "created_at";
    const order = orderSelect?.value || "desc";

    url += `?search=${search}&sort=${sort}&order=${order}`;

    const response = await fetch(url);
    const result = await response.json();

    resourceListSection.innerHTML = "";

    if (result.success && Array.isArray(result.data)) {
        result.data.forEach(resource => {
            resourceListSection.appendChild(createResourceArticle(resource));
        });
    }
}

searchInput?.addEventListener("input", loadResources);
sortSelect?.addEventListener("change", loadResources);
orderSelect?.addEventListener("change", loadResources);

loadResources();
