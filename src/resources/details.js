const id = new URLSearchParams(window.location.search).get("id");

const titleEl = document.querySelector("#resource-title");
const descEl = document.querySelector("#resource-description");
const linkEl = document.querySelector("#resource-link");

const commentList = document.querySelector("#comment-list");
const form = document.querySelector("#comment-form");
const input = document.querySelector("#new-comment");

let comments = [];

function renderDetails(resource) {
    titleEl.textContent = resource.title;
    descEl.textContent = resource.description;
    linkEl.href = resource.link;
    linkEl.textContent = "Open";
}

function createComment(c) {
    const div = document.createElement("div");
    div.innerHTML = `<p>${c.text}</p><small>${c.author}</small>`;
    return div;
}

function renderComments() {
    commentList.innerHTML = "";
    comments.forEach(c => commentList.appendChild(createComment(c)));
}

async function loadData() {
    const r1 = await fetch(`./api/index.php?id=${id}`);
    const r2 = await fetch(`./api/index.php?action=comments&resource_id=${id}`);

    const d1 = await r1.json();
    const d2 = await r2.json();

    if (d1.success) {
        renderDetails(d1.data);
    } else {
        console.error(d1.message);
    }

    if (d2.success) {
        comments = d2.data;
    } else {
        comments = [];
    }

    renderComments();
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    const res = await fetch("./api/index.php?action=comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            resource_id: id,
            author: "Student",
            text
        })
    });

    const result = await res.json();

    if (result.success) {
        comments.push({
            id: result.id,
            resource_id: id,
            author: "Student",
            text
        });

        renderComments();
        input.value = "";
    } else {
        alert(result.message);
    }
});

loadData();
