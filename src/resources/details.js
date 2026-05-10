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
  descEl.textContent = resource.description || "";
  linkEl.href = resource.link;
}

function createComment(comment) {
  const li = document.createElement("li");

  const text = document.createElement("p");
  text.textContent = comment.text;

  const author = document.createElement("small");
  author.textContent = comment.author;

  li.appendChild(text);
  li.appendChild(author);

  return li;
}

function renderComments() {
  commentList.innerHTML = "";

  comments.forEach(c => {
    commentList.appendChild(createComment(c));
  });
}

async function handleAddComment(e) {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const res = await fetch("./api/index.php?action=comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resource_id: id,
      author: "Student",
      text: text
    })
  });

  const result = await res.json();

  if (result.success) {
    comments.push({
      id: result.id,
      resource_id: id,
      author: "Student",
      text: text
    });

    renderComments();
    input.value = "";
  }
}

async function initializePage() {
  if (!id) return;

  const res1 = await fetch(`./api/index.php?id=${id}`);
  const data1 = await res1.json();

  const res2 = await fetch(`./api/index.php?resource_id=${id}&action=comments`);
  const data2 = await res2.json();

  if (!data1.success || !data1.data) {
    titleEl.textContent = "Resource not found";
    return;
  }

  renderDetails(data1.data);

  comments = data2.success ? data2.data : [];
  renderComments();

  form.addEventListener("submit", handleAddComment);
}

initializePage();
