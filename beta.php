<!DOCTYPE html>
<html lang="en">

<head>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php"); ?>
  <?php
  $release = "beta";
  $releaseName = "Beta";
  $releasePage = "";
  ?>
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css">
</head>

<body class="index-page beta-page">
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div class="releases">
    <div class="item"><a href="/player" title="Player"><svg class="large-icon" role="img" aria-label="Player"><use href="/icons.svg#player" /></svg></a></div>
    <div class="item"><a href="/visualizer" title="Visualizer"><svg class="large-icon" role="img" aria-label="Visualizer"><use href="/icons.svg#visualizer" /></svg></a></div>
    <div class="item"><a href="/bpm_circle" title="BPM Circle"><svg class="large-icon" role="img" aria-label="BPM Circle"><use href="/icons.svg#bpm_circle" /></svg></a></div>
    <div class="item"><a href="/bpm_curve" title="BPM Curve"><svg class="large-icon" role="img" aria-label="BPM Curve"><use href="/icons.svg#bpm_curve" /></svg></a></div>
    <div class="item"><a href="/circle_of_fifths" title="Circle Of Fifths"><svg class="large-icon" role="img" aria-label="Circle Of Fifths"><use href="/icons.svg#circle_of_fifths" /></svg></a></div>
    <div class="item"><a href="/drum_machine" title="Drum Machine"><svg class="large-icon" role="img" aria-label="Drum Machine"><use href="/icons.svg#drum_machine" /></svg></a></div>
    <div class="item"><a href="/reference" title="Reference"><svg class="large-icon" role="img" aria-label="Reference"><use href="/icons.svg#reference" /></svg></a></div>
    <div class="item"><a href="/tuner" title="Tuner"><svg class="large-icon" role="img" aria-label="Tuner"><use href="/icons.svg#tuner" /></svg></a></div>
    <div class="item"><a href="/notepad" title="Notepad"><svg class="large-icon" role="img" aria-label="Notepad"><use href="/icons.svg#notepad" /></svg></a></div>
    <div class="item"><a href="/audio_calculator" title="Audio Calculator"><svg class="large-icon" role="img" aria-label="Audio Calculator"><use href="/icons.svg#audio_calculator" /></svg></a></div>
    <div class="item"><a href="/piano" title="Piano"><svg class="large-icon" role="img" aria-label="Piano"><use href="/icons.svg#piano" /></svg></a></div>
    <div class="item"><a href="/icons" title="Icons"><svg class="large-icon" role="img" aria-label="Icons"><use href="/icons.svg#icons" /></svg></a></div>
  </div>

  <div class="standard padded border">
    <h1>
      <a href="/player" title="Player">Player - For playing audio.</a><br>
      <a href="/visualizer" title="Visualizer">Visualizer - For visualizing audio.</a><br>
      <a href="/bpm_circle" title="BPM Circle">BPM Circle - For visualizing tempo.</a><br>
      <a href="/bpm_curve" title="BPM Curve">BPM Curve - For creating tempo curves.</a><br>
      <a href="/circle_of_fifths" title="Circle Of Fifths">Circle Of Fifths - For exploring harmony.</a><br>
      <a href="/drum_machine" title="Drum Machine">Drum Machine - For making beats.</a><br>
      <a href="/reference" title="Reference">Reference - For looking up musical references.</a><br>
      <a href="/tuner" title="Tuner">Tuner - For tuning instruments.</a><br>
      <a href="/notepad" title="Notepad">Notepad - For writing notes.</a><br>
      <a href="/audio_calculator" title="Audio Calculator">Audio Calculator - For calculating audio values.</a><br>
      <a href="/piano" title="Piano">Piano - For playing piano.</a><br>
      <a href="/icons" title="Icons">Icons - For previewing and editing icons.</a>
    </h1>
  </div>

  <div class="index-site-info">
    <div class="index-pekosoft-logo">
      <a href="/" title="Pekosoft">
        <svg class="assets" viewBox="0 0 512 101.87" role="img" aria-label="Pekosoft"><use href="/assets.svg#logo" /></svg>
      </a>
    </div>
    <div>Tests and ideas - not for real use.</div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>