let resources = [];

const form = document.querySelector("#resource-form");
const tbody = document.querySelector("#resources-table-body");

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

    if (result.success) {
        resources = result.data;
        render();
    } else {
        console.error("Load failed:", result.message);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.querySelector("#resource-title").value;
    const description = document.querySelector("#resource-description").value;
    const link = document.querySelector("#resource-link").value;

    const res = await fetch("./api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, link })
    });

    const result = await res.json();

    if (result.success) {
        resources.push({
            id: result.id,
            title,
            description,
            link
        });

        render();
        form.reset();
    } else {
        alert(result.message);
    }
});

tbody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;

        const res = await fetch(`./api/index.php?id=${id}`, {
            method: "DELETE"
        });

        const result = await res.json();

        if (result.success) {
            resources = resources.filter(r => r.id != id);
            render();
        } else {
            alert(result.message);
        }
    }
});

load();
