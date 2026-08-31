<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "notepad";
  $releaseName = "Notepad";
  $releasePage = "";
  $availableModules = ["tool"];
  ?>
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body border">
      <textarea id="Textarea" rows="20" cols="50"></textarea>
    </div>
    <div class="module-footer wrapper colored">

      <button id="notepad-speech-button" class="square" title="Speak text">
        <svg class="icons">
          <use href="/icons.svg#speech" />
        </svg>
        <span class="button-text">Speech</span>
      </button>

      <button id="notepad-download-button" class="square" title="Download text" disabled>
        <svg class="icons">
          <use href="/icons.svg#download" />
        </svg>
        <span class="button-text">Download</span>
      </button>

      <button id="notepad-clear-button" class="square" title="Clear text">
        <svg class="icons">
          <use href="/icons.svg#delete" />
        </svg>
        <span class="button-text">Clear</span>
      </button>

      <button id="notepad-copy-button" class="square" title="Copy text">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>

      <button id="notepad-paste-button" class="square" title="Paste text">
        <svg class="icons">
          <use href="/icons.svg#paste" />
        </svg>
        <span class="button-text">Paste</span>
      </button>

    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js"></script>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>