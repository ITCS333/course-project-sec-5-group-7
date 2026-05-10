let currentResourceId = new URLSearchParams(window.location.search).get("id");

const titleEl = document.querySelector("#resource-title");
const descEl = document.querySelector("#resource-description");
const linkEl = document.querySelector("#resource-link");
const commentList = document.querySelector("#comment-list");
const form = document.querySelector("#comment-form");
const input = document.querySelector("#new-comment");

let currentComments = [];

function getResourceIdFromURL() {
  return currentResourceId;
}

function renderResourceDetails(resource) {
  titleEl.textContent = resource.title;
  descEl.textContent = resource.description;
  linkEl.href = resource.link;
}

function createCommentArticle(comment) {
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

  for (let i = 0; i < currentComments.length; i++) {
    commentList.appendChild(createCommentArticle(currentComments[i]));
  }
}

async function handleAddComment(event) {
  event.preventDefault();

  const text = input.value;

  if (!text) return;

  const res = await fetch("./api/index.php?action=comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: "Student",
      text: text
    })
  });

  const result = await res.json();

  currentComments.push(result.data);

  renderComments();
  input.value = "";
}

async function initializePage() {
  const id = getResourceIdFromURL();

  if (!id) {
    titleEl.textContent = "Resource not found.";
    return;
  }

  const res1 = await fetch(`./api/index.php?id=${id}`);
  const res2 = await fetch(`./api/index.php?resource_id=${id}&action=comments`);

  const data1 = await res1.json();
  const data2 = await res2.json();

  currentComments = data2.data || [];

  renderResourceDetails(data1.data);
  renderComments();

  form.addEventListener("submit", handleAddComment);
}

initializePage();
