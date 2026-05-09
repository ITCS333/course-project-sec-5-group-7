let currentResourceId = null;
let currentComments = [];

// Element Selections
const titleEl = document.getElementById("resource-title");
const descEl = document.getElementById("resource-description");
const linkEl = document.getElementById("resource-link");
const commentListEl = document.getElementById("comment-list");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("new-comment");

// Get ID from URL
function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Render resource details
function renderResourceDetails(resource) {
  titleEl.textContent = resource.title;
  descEl.textContent = resource.description;
  linkEl.href = resource.link;
}

// Create comment article
function createCommentArticle(comment) {
  const article = document.createElement("article");

  const p = document.createElement("p");
  p.textContent = comment.text;

  const footer = document.createElement("footer");
  footer.textContent = `Posted by: ${comment.author}`;

  article.appendChild(p);
  article.appendChild(footer);

  return article;
}

// Render comments
function renderComments() {
  commentListEl.innerHTML = "";

  currentComments.forEach(comment => {
    commentListEl.appendChild(createCommentArticle(comment));
  });
}

// Add comment
async function handleAddComment(event) {
  event.preventDefault();

  const commentText = commentInput.value.trim();
  if (!commentText) return;

  const response = await fetch("./api/index.php?action=comment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: "Student",
      text: commentText
    })
  });

  const result = await response.json();

  currentComments.push(result);
  renderComments();

  commentInput.value = "";
}

// Initialize page
async function initializePage() {
  currentResourceId = getResourceIdFromURL();

  if (!currentResourceId) {
    titleEl.textContent = "Resource not found.";
    return;
  }

  const [resourceRes, commentsRes] = await Promise.all([
    fetch(`./api/index.php?id=${currentResourceId}`),
    fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
  ]);

  const resourceData = await resourceRes.json();
  const commentsData = await commentsRes.json();

  if (!resourceData.data) {
    titleEl.textContent = "Resource not found.";
    return;
  }

  const resource = resourceData.data;

  currentComments = commentsData.data || [];

  renderResourceDetails(resource);
  renderComments();

  commentForm.addEventListener("submit", handleAddComment);
}

initializePage();
