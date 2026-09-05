<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "icons";
  $releaseName = "Icons";
  $releasePage = "";
  ?>
  <meta name="keywords" content="icons">
  <link rel="stylesheet" type="text/css" href="/css/<?php echo $release; ?>.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/' . $release . '.css'); ?>">
</head>

<body class="layout-tight-footer">
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <!-- TOOL -->

  <div id="tool-container" class="container">
    <div class="module-body preview-wrapper standard colored border">
      <div class="preview-stage">
        <div class="preview-canvas">
          <svg id="preview-grid-overlay" class="preview-grid-overlay" viewBox="0 0 512 512" preserveAspectRatio="none" aria-hidden="true"></svg>
          <svg id="preview-icon" class="preview-icon">
          </svg>
          <svg id="preview-guides" class="preview-guides" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <circle class="guide-circle" cx="256" cy="256" r="256" />
            <circle class="guide-circle" cx="256" cy="256" r="128" />
            <circle class="guide-circle" cx="256" cy="256" r="64" />
            <circle class="guide-circle" cx="256" cy="256" r="32" />
          </svg>
        </div>
        <div id="preview-rulers" class="preview-rulers" aria-hidden="true">
          <div class="preview-ruler preview-ruler-top"></div>
          <div class="preview-ruler preview-ruler-left"></div>
          <div class="preview-ruler preview-ruler-right"></div>
          <div class="preview-ruler preview-ruler-bottom"></div>
        </div>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="rulers-button" class="square" title="Toggle preview rulers">
        <svg class="icons">
          <use href="/icons.svg#ruler" />
        </svg>
        <span class="button-text">Rulers</span>
      </button>

      <button id="grid-button" class="square" title="Toggle preview grid">
        <svg class="icons">
          <use href="/icons.svg#guides" />
        </svg>
        <span class="button-text">Grid</span>
      </button>

      <button id="radius-button" class="square" title="Toggle preview radius">
        <svg class="icons">
          <use href="/icons.svg#crosshair" />
        </svg>
        <span class="button-text">Radius</span>
      </button>
    </div>
  </div>

  <!-- CONTROLS -->

  <div id="controls-container" class="container">

    <div class="module-body controls border">

    <div class="controls-buttons wrapper">

      <button id="prev-button" class="square" title="Previous icon">
        <svg class="icons">
          <use href="/icons.svg#skip_left" />
        </svg>
        <span class="button-text">Prev</span>
      </button>

      <button id="play-button" class="square" title="Toggle play">
        <svg class="icons">
          <use href="/icons.svg#play" />
        </svg>
        <span class="button-text">Play</span>
      </button>

      <button id="next-button" class="square" title="Next icon">
        <svg class="icons">
          <use href="/icons.svg#skip_right" />
        </svg>
        <span class="button-text">Next</span>
      </button>

      <button id="reverse-button" class="square" title="Toggle playback direction">
        <svg class="icons">
          <use href="/icons.svg#reverse" />
        </svg>
        <span class="button-text">Reverse</span>
      </button>

      <button id="open-button" class="square" title="Open SVG file">
        <svg class="icons">
          <use href="/icons.svg#eject" />
        </svg>
        <span class="button-text">Open</span>
      </button>

      <input type="file" id="open-file-input" accept=".svg,image/svg+xml" hidden>

      <button id="save-button" class="square" title="Download current icon as SVG">
        <svg class="icons">
          <use href="/icons.svg#download" />
        </svg>
        <span class="button-text">Download SVG</span>
      </button>

      <button id="save-png-button" class="square" title="Download current icon as PNG">
        <svg class="icons">
          <use href="/icons.svg#photo" />
        </svg>
        <span class="button-text">Download PNG</span>
      </button>

      <button id="reset-button" class="square" title="Reset to default">
        <svg class="icons">
          <use href="/icons.svg#reset" />
        </svg>
        <span class="button-text">Reset</span>
      </button>

    </div>

    <div class="controls-values wrapper">

      <div class="pair">
        <label for="icons-field" title="Number of icons">Icons:</label>
        <input type="number" id="icons-field" readonly>
      </div>

      <div class="pair">
        <label for="bytes-field" title="Total kilo bytes">KB:</label>
        <input type="number" id="bytes-field" readonly>
      </div>

      <div class="pair">
        <label for="name-field" title="Symbol name">Name:</label>
        <input type="text" id="name-field" readonly>
      </div>

      <div class="pair">
        <label for="grid-size-field" title="Preview grid size">Grid:</label>
        <input type="number" id="grid-size-field" min="8" max="256" step="8">
      </div>

      <div class="pair">
        <label for="speed-field" title="Playback speed">Speed:</label>
        <input type="number" id="speed-field" min="25" max="200" step="1">
      </div>

      <div class="pair">
        <label for="search-field" title="Filter icons by ID">Search:</label>
        <input type="text" id="search-field">
      </div>

    </div>

    <div class="controls-buttons wrapper">

      <button id="rotate-button" class="square" title="Rotate left">
        <svg class="icons">
          <use href="/icons.svg#rotate" />
        </svg>
        <span class="button-text">Rotate</span>
      </button>

      <button id="center-button" class="square" title="Center selected elements">
        <svg class="icons">
          <use href="/icons.svg#asterisk" />
        </svg>
        <span class="button-text">Center</span>
      </button>

      <button id="select-all-button" class="square" title="Select all">
        <svg class="icons">
          <use href="/icons.svg#select_all" />
        </svg>
        <span class="button-text">Select All</span>
      </button>

      <button id="select-none-button" class="square" title="Select none">
        <svg class="icons">
          <use href="/icons.svg#select_none" />
        </svg>
        <span class="button-text">Select None</span>
      </button>

      <button id="resize-button" class="square" title="Resize">
        <svg class="icons">
          <use href="/icons.svg#resize" />
        </svg>
        <span class="button-text">Resize</span>
      </button>

      <button id="draw-button" class="square" title="Draw tool">
        <svg class="icons">
          <use href="/icons.svg#pen" />
        </svg>
        <span class="button-text">Draw</span>
      </button>

      <button id="rectangle-button" class="square" title="Rectangle tool">
        <svg class="icons">
          <use href="/icons.svg#rectangle" />
        </svg>
        <span class="button-text">Rectangle</span>
      </button>

      <button id="rectangle-outline-button" class="square" title="Outlined rectangle tool">
        <svg class="icons">
          <use href="/icons.svg#square" />
        </svg>
        <span class="button-text">Rect Out</span>
      </button>

      <button id="circle-button" class="square" title="Circle tool">
        <svg class="icons">
          <use href="/icons.svg#circle" />
        </svg>
        <span class="button-text">Circle</span>
      </button>

      <button id="circle-outline-button" class="square" title="Outlined circle tool">
        <svg class="icons">
          <use href="/icons.svg#circle_outlined" />
        </svg>
        <span class="button-text">Circ Out</span>
      </button>

      <button id="select-button" class="square" title="Select tool">
        <svg class="icons">
          <use href="/icons.svg#select_tool" />
        </svg>
        <span class="button-text">Select</span>
      </button>

      <button id="flatten-button" class="square" title="Flatten elements">
        <svg class="icons">
          <use href="/icons.svg#flatten" />
        </svg>
        <span class="button-text">Flatten</span>
      </button>

      <button id="edit-copy-button" class="square" title="Copy selected (Ctrl+C)">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>

      <button id="edit-cut-button" class="square" title="Cut selected (Ctrl+X)">
        <svg class="icons">
          <use href="/icons.svg#cut" />
        </svg>
        <span class="button-text">Cut</span>
      </button>

      <button id="edit-paste-button" class="square" title="Paste selected (Ctrl+V)">
        <svg class="icons">
          <use href="/icons.svg#paste" />
        </svg>
        <span class="button-text">Paste</span>
      </button>

      <button id="delete-button" class="square" title="Delete selected">
        <svg class="icons">
          <use href="/icons.svg#delete" />
        </svg>
        <span class="button-text">Delete</span>
      </button>

      <button id="undo-button" class="square" title="Undo action">
        <svg class="icons">
          <use href="/icons.svg#undo" />
        </svg>
        <span class="button-text">Undo</span>
      </button>

      <button id="redo-button" class="square" title="Redo action">
        <svg class="icons">
          <use href="/icons.svg#redo" />
        </svg>
        <span class="button-text">Redo</span>
      </button>

    </div>

    <div class="controls-knobs wrapper">
      <div class="controls-knob"><button id="icons-grid-size-knob" class="knob-control" type="button" title="Grid size: 16 px" aria-label="Grid size"></button><span>Grid size</span></div>
      <div class="controls-knob"><button id="speed-knob" class="knob-control" type="button" title="Speed: 100%" aria-label="Playback speed 100 percent"></button><span>Speed</span></div>
    </div>

    </div>

  </div>

  <!-- TIMELINE -->

  <div id="timeline-container" class="container">
    <div class="module-body canvas-container border">
      <div class="timeline-scroll scrollable">
        <div class="icon-grid">
        <?php
        $svgPath = $_SERVER['DOCUMENT_ROOT'] . '/icons.svg';
        if (file_exists($svgPath)) {
          $svgContent = file_get_contents($svgPath);
          $svg = new SimpleXMLElement($svgContent);

          foreach ($svg->symbol as $symbol) {
            $id = (string) $symbol['id'];
            echo '<div class="grid-icon" data-id="' . htmlspecialchars($id) . '" title="' . htmlspecialchars($id) . '">';
            echo '<svg class="icons"><use href="/icons.svg#' . htmlspecialchars($id) . '" /></svg>';
            echo '</div>';
          }
        } else {
          echo "<p>Could not find icons.svg</p>";
        }
        ?>
        </div>
      </div>
    </div>
    <div class="module-footer wrapper colored">
      <button id="timeline-grid-button" class="square" title="Toggle timeline grid">
        <svg class="icons">
          <use href="/icons.svg#guides" />
        </svg>
        <span class="button-text">Grid</span>
      </button>

      <button id="size-button" class="square" title="Toggle half icon size">
        <svg class="icons">
          <use href="/icons.svg#small_large" />
        </svg>
        <span class="button-text">Size</span>
      </button>
    </div>
  </div>

  <!-- PANEL -->

  <div id="panel-container" class="container">
    <div class="module-body standard border">
      <textarea id="icons-text" placeholder="Icons SVG code will appear here."></textarea>
    </div>
    <div class="module-footer wrapper colored">
      <button id="panel-current-button" class="square" title="Show current icon">
        <svg class="icons">
          <use href="/icons.svg#field" />
        </svg>
        <span class="button-text">Current</span>
      </button>

      <button id="panel-all-button" class="square" title="Show all icons">
        <svg class="icons">
          <use href="/icons.svg#timeline" />
        </svg>
        <span class="button-text">All</span>
      </button>

      <button id="copy-button" class="square" title="Copy symbol code">
        <svg class="icons">
          <use href="/icons.svg#copy" />
        </svg>
        <span class="button-text">Copy</span>
      </button>
    </div>
  </div>

  <script src="/js/modules.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/modules.js'); ?>"></script>
  <script src="/js/drag.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/drag.js'); ?>"></script>
  <script src="/js/<?php echo $release; ?>.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/' . $release . '.js'); ?>"></script>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/beta_footer.php"); ?>
</body>

</html>