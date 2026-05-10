/*
  Requirement: Populate the "Course Assignments" list page.

  Instructions:
  1. This file is already linked to `list.html` via:
         <script src="list.js" defer></script>

  2. In `list.html`, the <section id="assignment-list-section"> is the
     container that this script populates.

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  Successful list response shape: { success: true, data: [ ...assignment objects ] }
  Each assignment object shape:
    {
      id:          number,   // integer primary key from the assignments table
      title:       string,
      due_date:    string,   // "YYYY-MM-DD" — matches the SQL column name
      description: string,
      files:       string[]  // already decoded array of URL strings
    }
*/

// --- Element Selections ---
// TODO: Select the section for the assignment list using its
//       id 'assignment-list-section'.
const assignmentListSection = document.getElementById('assignment-list-section');

// --- Functions ---

/**
 * TODO: Implement createAssignmentArticle.
 *
 * Parameters:
 *   assignment — one object from the API response with the shape:
 *     {
 *       id:          number,
 *       title:       string,
 *       due_date:    string,   // "YYYY-MM-DD" — use due_date, not dueDate
 *       description: string,
 *       files:       string[]
 *     }
 *
 * Returns:
 *   An <article> element matching the structure shown in list.html:
 *     <article>
 *       <h2>{title}</h2>
 *       <p>Due: {due_date}</p>
 *       <p>{description}</p>
 *       <a href="details.html?id={id}">View Details &amp; Discussion</a>
 *     </article>
 *
 * Important: the href MUST be "details.html?id=<id>" (integer id from
 * the assignments table) so that details.js can read the id from the URL.
 */
function createAssignmentArticle(assignment) {
  const article = document.createElement('article');

  const h2 = document.createElement('h2');
  h2.textContent = assignment.title;

  const dueDateP = document.createElement('p');
  dueDateP.textContent = 'Due: ' + assignment.due_date;

  const descriptionP = document.createElement('p');
  descriptionP.textContent = assignment.description;

  const link = document.createElement('a');
  link.href        = `details.html?id=${assignment.id}`;
  link.textContent = 'View Details & Discussion';

  article.appendChild(h2);
  article.appendChild(dueDateP);
  article.appendChild(descriptionP);
  article.appendChild(link);

  return article;
}

/**
 * TODO: Implement loadAssignments (async).
 *
 * It should:
 * 1. Use fetch() to GET data from './api/index.php'.
 *    The API returns JSON in the shape:
 *      { success: true, data: [ ...assignment objects ] }
 * 2. Parse the JSON response.
 * 3. Clear any existing content from the list section.
 * 4. Loop through the data array. For each assignment object:
 *    - Call createAssignmentArticle(assignment).
 *    - Append the returned <article> to the list section.
 */
async function loadAssignments() {
  try {
    const response = await fetch('./api/index.php');

    if (!response.ok) {
      const text = await response.text();
      console.error('API error response:', text);
      assignmentListSection.textContent = `Server error (${response.status}). Check the console for details.`;
      return;
    }

    const result = await response.json();

    if (!result.success) {
      assignmentListSection.textContent = result.message || 'Failed to load assignments.';
      return;
    }

    assignmentListSection.innerHTML = '';
    for (const assignment of result.data) {
      assignmentListSection.appendChild(createAssignmentArticle(assignment));
    }
  } catch (networkErr) {
    console.error('Network error:', networkErr);
    assignmentListSection.textContent = 'Could not connect to the server.';
  }
}

// --- Initial Page Load ---
loadAssignments();
