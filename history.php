<?php
$requestedRelease = isset($_GET['t']) ? basename((string) $_GET['t']) : '';
if ($requestedRelease === 'settings') {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php"); ?>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/release_type.php");
  $release = isset($_GET['t']) ? basename($_GET['t']) : 'default'; // Fallback to 'default' if not provided
  $releaseName = getReleaseTitle($release);
  $releasePage = "History";

  $filePath = $_SERVER['DOCUMENT_ROOT'] . "/history/" . $release . ".txt";
  $footerPath = isBetaRelease($release) ? "/elements/beta_footer.php" : "/elements/footer.php";

  function isMajorVersion($version)
  {
    $version = trim($version);
    $parts = explode('.', $version);
    if (count($parts) === 1) {
      return true;
    }
    $minorAndBeyond = implode('', array_slice($parts, 1));
    return preg_match('/^0+$/', $minorAndBeyond) === 1;
  }
  ?>
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div class="three-columns-container">
    <div class="three-columns column-sides column-left hide-on-medium-screen">
      <svg class="speaker" viewBox="0 0 256 512" role="img">
        <use href="/assets.svg#speaker" />
      </svg>
    </div>

    <div class="three-columns column-middle justify">
      <?php
      if (file_exists($filePath)) {
        $historyContent = file_get_contents($filePath);
        $pattern = '/<h1>\s*([^\r\n<]+)\s*[\r\n]+\s*([^\r\n<]+)\s*<\/h1>\s*(.*?)(?=(?:<h1>|$))/si';

        if (preg_match_all($pattern, $historyContent, $entries, PREG_SET_ORDER)) {
          echo "<div class='history-list'>";

          foreach ($entries as $entry) {
            $version = trim(strip_tags($entry[1]));
            $date = trim(strip_tags($entry[2]));
            $body = trim($entry[3]);
            $entryClass = isMajorVersion($version) ? 'border history-major' : 'module history-minor';

            echo "<div class='feature-row history-entry {$entryClass}'>";
            echo "<div class='history-version-circle' aria-hidden='true'>" . htmlspecialchars($version, ENT_QUOTES, 'UTF-8') . "</div>";
            echo "<div class='justify history-entry-content'>";
            echo "<h1><span class='history-heading-version'>Version " . htmlspecialchars($version, ENT_QUOTES, 'UTF-8') . "</span><span class='history-heading-date'>" . htmlspecialchars($date, ENT_QUOTES, 'UTF-8') . "</span></h1>";
            if ($body !== '') {
              echo "<div class='history-text'>" . nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8')) . "</div>";
            }
            echo "</div>";
            echo "</div>";
          }

          echo "</div>";
        } else {
          echo nl2br(htmlspecialchars($historyContent, ENT_QUOTES, 'UTF-8'));
        }
      } else {
        echo "<p>History content not found for this release.</p>";
      }
      ?>
    </div>

    <div class="three-columns column-sides column-right hide-on-medium-screen">
      <svg class="speaker" viewBox="0 0 256 512" role="img">
        <use href="/assets.svg#speaker" />
      </svg>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . $footerPath); ?>

</body>

</html>