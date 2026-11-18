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
  <meta name="keywords" content="Pekosoft, BPM, BPM software, audio software, audio web apps, audio web tools, free online audio tools">
  <meta name="description" content="Free online audio tools.">
</head>

<body class="index-page">
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div class="standard border index-demo">
    <iframe src="/demo?embedded=1" title="Pekosoft demo" allowfullscreen></iframe>
  </div>

  <div class="releases">

    <div class="item">
      <a href="/tap_pad" title="Tap Pad">
        <svg class="large-icon" aria-hidden="true">
          <use href="/icons.svg#tap_pad" />
        </svg>
        <h1>Tap Pad</h1>
      </a>
      <p>For tapping tempo.</p>
    </div>

    <div class="item">
      <a href="/bpm_calculator" title="BPM Calculator">
        <svg class="large-icon" aria-hidden="true">
          <use href="/icons.svg#bpm_calculator" />
        </svg>
        <h1>BPM Calculator</h1>
      </a>
      <p>For tempo calculations.</p>
    </div>

    <div class="item">
      <a href="/metronome" title="Metronome">
        <svg class="large-icon" aria-hidden="true">
          <use href="/icons.svg#metronome" />
        </svg>
        <h1>Metronome</h1>
      </a>
      <p>For keeping time.</p>
    </div>

    <div class="item">
      <a href="/turntable" title="Turntable">
        <svg class="large-icon" aria-hidden="true">
          <use href="/icons.svg#turntable" />
        </svg>
        <h1>Turntable</h1>
      </a>
      <p>For visualizing RPM.</p>
    </div>

  </div>

  <div class="index-site-info border">
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

    <div>Copyright &copy; <a href="https://pekosoft.net">Pekosoft</a>. All rights reserved.</div>
    <div>Produced at <a href="https://focusstudios.no">Focus Studios</a> by <a href="https://peko.net">Ole Peko Sørensen</a>.</div>

    <div class="index-focus">
      <a href="https://focusstudios.no" title="Focus Studios" aria-label="Focus Studios">
        <svg viewBox="0 0 512 136.262" role="img" aria-label="Focus Studios" class="assets">
          <use href="/assets.svg#focus-studios"></use>
        </svg>
      </a>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>
