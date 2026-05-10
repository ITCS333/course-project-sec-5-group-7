const API_URL = './api/index.php';

// --- Element Selections ---
const weekForm     = document.getElementById('week-form');
const addWeekButton = document.getElementById('add-week');
const weeksTbody   = document.getElementById('weeks-tbody');

// --- Global Data Store ---
let weeks = [];

// --- Functions ---

function createWeekRow(week) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${week.title}</td>
    <td>${week.start_date}</td>
    <td>${week.description}</td>
    <td>
      <button class="edit-btn"   data-id="${week.id}">Edit</button>
      <button class="delete-btn" data-id="${week.id}">Delete</button>
    </td>
  `;
  return row;
}

function renderTable() {
  weeksTbody.innerHTML = '';
  for (const week of weeks) {
    const row = createWeekRow(week);
    weeksTbody.appendChild(row);
  }
}

async function handleAddWeek(event) {
  event.preventDefault();

  const title       = document.getElementById('week-title').value.trim();
  const start_date  = document.getElementById('week-start-date').value;
  const description = document.getElementById('week-description').value.trim();
  const links       = document.getElementById('week-links').value
                        .split('\n')
                        .map(l => l.trim())
                        .filter(l => l !== '');

  const fields = { title, start_date, description, links };

  const editId = addWeekButton.dataset.editId;

  if (editId) {
    await handleUpdateWeek(parseInt(editId), fields);
  } else {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });

    const result = await response.json();

    if (result.success) {
      weeks.push({ id: result.id, ...fields });
      renderTable();
      weekForm.reset();
    }
  }
}

async function handleUpdateWeek(id, fields) {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...fields })
  });

  const result = await response.json();

  if (result.success) {
    weeks = weeks.map(week =>
      week.id === id ? { id, ...fields } : week
    );
    renderTable();
    weekForm.reset();
    addWeekButton.textContent = 'Add Week';
    delete addWeekButton.dataset.editId;
  }
}

async function handleTableClick(event) {
  if (event.target.classList.contains('delete-btn')) {
    const id = parseInt(event.target.dataset.id);

    const response = await fetch(`${API_URL}?id=${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      weeks = weeks.filter(week => week.id !== id);
      renderTable();
    }
  }

  if (event.target.classList.contains('edit-btn')) {
    const id   = parseInt(event.target.dataset.id);
    const week = weeks.find(w => w.id === id);

    if (week) {
      document.getElementById('week-title').value       = week.title;
      document.getElementById('week-start-date').value  = week.start_date;
      document.getElementById('week-description').value = week.description;
      document.getElementById('week-links').value       = week.links.join('\n');
      addWeekButton.textContent    = 'Update Week';
      addWeekButton.dataset.editId = id;
    }
  }
}

async function loadAndInitialize() {
  const response = await fetch(API_URL);
  const result   = await response.json();

  if (result.success) {
    weeks = result.data;
    renderTable();
    weekForm.addEventListener('submit', handleAddWeek);
    weeksTbody.addEventListener('click', handleTableClick);
  }
}

// --- Initial Page Load ---
loadAndInitialize();
