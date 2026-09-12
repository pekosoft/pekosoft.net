<?php
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!in_array($requestPath, ['/updates', '/updates.php'], true)) {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  $release = 'updates';
  $releaseName = 'Updates';
  $releasePage = '';
  $hideReleaseMenu = true;
  require($_SERVER['DOCUMENT_ROOT'] . '/elements/head.php');
  ?>
  <meta name="description" content="Pekosoft update history.">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . '/elements/toc.php'); ?>

  <div id="updates" class="standard padded border" aria-live="polite">
    <div id="updates-pagination" aria-label="Updates pagination">
      <button id="updates-previous-button" class="square" title="Previous updates" aria-label="Previous updates" disabled>
        <svg class="icons" role="img"><use href="/icons.svg#arrow_left"></use></svg>
      </button>
      <span id="updates-page">Page 1</span>
      <button id="updates-next-button" class="square" title="Next updates" aria-label="Next updates" disabled>
        <svg class="icons" role="img"><use href="/icons.svg#arrow_right"></use></svg>
      </button>
    </div>
    <div class="scrollable">
      <table id="updates-table" class="over scrollable-table">
        <thead>
          <tr>
            <th class="updates-col-number" title="Update number">#</th>
            <th class="updates-col-title" title="Update title">Title</th>
            <th class="updates-col-date" title="Update time">Date</th>
            <th class="updates-col-commit" title="Git commit">Commit</th>
          </tr>
        </thead>
        <tbody id="updates-runs">
          <tr><td colspan="4">Loading</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . '/elements/footer.php'); ?>
  <script src="/js/updates_page.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/updates_page.js'); ?>"></script>
</body>

</html>