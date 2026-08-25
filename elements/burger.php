<?php
$release = isset($release) ? $release : '';
$betaReleases = ['beta', 'player', 'visualizer', 'bpm_circle', 'bpm_curve', 'circle_of_fifths', 'drum_machine', 'reference', 'tuner', 'notepad', 'audio_calculator', 'piano', 'icons'];
$isBetaRelease = in_array($release, $betaReleases, true);
$currentFile = basename($_SERVER['SCRIPT_NAME']);
$requestPath = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '', '/');
$toolPages = ["tap_pad.php", "bpm_calculator.php", "metronome.php", "turntable.php", "bpm_circle.php", "bpm_curve.php", "circle_of_fifths.php", "drum_machine.php", "player.php", "piano.php", "audio_calculator.php", "blockchain.php", "icons.php", "tuner.php", "visualizer.php", "reference.php", "notepad.php"];
$toolSlugs = array_map(function ($toolPage) {
  return pathinfo($toolPage, PATHINFO_FILENAME);
}, $toolPages);
$hasModules = in_array($currentFile, $toolPages, true) || in_array($requestPath, $toolSlugs, true);
$releaseFile = $release . ".php";
$releaseHref = is_file($_SERVER['DOCUMENT_ROOT'] . "/tools/" . $releaseFile) ? "/" . $release : "/" . $releaseFile;
$availableModules = isset($availableModules) && is_array($availableModules)
  ? array_values(array_unique($availableModules))
  : ['tool', 'controls', 'timeline', 'panel'];
