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
}

function createComment(comment) {
  const article = document.createElement("article");

  const p = document.createElement("p");
  p.textContent = comment.text;

  const footer = document.createElement("footer");
  footer.textContent = "Posted by: " + comment.author;

  article.appendChild(p);
  article.appendChild(footer);

  return article;
}

function renderComments() {
  commentList.innerHTML = "";

  for (let i = 0; i < comments.length; i++) {
    commentList.appendChild(createComment(comments[i]));
  }
}

async function handleAddComment(e) {
  e.preventDefault();

  const text = input.value;
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

  comments.push(result.data);

  renderComments();
  input.value = "";
}

async function initializePage() {
  const res1 = await fetch(`./api/index.php?id=${id}`);
  const res2 = await fetch(`./api/index.php?resource_id=${id}&action=comments`);

  const data1 = await res1.json();
  const data2 = await res2.json();

  if (!data1.data) {
    titleEl.textContent = "Resource not found";
    return;
  }

  renderDetails(data1.data);

  comments = data2.data || [];
  renderComments();

  form.addEventListener("submit", handleAddComment);
}

initializePage();
