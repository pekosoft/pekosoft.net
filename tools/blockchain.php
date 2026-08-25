<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "blockchain";
  $releaseName = "Blockchain";
  $releasePage = "";
  ?>
  <meta name="keywords" content="blockchain, bitcoin blockchain, bitcoin blocks, live blockchain, crypto">
  <link rel="stylesheet" type="text/css" href="/css/blockchain.css">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body chain-view border no-swipe">
      <div id="blockchain-chain"></div>
    </div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">
    <div class="module-body controls border">

      <div class="controls-buttons wrapper">

        <button id="refresh-button" class="square" title="Refresh blocks">
          <svg class="icons">
            <use href="/icons.svg#reset" />
          </svg>
          <span class="button-text">Refresh</span>
        </button>

        <button id="live-button" class="square button-on" title="Toggle live WebSocket updates">
          <svg class="icons">
            <use href="/icons.svg#play" />
          </svg>
          <span class="button-text">Live</span>
        </button>

      </div>

      <div class="controls-values wrapper">

        <div class="pair">
          <label>Status:</label>
          <div class="status-row">
            <span id="status-dot" data-status="connecting"></span>
            <span id="status-label">CONNECTING</span>
          </div>
        </div>

        <div class="pair">
          <label for="block-count-field" title="Number of recent blocks to display">Blocks:</label>
          <input type="number" id="block-count-field" min="5" max="50" step="1" value="10">
        </div>

        <div class="pair">
          <label for="block-height-field" title="Current best block height">Height:</label>
          <input type="number" id="block-height-field" readonly>
        </div>

        <div class="pair">
          <label for="mempool-tx-field" title="Unconfirmed transactions in mempool">Mempool:</label>
          <input type="number" id="mempool-tx-field" readonly>
        </div>

        <div class="pair">
          <label for="fee-economy-field" title="Economy fee rate (sat/vByte)">Economy:</label>
          <input type="number" step="1" id="fee-economy-field" readonly>
        </div>

        <div class="pair">
          <label for="fee-hour-field" title="Target 1-hour confirmation fee (sat/vByte)">1h fee:</label>
          <input type="number" step="1" id="fee-hour-field" readonly>
        </div>

        <div class="pair">
          <label for="fee-halfhour-field" title="Target 30-minute confirmation fee (sat/vByte)">30m fee:</label>
          <input type="number" step="1" id="fee-halfhour-field" readonly>
        </div>

        <div class="pair">
          <label for="fee-fastest-field" title="Next-block confirmation fee (sat/vByte)">Fast fee:</label>
          <input type="number" step="1" id="fee-fastest-field" readonly>
        </div>

      </div>

    </div>
  </div>

  <!-- TIMELINE -->

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <canvas id="blockchain-timeline"></canvas>
    </div>
    <div class="module-footer wrapper colored"></div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="blockchain-panel" spellcheck="false" readonly placeholder="Click a block above to see its details here."></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="copy-button" class="square" title="Copy data">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/blockchain.js"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>

</body>

</html>
