<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resources Manager</title>

<style>
    body {
        font-family: Arial, sans-serif;
        background: #f4f6f9;
        margin: 0;
        padding: 20px;
    }

    h1 {
        text-align: center;
        margin-bottom: 20px;
    }

    /* Form */
    form {
        background: #fff;
        padding: 15px;
        border-radius: 10px;
        max-width: 600px;
        margin: 0 auto 20px auto;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    form input {
        width: 100%;
        padding: 10px;
        margin: 8px 0;
        border: 1px solid #ddd;
        border-radius: 6px;
    }

    form button {
        width: 100%;
        padding: 10px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
    }

    form button:hover {
        background: #0056b3;
    }

    /* Table */
    table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    th, td {
        padding: 12px;
        border-bottom: 1px solid #eee;
        text-align: left;
    }

    th {
        background: #007bff;
        color: white;
    }

    tr:hover {
        background: #f1f1f1;
    }

    /* Buttons */
    .edit-btn {
        background: orange;
        border: none;
        padding: 6px 10px;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        margin-right: 5px;
    }

    .delete-btn {
        background: red;
        border: none;
        padding: 6px 10px;
        color: white;
        border-radius: 5px;
        cursor: pointer;
    }

    a {
        color: #007bff;
        text-decoration: none;
    }
</style>
</head>

<body>

<h1>Resources Manager</h1>

<form id="resource-form">
    <input id="resource-title" type="text" placeholder="Title" required>
    <input id="resource-description" type="text" placeholder="Description">
    <input id="resource-link" type="url" placeholder="Link" required>
    <button id="add-resource" type="submit">Add Resource</button>
</form>

<table>
    <thead>
        <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Link</th>
            <th>Actions</th>
        </tr>
    </thead>

    <tbody id="resources-tbody"></tbody>
</table>

<script>
let resources = [];
let editId = null;

const resourceForm = document.querySelector("#resource-form");
const resourcesTbody = document.querySelector("#resources-tbody");
const submitButton = document.querySelector("#add-resource");

function createResourceRow(resource) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${resource.title}</td>
        <td>${resource.description || ""}</td>
        <td><a href="${resource.link}" target="_blank">${resource.link}</a></td>
        <td>
            <button class="edit-btn" data-id="${resource.id}">Edit</button>
            <button class="delete-btn" data-id="${resource.id}">Delete</button>
        </td>
    `;

    return tr;
}

function renderTable(resourceList) {
    resourcesTbody.innerHTML = "";
    resourceList.forEach((resource) => {
        const row = createResourceRow(resource);
        resourcesTbody.appendChild(row);
    });
}

async function handleAddResource(event) {
    event.preventDefault();

    const title = document.querySelector("#resource-title").value;
    const description = document.querySelector("#resource-description").value;
    const link = document.querySelector("#resource-link").value;

    if (editId) {
        const response = await fetch("./api/index.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editId, title, description, link }),
        });

        const result = await response.json();

        if (result.success) {
            resources = resources.map((resource) =>
                resource.id == editId
                    ? { ...resource, title, description, link }
                    : resource
            );

            editId = null;
            submitButton.textContent = "Add Resource";
            resourceForm.reset();
            renderTable(resources);
        }

        return;
    }

    const response = await fetch("./api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, link }),
    });

    const result = await response.json();

    if (result.success) {
        resources.push({
            id: result.id,
            title,
            description,
            link,
        });

        resourceForm.reset();
        renderTable(resources);
    }
}

async function handleTableClick(event) {
    const clickedButton = event.target;

    if (clickedButton.classList.contains("delete-btn")) {
        const id = clickedButton.dataset.id;

        const response = await fetch(`./api/index.php?id=${id}`, {
            method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
            resources = resources.filter((resource) => resource.id != id);
            renderTable(resources);
        }
    }

    if (clickedButton.classList.contains("edit-btn")) {
        const id = clickedButton.dataset.id;
        const resource = resources.find((r) => r.id == id);

        if (resource) {
            document.querySelector("#resource-title").value = resource.title;
            document.querySelector("#resource-description").value = resource.description || "";
            document.querySelector("#resource-link").value = resource.link;

            editId = id;
            submitButton.textContent = "Update Resource";
        }
    }
}

async function loadAndInitialize() {
    const response = await fetch("./api/index.php");
    const result = await response.json();

    if (result.success) {
        resources = result.data;
        renderTable(resources);
    }

    resourceForm.addEventListener("submit", handleAddResource);
    resourcesTbody.addEventListener("click", handleTableClick);
}

loadAndInitialize();
</script>

</body>
</html>
