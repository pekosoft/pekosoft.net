<?php
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!in_array($requestPath, ['/', '/index.php'], true)) {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "index";
  $releaseName = "Pekosoft";
  $releasePage = "";
  ?>
  <meta name="keywords" content="Pekosoft, BPM, BPM software, BPM experiments, audio software, audio web apps, audio web tools, online audio tools">
  <meta name="description" content="Official website for the experimental audio software company Pekosoft.">
</head>

<body class="index-page">
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div class="releases">

    <div class="item">
      <a href="/tap_pad" title="Tap Pad">
        <svg class="large-icon" role="img" aria-label="Tap Pad">
          <use href="/icons.svg#tap_pad" />
        </svg>
      </a>
    </div>

    <div class="item">
      <a href="/bpm_calculator" title="BPM Calculator">
        <svg class="large-icon" role="img" aria-label="BPM Calculator">
          <use href="/icons.svg#bpm_calculator" />
        </svg>
      </a>
    </div>

    <div class="item">
      <a href="/metronome" title="Metronome">
        <svg class="large-icon" role="img" aria-label="Metronome">
          <use href="/icons.svg#metronome" />
        </svg>
      </a>
    </div>

    <div class="item">
      <a href="/turntable" title="Turntable">
        <svg class="large-icon" role="img" aria-label="Turntable">
          <use href="/icons.svg#turntable" />
        </svg>
      </a>
    </div>

  </div>

  <div class="standard padded border">
    <h1>
      <a href="/tap_pad" title="Tap Pad">Tap Pad - For tapping tempo.</a><br>

      <a href="/bpm_calculator" title="BPM Calculator">BPM Calculator - For tempo calculations.</a><br>

      <a href="/metronome" title="Metronome">Metronome - For keeping time.</a><br>

      <a href="/turntable" title="Turntable">Turntable - For visualizing RPM.</a>
    </h1>

  </div>

  <div id="github-actions" class="standard padded border" aria-live="polite">
    <h1>Latest updates</h1>
    <div id="github-actions-runs">Loading</div>
  </div>

  <div class="index-site-info">
    <div class="index-socials">
      <a href="https://github.com/pekosoft" title="GitHub">
        <svg class="icons" role="img" aria-label="GitHub"><use href="/icons.svg#github"></use></svg>
      </a>
      <a href="https://facebook.com/pekosoft" title="Facebook">
        <svg class="icons" role="img" aria-label="Facebook"><use href="/icons.svg#facebook"></use></svg>
      </a>
      <a href="https://instagram.com/pekosoft" title="Instagram">
        <svg class="icons" role="img" aria-label="Instagram"><use href="/icons.svg#instagram"></use></svg>
      </a>
    </div>

    <div class="index-pekosoft-logo">
      <a href="/" title="Pekosoft">
        <svg class="assets" viewBox="0 0 512 101.87" role="img" aria-label="Pekosoft"><use href="/assets.svg#logo" /></svg>
      </a>
    </div>
    <div>Copyright &copy; <a href="https://pekosoft.net">Pekosoft</a>. All rights reserved.</div>
    <div>Produced at <a href="https://focusstudios.no">Focus Studios</a> by <a href="https://peko.net">Ole Peko Sørensen</a>.</div>

    <div class="index-focus">
      <a href="https://focusstudios.no">
        <svg viewBox="0 0 512 136.262" role="img" aria-label="Focus Studios" title="Focus Studios" class="assets">
          <use href="/assets.svg#focus-studios"></use>
        </svg>
      </a>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
  <script src="/js/index_page.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/index_page.js'); ?>"></script>
</body>

</html>