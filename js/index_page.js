const actionsRunsElement = document.getElementById('github-actions-runs');

function formatActionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function getActionRunUrl(run) {
  if (run && run.head_sha) {
    return `https://github.com/pekosoft/pekosoft.net/commit/${run.head_sha}`;
  }

  return run && run.html_url ? run.html_url : '#';
}

function renderActionRuns(runs) {
  actionsRunsElement.innerHTML = '';

  runs.forEach((run) => {
    const item = document.createElement('div');
    item.className = 'index-action-item';

    const title = document.createElement('a');
    title.className = 'index-action-run';
    title.href = getActionRunUrl(run);
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    title.title = run.display_title || run.name || 'Workflow';
    title.dataset.statusLabel = title.title;
    title.textContent = run.display_title || run.name || 'Workflow';

    const date = document.createElement('span');
    date.className = 'index-action-date';
    date.textContent = formatActionDate(run.created_at);

    item.appendChild(title);
    item.appendChild(date);
    actionsRunsElement.appendChild(item);
  });
}

async function loadActionRuns() {
  try {
    const response = await fetch('https://api.github.com/repos/pekosoft/pekosoft.net/actions/runs?per_page=5', {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`GitHub Actions request failed: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.workflow_runs) || data.workflow_runs.length === 0) {
      throw new Error('No workflow runs found');
    }

    renderActionRuns(data.workflow_runs);
  } catch (error) {
    actionsRunsElement.textContent = 'Actions unavailable';
    console.warn('GitHub Actions could not be loaded:', error);
  }
}

if (actionsRunsElement) loadActionRuns();
