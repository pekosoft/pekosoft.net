const updatesRunsElement = document.getElementById('updates-runs');
const previousButton = document.getElementById('updates-previous-button');
const nextButton = document.getElementById('updates-next-button');
const pageElement = document.getElementById('updates-page');
const runsPerPage = 25;
let currentPage = 1;
let totalPages = 1;
let totalRuns = 0;
let isLoading = false;

function formatUpdateDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function getUpdateUrl(run) {
  if (run && run.head_sha) {
    return `https://github.com/pekosoft/pekosoft.net/commit/${run.head_sha}`;
  }

  return run && run.html_url ? run.html_url : '#';
}

function renderUpdatesMessage(message) {
  updatesRunsElement.replaceChildren();

  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 4;
  cell.textContent = message;
  row.appendChild(cell);
  updatesRunsElement.appendChild(row);
}

function renderUpdates(runs) {
  updatesRunsElement.replaceChildren();

  runs.forEach((run, index) => {
    const row = document.createElement('tr');

    const numberCell = document.createElement('td');
    numberCell.className = 'updates-col-number';
    numberCell.textContent = String(totalRuns - (currentPage - 1) * runsPerPage - index);

    const title = document.createElement('a');
    title.className = 'index-action-run';
    title.href = getUpdateUrl(run);
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    title.title = run.display_title || run.name || 'Workflow';
    title.dataset.statusLabel = title.title;
    title.textContent = title.title;

    const titleCell = document.createElement('td');
    titleCell.className = 'updates-col-title';
    titleCell.appendChild(title);

    const dateCell = document.createElement('td');
    dateCell.className = 'updates-col-date';
    dateCell.textContent = formatUpdateDate(run.created_at);

    const commitCell = document.createElement('td');
    commitCell.className = 'updates-col-commit';
    commitCell.textContent = (run.head_sha || '-').slice(0, 7);

    row.append(numberCell, titleCell, dateCell, commitCell);
    updatesRunsElement.appendChild(row);
  });
}

function updatePagination() {
  previousButton.disabled = isLoading;
  nextButton.disabled = isLoading;
  pageElement.textContent = `Page ${currentPage} of ${totalPages}`;
}

async function loadUpdates(page = 1) {
  if (isLoading) return;

  isLoading = true;
  updatePagination();
  renderUpdatesMessage('Loading');

  try {
    const response = await fetch(`/updates_data.php?per_page=${runsPerPage}&page=${page}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Updates request failed: ${response.status}`);

    const data = await response.json();
    const runs = Array.isArray(data.workflow_runs) ? data.workflow_runs : [];
    totalRuns = Number(data.total_count) || runs.length;
    totalPages = Math.max(1, Math.ceil(totalRuns / runsPerPage));
    currentPage = Math.min(page, totalPages);

    if (runs.length === 0) throw new Error('No workflow runs found');
    renderUpdates(runs);
  } catch (error) {
    renderUpdatesMessage('Updates unavailable');
    console.warn('Updates could not be loaded:', error);
  } finally {
    isLoading = false;
    updatePagination();
  }
}

if (updatesRunsElement) {
  previousButton.addEventListener('click', () => loadUpdates(currentPage === 1 ? totalPages : currentPage - 1));
  nextButton.addEventListener('click', () => loadUpdates(currentPage === totalPages ? 1 : currentPage + 1));
  loadUpdates();
}