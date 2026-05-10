// --- Element Selections ---
const weekListSection = document.getElementById('week-list-section');

// --- Functions ---

function createWeekArticle(week) {
  const article = document.createElement('article');

  const title = document.createElement('h2');
  title.textContent = week.title;

  const date = document.createElement('p');
  date.textContent = "Starts on: " + week.start_date;

  const description = document.createElement('p');
  description.textContent = week.description;

  const link = document.createElement('a');
  link.href        = "details.html?id=" + week.id;
  link.textContent = "View Details & Discussion";

  article.appendChild(title);
  article.appendChild(date);
  article.appendChild(description);
  article.appendChild(link);

  return article;
}

async function loadWeeks() {
  try {
    const response = await fetch('./api/index.php');
    const result   = await response.json();

    if (result.success) {
      weekListSection.innerHTML = "";
      result.data.forEach(week => {
        const article = createWeekArticle(week);
        weekListSection.appendChild(article);
      });
    } else {
      weekListSection.innerHTML = "<p>Failed to load weeks.</p>";
    }
  } catch (error) {
    console.error("Failed to load weeks:", error);
    weekListSection.innerHTML = "<p>Error loading content. Please try again.</p>";
  }
}

// --- Initial Page Load ---
loadWeeks();
