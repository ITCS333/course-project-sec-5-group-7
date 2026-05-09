let resources = [];

// Element Selections
const form = document.getElementById("resource-form");
const tbody = document.getElementById("resources-tbody");

// Create table row
function createResourceRow(resource) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${resource.title}</td>
    <td>${resource.description}</td>
    <td><a href="${resource.link}" target="_blank">Open</a></td>
    <td>
      <button class="edit-btn" data-id="${resource.id}">Edit</button>
      <button class="delete-btn" data-id="${resource.id}">Delete</button>
    </td>
  `;

  return tr;
}

// Render table
function renderTable() {
  tbody.innerHTML = "";

  resources.forEach(resource => {
    tbody.appendChild(createResourceRow(resource));
  });
}

// Add Resource
async function handleAddResource(event) {
  event.preventDefault();

  const title = document.getElementById("resource-title").value;
  const description = document.getElementById("resource-description").value;
  const link = document.getElementById("resource-link").value;

  const response = await fetch("./api/index.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, description, link })
  });

  const result = await response.json();

  resources.push({
    id: result.id,
    title,
    description,
    link
  });

  renderTable();
  form.reset();
}

// Handle table actions (delete + edit)
async function handleTableClick(event) {
  const id = event.target.dataset.id;

  // DELETE
  if (event.target.classList.contains("delete-btn")) {
    await fetch(`./api/index.php?id=${id}`, {
      method: "DELETE"
    });

    resources = resources.filter(r => r.id != id);
    renderTable();
  }

  // EDIT
  if (event.target.classList.contains("edit-btn")) {
    const resource = resources.find(r => r.id == id);

    document.getElementById("resource-title").value = resource.title;
    document.getElementById("resource-description").value = resource.description;
    document.getElementById("resource-link").value = resource.link;

    const button = document.getElementById("add-resource");
    button.textContent = "Update Resource";

    form.onsubmit = async function (e) {
      e.preventDefault();

      const title = document.getElementById("resource-title").value;
      const description = document.getElementById("resource-description").value;
      const link = document.getElementById("resource-link").value;

      await fetch("./api/index.php", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, title, description, link })
      });

      const index = resources.findIndex(r => r.id == id);
      resources[index] = { id, title, description, link };

      renderTable();
      form.reset();
      button.textContent = "Add Resource";
      form.onsubmit = handleAddResource;
    };
  }
}

// Load data + initialize
async function loadAndInitialize() {
  const response = await fetch("./api/index.php");
  const result = await response.json();

  resources = result.data;

  renderTable();

  form.addEventListener("submit", handleAddResource);
  tbody.addEventListener("click", handleTableClick);
}

loadAndInitialize();
