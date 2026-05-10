const tbody = document.querySelector("#resources-table-body");

function createRow(resource) {
    const tr = document.createElement("tr");

    const titleTd = document.createElement("td");
    titleTd.textContent = resource.title;

    const actionTd = document.createElement("td");

    const link = document.createElement("a");
    link.textContent = "View";
    link.href = `details.html?id=${resource.id}`;

    actionTd.appendChild(link);

    tr.appendChild(titleTd);
    tr.appendChild(actionTd);

    return tr;
}

async function loadResources() {
    const res = await fetch("./api/index.php");
    const result = await res.json();

    tbody.innerHTML = "";

    if (result.success) {
        result.data.forEach(r => {
            tbody.appendChild(createRow(r));
        });
    } else {
        console.error(result.message);
    }
}

loadResources();
