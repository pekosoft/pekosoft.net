const actionsRunsElement = document.getElementById('github-actions-runs');

function formatActionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function renderActionRuns(runs) {
  actionsRunsElement.innerHTML = '';

  runs.forEach((run) => {
    const row = document.createElement('a');
    row.className = 'index-action-run';
    row.href = run.html_url;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';
    row.textContent = `${run.display_title || run.name || 'Workflow'} - ${run.head_branch || '-'} | ${run.event || '-'} | ${formatActionDate(run.created_at)}`;
    actionsRunsElement.appendChild(row);
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
