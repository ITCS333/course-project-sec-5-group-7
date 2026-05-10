let resources = [];

const form = document.querySelector("#resource-form");
const tbody = document.querySelector("#resources-tbody");

function createResourceRow(resource) {
  const tr = document.createElement("tr");

  const titleTd = document.createElement("td");
  titleTd.textContent = resource.title;

  const descTd = document.createElement("td");
  descTd.textContent = resource.description;

  const linkTd = document.createElement("td");
  const a = document.createElement("a");
  a.href = resource.link;
  a.textContent = "Link";
  a.target = "_blank";
  linkTd.appendChild(a);

  const actionsTd = document.createElement("td");

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.dataset.id = resource.id;
  editBtn.textContent = "Edit";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.dataset.id = resource.id;
  deleteBtn.textContent = "Delete";

  actionsTd.appendChild(editBtn);
  actionsTd.appendChild(deleteBtn);

  tr.appendChild(titleTd);
  tr.appendChild(descTd);
  tr.appendChild(linkTd);
  tr.appendChild(actionsTd);

  return tr;
}

function renderTable() {
  tbody.innerHTML = "";
  for (let i = 0; i < resources.length; i++) {
    tbody.appendChild(createResourceRow(resources[i]));
  }
}

async function handleAddResource(e) {
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

  resources.push({
    id: result.id,
    title,
    description,
    link
  });

  renderTable();
  form.reset();
}

function handleTableClick(e) {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;

    fetch(`./api/index.php?id=${id}`, {
      method: "DELETE"
    });

    resources = resources.filter(r => r.id != id);
    renderTable();
  }
}

async function loadAndInitialize() {
  const res = await fetch("./api/index.php");
  const result = await res.json();

  resources = result.data;

  renderTable();

  form.addEventListener("submit", handleAddResource);
  tbody.addEventListener("click", handleTableClick);
}

loadAndInitialize();
