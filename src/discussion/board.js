// --- Global Data Store ---
let topics = [];

// --- Element Selections ---
const newTopicForm = document.getElementById('new-topic-form');
const topicListContainer = document.getElementById('topic-list-container');

// --- Functions ---

// Create an <article> for a topic
function createTopicArticle(topic) {
  const article = document.createElement('article');
  article.classList.add('list-group-item', 'mb-3');

  // Heading with link
  const h3 = document.createElement('h3');
  const link = document.createElement('a');
  link.href = `topic.html?id=${topic.id}`;
  link.textContent = topic.subject;
  h3.appendChild(link);
  article.appendChild(h3);

  // Footer with metadata
  const footer = document.createElement('footer');
  footer.textContent = `Posted by: ${topic.author} on ${topic.created_at}`;
  article.appendChild(footer);

  // Action buttons
  const btnDiv = document.createElement('div');

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.classList.add('edit-btn', 'btn', 'btn-sm', 'btn-secondary', 'me-2');
  editBtn.dataset.id = topic.id;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.classList.add('delete-btn', 'btn', 'btn-sm', 'btn-danger');
  deleteBtn.dataset.id = topic.id;

  btnDiv.appendChild(editBtn);
  btnDiv.appendChild(deleteBtn);
  article.appendChild(btnDiv);

  return article;
}

// Render all topics
function renderTopics() {
  topicListContainer.innerHTML = '';
  topics.forEach(topic => {
    const article = createTopicArticle(topic);
    topicListContainer.appendChild(article);
  });
}

// Handle form submit (create or update topic)
async function handleCreateTopic(event) {
  event.preventDefault();

  const subjectInput = document.getElementById('topic-subject');
  const messageInput = document.getElementById('topic-message');
  const submitBtn = document.getElementById('create-topic');

  const subject = subjectInput.value.trim();
  const message = messageInput.value.trim();
  if (!subject || !message) return;

  // Check if we are updating an existing topic
  const editId = submitBtn.dataset.editId;

  if (editId) {
    // Update existing topic
    await handleUpdateTopic(parseInt(editId), { subject, message });

    // Reset form
    subjectInput.value = '';
    messageInput.value = '';
    submitBtn.textContent = 'Create Topic';
    delete submitBtn.dataset.editId;
  } else {
    // Create new topic
    try {
      const res = await fetch('./api/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, author: 'Student' })
      });
      const result = await res.json();

      if (result.success) {
        // Add new topic to global array
        const newTopic = { id: result.id, subject, message, author: 'Student', created_at: new Date().toISOString().slice(0,19).replace('T',' ') };
        topics.push(newTopic);
        renderTopics();

        // Reset form
        subjectInput.value = '';
        messageInput.value = '';
      } else {
        alert('Failed to create topic');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating topic');
    }
  }
}

// Update existing topic
async function handleUpdateTopic(id, fields) {
  try {
    const res = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields })
    });
    const result = await res.json();

    if (result.success) {
      const index = topics.findIndex(t => t.id === id);
      if (index !== -1) {
        topics[index] = { ...topics[index], ...fields };
        renderTopics();
      }
    } else {
      alert('Failed to update topic');
    }
  } catch (err) {
    console.error(err);
    alert('Error updating topic');
  }
}

// Handle clicks on the topic list (edit/delete)
async function handleTopicListClick(event) {
  const target = event.target;
  if (target.classList.contains('delete-btn')) {
    const id = parseInt(target.dataset.id);
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const res = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
      const result = await res.json();

      if (result.success) {
        topics = topics.filter(t => t.id !== id);
        renderTopics();
      } else {
        alert('Failed to delete topic');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting topic');
    }

  } else if (target.classList.contains('edit-btn')) {
    const id = parseInt(target.dataset.id);
    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    document.getElementById('topic-subject').value = topic.subject;
    document.getElementById('topic-message').value = topic.message;

    const submitBtn = document.getElementById('create-topic');
    submitBtn.textContent = 'Update Topic';
    submitBtn.dataset.editId = id;
  }
}

// Load all topics from API and initialize event listeners
async function loadAndInitialize() {
  try {
    const res = await fetch('./api/index.php');
    const result = await res.json();

    if (result.success) {
      topics = result.data;
      renderTopics();

      // Attach event listeners
      newTopicForm.addEventListener('submit', handleCreateTopic);
      topicListContainer.addEventListener('click', handleTopicListClick);
    } else {
      alert('Failed to load topics');
    }
  } catch (err) {
    console.error(err);
    alert('Error loading topics');
  }
}

// Initial Page Load
loadAndInitialize();
