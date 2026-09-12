<?php
header('Content-Type: application/json; charset=utf-8');

$cachePath = $_SERVER['DOCUMENT_ROOT'] . '/data/updates.json';
$updates = is_readable($cachePath) ? json_decode(file_get_contents($cachePath), true) : null;

if (!is_array($updates) || !isset($updates['workflow_runs']) || !is_array($updates['workflow_runs'])) {
  http_response_code(503);
  echo json_encode(['workflow_runs' => [], 'total_count' => 0]);
  exit;
}

$runs = $updates['workflow_runs'];
$totalCount = count($runs);
$runsPerPage = min(100, max(1, (int) ($_GET['per_page'] ?? 25)));
$page = max(1, (int) ($_GET['page'] ?? 1));

echo json_encode([
  'workflow_runs' => array_slice($runs, ($page - 1) * $runsPerPage, $runsPerPage),
  'total_count' => $totalCount
]);