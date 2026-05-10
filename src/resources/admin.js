let resources = [];

const form = document.querySelector("#resource-form");
const tbody = document.querySelector("#resources-tbody");

function createRow(r) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${r.title}</td>
        <td>${r.description}</td>
        <td><a href="${r.link}" target="_blank">Link</a></td>
        <td><button class="delete-btn" data-id="${r.id}">Delete</button></td>
    `;

    return tr;
}

function render() {
    tbody.innerHTML = "";
    resources.forEach(r => tbody.appendChild(createRow(r)));
}

async function load() {
    const res = await fetch("./api/index.php");
    const result = await res.json();
    resources = result.data;
    render();
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.querySelector("#resource-title").value;
    const description = document.querySelector("#resource-description").value;
    const link = document.querySelector("#resource-link").value;

    const res = await fetch("./api/index.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ title, description, link })
    });

    const result = await res.json();

    resources.push({
        id: result.data.id,
        title,
        description,
        link
    });

    render();
    form.reset();
});

tbody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;

        await fetch(`./api/index.php?id=${id}`, {
            method: "DELETE"
        });

        resources = resources.filter(r => r.id != id);
        render();
    }
});

load();
