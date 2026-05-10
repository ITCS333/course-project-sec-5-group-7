let resources = [];

const form = document.querySelector("#resource-form");
const tbody = document.querySelector("#resources-tbody");

function createRow(resource) {
  const tr = document.createElement("tr");

  const t1 = document.createElement("td");
  t1.textContent = resource.title;

  const t2 = document.createElement("td");
  t2.textContent = resource.description;

  const t3 = document.createElement("td");
  const a = document.createElement("a");
  a.href = resource.link;
  a.textContent = "Link";
  t3.appendChild(a);

  const t4 = document.createElement("td");

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.dataset.id = resource.id;
  del.textContent = "Delete";

  t4.appendChild(del);

  tr.appendChild(t1);
  tr.appendChild(t2);
  tr.appendChild(t3);
  tr.appendChild(t4);

  return tr;
}

function render() {
  tbody.innerHTML = "";

  for (let i = 0; i < resources.length; i++) {
    tbody.appendChild(createRow(resources[i]));
  }
}

async function handleAdd(e) {
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

  render();
  form.reset();
}

function handleClick(e) {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;

    fetch(`./api/index.php?id=${id}`, { method: "DELETE" });

    resources = resources.filter(r => r.id != id);
    render();
  }
}

async function init() {
  const res = await fetch("./api/index.php");
  const result = await res.json();

  resources = result.data;

  render();

  form.addEventListener("submit", handleAdd);
  tbody.addEventListener("click", handleClick);
}

init();