$hasPlaylistModule = in_array('playlist', $availableModules, true);
?>
<div id="burger-container">

  <button id="toggle-menu-button" class="square" title="Menu" aria-label="Menu">
    <svg class="icons" role="img">
      <use href="/icons.svg#burger"></use>
    </svg>
  </button>

  <div id="toc" class="toc-container">
    <div class="toc-content">
      <div class="toc-column">

    <button class="toc-button" data-href="/index.php" title="Pekosoft" aria-label="Pekosoft">
      <svg class="icons" role="img">
        <use href="/icons.svg#index"></use>
      </svg>
      Pekosoft
    </button>

      </div>

      <div class="toc-column">

    <?php if ($isBetaRelease): ?>
      <button class="toc-button" data-href="/player" title="Player" aria-label="Player"><svg class="icons" role="img"><use href="/icons.svg#player"></use></svg>Player</button>
      <button class="toc-button" data-href="/visualizer" title="Visualizer" aria-label="Visualizer"><svg class="icons" role="img"><use href="/icons.svg#visualizer"></use></svg>Visualizer</button>
      <button class="toc-button" data-href="/bpm_circle" title="BPM Circle" aria-label="BPM Circle"><svg class="icons" role="img"><use href="/icons.svg#bpm_circle"></use></svg>BPM Circle</button>
      <button class="toc-button" data-href="/bpm_curve" title="BPM Curve" aria-label="BPM Curve"><svg class="icons" role="img"><use href="/icons.svg#bpm_curve"></use></svg>BPM Curve</button>
      <button class="toc-button" data-href="/circle_of_fifths" title="Circle Of Fifths" aria-label="Circle Of Fifths"><svg class="icons" role="img"><use href="/icons.svg#circle_of_fifths"></use></svg>Circle Of Fifths</button>
      <button class="toc-button" data-href="/drum_machine" title="Drum Machine" aria-label="Drum Machine"><svg class="icons" role="img"><use href="/icons.svg#drum_machine"></use></svg>Drum Machine</button>
      <button class="toc-button" data-href="/reference" title="Reference" aria-label="Reference"><svg class="icons" role="img"><use href="/icons.svg#reference"></use></svg>Reference</button>
      <button class="toc-button" data-href="/tuner" title="Tuner" aria-label="Tuner"><svg class="icons" role="img"><use href="/icons.svg#tuner"></use></svg>Tuner</button>
      <button class="toc-button" data-href="/notepad" title="Notepad" aria-label="Notepad"><svg class="icons" role="img"><use href="/icons.svg#notepad"></use></svg>Notepad</button>
      <button class="toc-button" data-href="/audio_calculator" title="Audio Calculator" aria-label="Audio Calculator"><svg class="icons" role="img"><use href="/icons.svg#audio_calculator"></use></svg>Audio Calculator</button>
      <button class="toc-button" data-href="/piano" title="Piano" aria-label="Piano"><svg class="icons" role="img"><use href="/icons.svg#piano"></use></svg>Piano</button>
      <button class="toc-button" data-href="/icons" title="Icons" aria-label="Icons"><svg class="icons" role="img"><use href="/icons.svg#icons"></use></svg>Icons</button>
    <?php else: ?>
      <button class="toc-button" data-href="/tap_pad" title="Tap Pad" aria-label="Tap Pad">
        <svg class="icons" role="img">
          <use href="/icons.svg#tap_pad"></use>
        </svg>
        Tap Pad
      </button>

      <button class="toc-button" data-href="/bpm_calculator" title="BPM Calculator" aria-label="BPM Calculator">
        <svg class="icons" role="img">
          <use href="/icons.svg#bpm_calculator"></use>
        </svg>
        BPM Calculator
      </button>

      <button class="toc-button" data-href="/metronome" title="Metronome" aria-label="Metronome">
        <svg class="icons" role="img">
          <use href="/icons.svg#metronome"></use>
        </svg>
        Metronome
      </button>

      <button class="toc-button" data-href="/turntable" title="Turntable" aria-label="Turntable">
        <svg class="icons" role="img">
          <use href="/icons.svg#turntable"></use>
        </svg>
        Turntable
      </button>
    <?php endif; ?>
      </div>

      <div class="toc-column">
        <?php if (empty($hideReleaseMenu) && $release !== ''): ?>
          <button class="toc-button" data-href="<?php echo $releaseHref; ?>" title="Tool" aria-label="Tool"><svg class="icons" role="img"><use href="/icons.svg#release"></use></svg>Tool</button>
          <button class="toc-button" data-href="/help.php?r=<?php echo $release; ?>" title="Help" aria-label="Help"><svg class="icons" role="img"><use href="/icons.svg#help"></use></svg>Help</button>
          <button class="toc-button" data-href="/history.php?r=<?php echo $release; ?>" title="History" aria-label="History"><svg class="icons" role="img"><use href="/icons.svg#clock"></use></svg>History</button>
          <button class="toc-button" data-href="/about.php?r=<?php echo $release; ?>" title="About" aria-label="About"><svg class="icons" role="img"><use href="/icons.svg#about"></use></svg>About</button>
        <?php endif; ?>
      </div>

      <div id="toc-module-items" class="toc-column">
        <?php if ($hasModules): ?>
          <?php if (in_array('tool', $availableModules, true)): ?>
            <button class="toc-button" id="tool-toggle-toc-button" title="Instrument" aria-label="Instrument"><svg class="icons" role="img"><use href="/icons.svg#tool"></use></svg>Instrument</button>
          <?php endif; ?>
          <?php if (in_array('controls', $availableModules, true)): ?>
            <button class="toc-button" id="controls-toggle-toc-button" title="Controls" aria-label="Controls"><svg class="icons" role="img"><use href="/icons.svg#controls"></use></svg>Controls</button>
          <?php endif; ?>
          <?php if (in_array('meters', $availableModules, true)): ?>
            <button class="toc-button" id="meters-toggle-toc-button" title="Meters" aria-label="Meters"><svg class="icons" role="img"><use href="/icons.svg#meter"></use></svg>Meters</button>
          <?php endif; ?>
          <?php if (in_array('timeline', $availableModules, true)): ?>
            <button class="toc-button" id="timeline-toggle-toc-button" title="Timeline" aria-label="Timeline"><svg class="icons" role="img"><use href="/icons.svg#timeline"></use></svg>Timeline</button>
          <?php endif; ?>
          <?php if ((isset($hasPlaylist) && $hasPlaylist) || $hasPlaylistModule): ?>
            <button class="toc-button" id="playlist-toggle-toc-button" title="Playlist" aria-label="Playlist"><svg class="icons" role="img"><use href="/icons.svg#view_list"></use></svg>Playlist</button>
          <?php endif; ?>
          <?php if (in_array('history', $availableModules, true)): ?>
            <button class="toc-button" id="history-toggle-toc-button" title="History module" aria-label="History module"><svg class="icons" role="img"><use href="/icons.svg#undo"></use></svg>History</button>
          <?php endif; ?>
          <?php if (in_array('panel', $availableModules, true)): ?>
            <button class="toc-button" id="panel-toggle-toc-button" title="Panel" aria-label="Panel"><svg class="icons" role="img"><use href="/icons.svg#panel"></use></svg>Panel</button>
          <?php endif; ?>
        <?php endif; ?>
      </div>

      <div class="toc-column">
        <button class="toc-button" data-href="/bitcoin.php" title="Buy Us Coffee" aria-label="Buy Us Coffee">
          <svg class="icons" role="img">
            <use href="/icons.svg#qr"></use>
          </svg>
          Buy Us Coffee
        </button>
        <?php if ($release !== ''): ?>
          <button id="share-toc-button" class="toc-button" title="Share" aria-label="Share"><svg class="icons" role="img"><use href="/icons.svg#share"></use></svg>Share</button>
        <?php endif; ?>
      </div>

      <div class="toc-close">
        <button id="toggle-menu-close-button" class="square transparent" title="Close" aria-label="Close">
          <svg class="icons" role="img">
            <use href="/icons.svg#close"></use>
          </svg>
        </button>
      </div>
    </div>

  </div>

</div>