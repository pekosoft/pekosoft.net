<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "reference";
  $releaseName = "Reference";
  $releasePage = "";
  $availableModules = ["tool"];
  ?>
  <meta name="keywords" content="bpm reference, note frequency chart, scale reference, chord reference">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container one-module-tool">
    <div class="module-body standard border scrollable">
      <div class="controls-buttons wrapper">
        <button id="table-bpm-button" class="square" title="Show BPM">
          <svg class="icons">
            <use href="/icons.svg#bpm_compare" />
          </svg>
          <span class="button-text">BPM</span>
        </button>

        <button id="table-notes-button" class="square" title="Show Notes">
          <svg class="icons">
            <use href="/icons.svg#piano" />
          </svg>
          <span class="button-text">Notes</span>
        </button>

        <button id="table-scales-button" class="square" title="Show Scales">
          <svg class="icons">
            <use href="/icons.svg#timeline" />
          </svg>
          <span class="button-text">Scales</span>
        </button>

        <button id="table-chords-button" class="square" title="Show Chords">
          <svg class="icons">
            <use href="/icons.svg#value" />
          </svg>
          <span class="button-text">Chords</span>
        </button>
      </div>

      <table class="over scrollable-table">
        <thead>
          <tr id="header-row"></tr>
        </thead>
        <tbody id="resultTable">
          <!-- Values will be displayed here -->
        </tbody>
      </table>

      <div id="cards-view" class="reference-cards-view hidden" aria-live="polite"></div>

      <div id="reference-tool-menu-controls" class="module-panel-menu" hidden>
        <fieldset class="module-panel-menu-row reference-column-buttons">
          <legend class="module-panel-menu-label" title="Columns">Columns:</legend>
          <div class="module-panel-menu-buttons">
        <button id="toggle-col-1-button" class="square" title="Toggle first column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-1-text" class="button-text">COL 1</span>
        </button>

        <button id="toggle-col-2-button" class="square" title="Toggle second column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-2-text" class="button-text">COL 2</span>
        </button>

        <button id="toggle-col-3-button" class="square" title="Toggle third column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-3-text" class="button-text">COL 3</span>
        </button>

        <button id="toggle-col-4-button" class="square" title="Toggle fourth column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-4-text" class="button-text">COL 4</span>
        </button>

        <button id="toggle-col-5-button" class="square" title="Toggle fifth column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-5-text" class="button-text">COL 5</span>
        </button>

        <button id="toggle-col-6-button" class="square" title="Toggle sixth column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-6-text" class="button-text">COL 6</span>
        </button>

        <button id="toggle-col-7-button" class="square" title="Toggle seventh column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-7-text" class="button-text">COL 7</span>
        </button>

        <button id="toggle-col-8-button" class="square" title="Toggle eighth column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-8-text" class="button-text">COL 8</span>
        </button>

        <button id="toggle-col-9-button" class="square" title="Toggle ninth column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-9-text" class="button-text">COL 9</span>
        </button>

        <button id="toggle-col-10-button" class="square" title="Toggle tenth column">
          <svg class="icons">
            <use href="/icons.svg#asterisk" />
          </svg>
          <span id="toggle-col-10-text" class="button-text">COL 10</span>
        </button>
          </div>
        </fieldset>
      </div>
    </div>

    <div class="module-footer wrapper colored reference-tool-footer">
      <button id="toggle-view-button" class="square" title="Toggle standard or cards view" aria-pressed="false">
        <svg class="icons">
          <use href="/icons.svg#view_list" />
        </svg>
        <span id="toggle-view-text" class="button-text">VIEW</span>
      </button>

      <button id="toggle-sort-button" class="square" title="Sort: Ascending" aria-pressed="false">
        <svg class="icons">
          <use href="/icons.svg#arrow_up_down" />
        </svg>
        <span id="toggle-sort-text" class="button-text">SORT</span>
      </button>

      <button id="reset-button" class="square" title="Reset to default">
        <svg class="icons">
          <use href="/icons.svg#reset" />
        </svg>
        <span class="button-text">Reset</span>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/audio.js"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>