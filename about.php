<?php
if (isset($_GET['t']) && !is_string($_GET['t'])) {
  http_response_code(400);
  exit('Invalid release parameter.');
}
$requestedRelease = isset($_GET['t']) ? basename($_GET['t']) : '';
if (in_array($requestedRelease, ['settings', 'contact'], true)) {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}
if ($requestedRelease !== '' && !is_file($_SERVER['DOCUMENT_ROOT'] . "/about/$requestedRelease.txt")) {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}
$release = isset($_GET['t']) ? $requestedRelease : 'default';
$textFile = $_SERVER['DOCUMENT_ROOT'] . "/about/$release.txt";
$lines = [];
if (file_exists($textFile)) {
  set_error_handler(static function ($severity, $message) {
    error_log('About: ' . $message);
    return true;
  }, E_WARNING);
  try {
    $lines = file($textFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  } finally {
    restore_error_handler();
  }
  if ($lines === false) {
    require($_SERVER['DOCUMENT_ROOT'] . '/500.php');
    exit;
  }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/release_type.php");
  $releaseName = getReleaseTitle($release);
  $releasePage = "About";
  $footerPath = isBetaRelease($release) ? "/elements/beta_footer.php" : "/elements/footer.php";
  $toolPages = ["tap_pad.php", "bpm_calculator.php", "metronome.php", "turntable.php", "bpm_circle.php", "bpm_curve.php", "circle_of_fifths.php", "drum_machine.php", "player.php", "piano.php", "audio_calculator.php", "icons.php", "tuner.php", "visualizer.php", "reference.php", "notepad.php"];
  $releaseFile = $release . ".php";
  $releaseHref = is_file($_SERVER['DOCUMENT_ROOT'] . "/tools/" . $releaseFile) ? "/" . $release : "/" . $releaseFile;
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

    <div class="three-columns column-middle-about colored">
      <a href="<?php echo $releaseHref; ?>">
        <svg class="large-icon" role="img" aria-label="<?php echo htmlspecialchars($releaseName); ?>" title="<?php echo htmlspecialchars($releaseName); ?>">
            <use href="/icons.svg#<?php echo $release; ?>" />
        </svg>
      </a>
      <?php if (count($lines) >= 4): ?>
        <h1 class="release-header">
          Version: <?php echo htmlspecialchars($lines[2]); ?>.
          Released: <?php echo htmlspecialchars($lines[3]); ?>.
        </h1>
      <?php endif; ?>
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
