<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  $release = "dev";
  $releaseName = "Dev";
  $releasePage = "";
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  ?>
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <main class="standard padded border dev-controls">
    <div class="settings-toggle-row"><input type="checkbox" name="grid" id="grid" hidden><button type="button" data-setting-toggle="grid" data-help-release="index" data-help-entry="Grid" title="Background grid" class="toc-button"><svg class="icons"><use href="/icons.svg#grid" /></svg>Grid</button></div>
    <div class="setting-row">
      <label for="grid-size-value" data-help-release="index" title="Grid size" class="settings-control-label">Size:</label>
      <div class="knob-wrap"><input type="number" id="grid-size-value" data-help-release="index" class="knob-value" value="16" readonly><button id="settings-grid-size-knob" data-help-release="index" class="knob-control" type="button" title="Grid size" aria-label="Size"></button></div>
    </div>
    <div class="settings-toggle-row"><input type="checkbox" name="toggle-alpha" id="toggle-alpha" hidden><button type="button" data-setting-toggle="toggle-alpha" data-help-release="index" data-help-entry="Alpha" title="Alpha transparency" class="toc-button"><svg class="icons"><use href="/icons.svg#color_depth" /></svg>Alpha</button></div>
    <div class="setting-row background-image-row">
      <label for="background-image" data-help-release="index" title="Background image" class="settings-control-label">Background:</label>
      <button id="background-image-picker" data-help-release="index" data-help-entry="Background" class="background-image-picker icon-only" type="button" title="Choose background image">Choose bitmap</button>
      <input type="file" id="background-image" data-help-release="index" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" aria-label="Choose background image">
    </div>
  </main>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>
