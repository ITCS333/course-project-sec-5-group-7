// --- Global Data Store ---
let currentTopicId = null;
let currentReplies = [];

// --- Element Selections ---
const topicSubject        = document.getElementById('topic-subject');
const opMessage           = document.getElementById('op-message');
const opFooter            = document.getElementById('op-footer');
const replyListContainer  = document.getElementById('reply-list-container');
const replyForm           = document.getElementById('reply-form');
const newReplyText        = document.getElementById('new-reply');

// --- Inject CSS dynamically ---
const style = document.createElement('style');
style.textContent = `
#original-post {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s ease;
}
#original-post:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
#op-message {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
#op-footer {
  font-size: 0.875rem;
  color: #6c757d;
}
#reply-list-container article {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  transition: box-shadow 0.2s ease;
}
#reply-list-container article:hover {
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}
#reply-list-container p {
  margin: 0 0 0.5rem 0;
}
#reply-list-container footer {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}
#reply-list-container button {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
#reply-form {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
}
`;
document.head.appendChild(style);

// --- Functions ---

function getTopicIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderOriginalPost(topic) {
  topicSubject.textContent = topic.subject;
  opMessage.textContent    = topic.message;
  opFooter.textContent     = `Posted by: ${topic.author} on ${topic.created_at}`;
}

function createReplyArticle(reply) {
  const article = document.createElement('article');
  article.classList.add('list-group-item', 'mb-3');

  const p = document.createElement('p');
  p.textContent = reply.text;
  article.appendChild(p);

  const footer = document.createElement('footer');
  footer.textContent = `Posted by: ${reply.author} on ${reply.created_at}`;
  footer.classList.add('text-muted', 'mb-2');
  article.appendChild(footer);

  const btnDiv = document.createElement('div');
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.classList.add('delete-reply-btn', 'btn', 'btn-sm', 'btn-danger');
  deleteBtn.dataset.id = reply.id;
  btnDiv.appendChild(deleteBtn);

  article.appendChild(btnDiv);
  return article;
}

function renderReplies() {
  replyListContainer.innerHTML = '';
  currentReplies.forEach(reply => {
    const article = createReplyArticle(reply);
    replyListContainer.appendChild(article);
  });

  const lastReply = replyListContainer.lastChild;
  if (lastReply && typeof lastReply.scrollIntoView === 'function') {
    lastReply.scrollIntoView({ behavior: 'smooth' });
  }
}

async function handleAddReply(event) {
  event.preventDefault();
  const text = newReplyText.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`./api/index.php?action=reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: currentTopicId, author: 'Student', text })
    });
    const result = await res.json();
    if (result.success) {
      currentReplies.push(result.data);
      renderReplies();
      newReplyText.value = '';
    } else {
      alert(result.message || 'Failed to post reply.');
    }
  } catch (err) {
    console.error(err);
    alert('Error posting reply.');
  }
}

async function handleReplyListClick(event) {
  const target = event.target;
  if (target.classList.contains('delete-reply-btn')) {
    const id = parseInt(target.dataset.id);
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      const res = await fetch(`./api/index.php?action=delete_reply&id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        currentReplies = currentReplies.filter(r => r.id !== id);
        renderReplies();
      } else {
        alert(result.message || 'Failed to delete reply.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting reply.');
    }
  }
}

async function initializePage() {
  currentTopicId = getTopicIdFromURL();
  if (!currentTopicId) {
    topicSubject.textContent = 'Topic not found.';
    return;
  }

  try {
    const [topicRes, repliesRes] = await Promise.all([
      fetch(`./api/index.php?id=${currentTopicId}`),
      fetch(`./api/index.php?action=replies&topic_id=${currentTopicId}`)
    ]);
    const topicData   = await topicRes.json();
    const repliesData = await repliesRes.json();

    if (topicData.success) {
      renderOriginalPost(topicData.data);
      currentReplies = repliesData.success ? repliesData.data : [];
      renderReplies();
      replyForm.addEventListener('submit', handleAddReply);
      replyListContainer.addEventListener('click', handleReplyListClick);
    } else {
      topicSubject.textContent = 'Topic not found.';
    }
  } catch (err) {
    console.error(err);
    topicSubject.textContent = 'Error loading topic.';
  }
}

initializePage();
