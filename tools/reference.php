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
  <meta name="keywords" content="bpm reference, Italian tempi, note frequency chart, scale reference, chord reference, metric prefixes, SI prefixes, powers of ten, cable reference, USB, HDMI, DisplayPort, Thunderbolt, audio cables">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container one-module-tool">
    <div class="module-body standard border scrollable">
      <div class="controls-buttons wrapper module-tabs">
        <button id="table-bpm-button" class="square" title="BPM" data-module-tab="BPM">
          <svg class="icons">
            <use href="/icons.svg#bpm" />
          </svg>
          <span class="button-text">BPM</span>
        </button>

        <button id="table-tempi-button" class="square" title="Italian tempi" data-module-tab="Italian Tempi">
          <svg class="icons">
            <use href="/icons.svg#italy" />
          </svg>
          <span class="button-text">Tempi</span>
        </button>

        <button id="table-notes-button" class="square" title="Notes" data-module-tab="Notes">
          <svg class="icons">
            <use href="/icons.svg#piano" />
          </svg>
          <span class="button-text">Notes</span>
        </button>

        <button id="table-scales-button" class="square" title="Scales" data-module-tab="Scales">
          <svg class="icons">
            <use href="/icons.svg#timeline" />
          </svg>
          <span class="button-text">Scales</span>
        </button>

        <button id="table-chords-button" class="square" title="Chords" data-module-tab="Chords">
          <svg class="icons">
            <use href="/icons.svg#value" />
          </svg>
          <span class="button-text">Chords</span>
        </button>

        <button id="table-prefixes-button" class="square" title="Metric prefixes" data-module-tab="Metric Prefixes">
          <svg class="icons">
            <use href="/icons.svg#formula" />
          </svg>
          <span class="button-text">Prefixes</span>
        </button>

        <button id="table-cables-button" class="square" title="Cables" data-module-tab="Cables">
          <svg class="icons">
            <use href="/icons.svg#connector" />
          </svg>
          <span class="button-text">Cables</span>
        </button>
      </div>

      <div class="reference-content-scroll">
        <table class="over scrollable-table">
          <thead>
            <tr id="header-row"></tr>
          </thead>
          <tbody id="resultTable">
            <!-- Values will be displayed here -->
          </tbody>
        </table>

        <div id="cards-view" class="reference-cards-view hidden" aria-live="polite"></div>
      </div>

      <div id="reference-tool-menu-controls" class="module-panel-menu" hidden>
        <fieldset class="module-panel-menu-row reference-column-buttons">
          <legend class="module-panel-menu-label" title="Columns">Columns:</legend>
          <div class="module-panel-menu-buttons">
            <?php
            $columnIcons = ['bpm', 'text', 'plus_minus', 'triangle_down', 'triangle_up', 'triplet', '1_4_dotted', 'clock', 'pulse', 'play'];
            for ($columnNumber = 1; $columnNumber <= 18; $columnNumber++) {
              $columnIcon = $columnIcons[$columnNumber - 1] ?? 'asterisk';
            ?>
            <button id="toggle-col-<?php echo $columnNumber; ?>-button" class="square" title="Toggle column <?php echo $columnNumber; ?>"<?php echo $columnNumber > 10 ? ' hidden' : ''; ?>>
              <svg class="icons">
                <use href="/icons.svg#<?php echo $columnIcon; ?>" />
              </svg>
              <span id="toggle-col-<?php echo $columnNumber; ?>-text" class="button-text">COL <?php echo $columnNumber; ?></span>
            </button>
            <?php } ?>
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
  <script src="/js/tempi.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/tempi.js'); ?>"></script>
  <script src="/js/cables.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/cables.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>
