<?php
$release = "demo";
$releaseName = "Demo";
$iconVersion = filemtime($_SERVER['DOCUMENT_ROOT'] . '/icons.svg');
$embedded = ($_GET['embedded'] ?? '') === '1';
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php"); ?>
  <?php if ($embedded): ?><base target="_top"><?php endif; ?>
  <meta name="description" content="Free online audio tools.">
  <link rel="stylesheet" href="/css/demo.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/demo.css'); ?>">
</head>

<body class="demo-page<?php echo $embedded ? ' demo-embedded' : ''; ?>">
  <svg class="demo-static" data-demo-static aria-hidden="true">
    <defs>
      <pattern id="demo-static-pattern" width="640" height="480" patternUnits="userSpaceOnUse" data-demo-noise>
        <rect x="37" y="61" width="2" height="2" fill="var(--grey2)"></rect>
        <rect x="59" y="74" width="1" height="1" fill="var(--grey1)"></rect>
        <rect x="274" y="38" width="3" height="2" fill="var(--grey1)"></rect>
        <rect x="489" y="183" width="2" height="1" fill="var(--grey2)"></rect>
        <rect x="511" y="201" width="2" height="2" fill="var(--grey1)"></rect>
        <rect x="176" y="318" width="1" height="1" fill="var(--grey2)"></rect>
        <rect x="398" y="429" width="2" height="3" fill="var(--grey1)"></rect>
        <rect x="604" y="397" width="2" height="2" fill="var(--grey2)"></rect>
        <rect x="108" y="237" width="4" height="1" fill="var(--grey1)"></rect>
        <rect x="353" y="126" width="6" height="1" fill="var(--grey2)"></rect>
        <rect x="547" y="342" width="1" height="4" fill="var(--grey1)"></rect>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#demo-static-pattern)"></rect>
  </svg>
  <main class="demo-main" aria-label="Pekosoft demo">
    <?php if ($embedded): ?>
      <button class="square icon-only demo-start" type="button" data-demo-start aria-label="Play" title="Play demo">
        <svg class="icons" aria-hidden="true"><use href="/icons.svg#play"></use></svg>
      </button>
    <?php endif; ?>
    <div class="demo-screen" aria-label="Presentation">
      <section class="demo-slide demo-brand" data-demo-slide data-duration="6000" aria-label="Pekosoft">
        <svg class="demo-logo" data-demo-opening-logo viewBox="0 0 512 101.87" role="img" aria-label="Pekosoft">
          <use href="/assets.svg#logo"></use>
        </svg>
        <p class="demo-tagline" data-demo-slogan hidden>Free online audio tools.</p>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="4000" aria-labelledby="demo-tap-pad" hidden>
        <svg class="demo-icon" viewBox="0 0 512 512" aria-hidden="true">
          <defs>
            <mask id="demo-tap-hand" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
              <rect width="512" height="512" fill="#fff"></rect>
              <circle cx="209.179" cy="80.782" r="82" fill="#000"></circle>
              <rect x="184.112" y="67.14" width="50.134" height="100" fill="#fff"></rect>
            </mask>
          </defs>
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#tap_pad" mask="url(#demo-tap-hand)"></use>
          <circle class="demo-feedback" data-demo-tap cx="209.179" cy="80.782" r="92"></circle>
        </svg>
        <div class="demo-caption">
          <h1 id="demo-tap-pad">Tap Pad</h1>
          <p data-demo-description>For tapping tempo.</p>
        </div>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="4000" aria-labelledby="demo-bpm-calculator" hidden>
        <svg class="demo-icon" viewBox="0 0 512 512" aria-hidden="true">
          <defs>
            <clipPath id="demo-calculator-display"><rect x="104" y="48" width="304" height="256"></rect></clipPath>
            <mask id="demo-calculator-housing" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
              <rect width="512" height="512" fill="#fff"></rect>
              <rect x="104" y="48" width="304" height="256" fill="#000"></rect>
            </mask>
          </defs>
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#bpm_calculator" mask="url(#demo-calculator-housing)"></use>
          <g clip-path="url(#demo-calculator-display)">
            <g class="demo-moving-part" data-demo-notes>
              <use href="/icons.svg?v=<?php echo $iconVersion; ?>#1_2" x="104" y="48" width="256" height="256"></use>
              <use href="/icons.svg?v=<?php echo $iconVersion; ?>#1_4" x="360" y="48" width="256" height="256"></use>
              <use href="/icons.svg?v=<?php echo $iconVersion; ?>#1_8" x="616" y="48" width="256" height="256"></use>
              <use href="/icons.svg?v=<?php echo $iconVersion; ?>#1_16" x="872" y="48" width="256" height="256"></use>
              <svg x="1128" y="48" width="256" height="256" viewBox="144 64 224 224">
                <use href="/icons.svg?v=<?php echo $iconVersion; ?>#bpm_calculator" width="512" height="512"></use>
              </svg>
              <use href="/icons.svg?v=<?php echo $iconVersion; ?>#1_2" x="1384" y="48" width="256" height="256"></use>
              <use href="/icons.svg?v=<?php echo $iconVersion; ?>#1_4" x="1640" y="48" width="256" height="256"></use>
            </g>
          </g>
        </svg>
        <div class="demo-caption">
          <h1 id="demo-bpm-calculator">BPM Calculator</h1>
          <p data-demo-description>For tempo calculations.</p>
        </div>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="4000" aria-labelledby="demo-metronome" hidden>
        <svg class="demo-icon" viewBox="0 0 512 512" aria-hidden="true">
          <defs>
            <clipPath id="demo-metronome-base">
              <rect x="0" y="394.192" width="512" height="117.808"></rect>
            </clipPath>
          </defs>
          <path data-demo-metronome-body fill-rule="evenodd" d="M153.877 0H354.225L429.172 383.062H78.93ZM163.040416 11.13H345.061584L415.653362 371.932H92.448638Z"></path>
          <g class="demo-moving-part" data-demo-pendulum>
            <path d="M248.486 56h11.13v398h-11.13Z"></path>
            <use href="/icons.svg?v=<?php echo $iconVersion; ?>#pendulum_weight" x="228" y="110" width="52" height="52"></use>
          </g>
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#metronome" clip-path="url(#demo-metronome-base)"></use>
          <g fill="#000" stroke="#000" stroke-width="6">
            <circle data-demo-signature-beat cx="188.051" cy="454" r="13"></circle>
            <circle data-demo-signature-beat cx="232.051" cy="454" r="13"></circle>
            <circle data-demo-signature-beat cx="276.051" cy="454" r="13"></circle>
            <circle data-demo-signature-beat cx="320.051" cy="454" r="13"></circle>
          </g>
        </svg>
        <div class="demo-caption">
          <h1 id="demo-metronome">Metronome</h1>
          <p data-demo-description>For keeping time.</p>
        </div>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="5000" aria-labelledby="demo-turntable" hidden>
        <svg class="demo-icon" viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#turntable"></use>
          <g class="demo-moving-part" data-demo-platter>
            <line x1="218.125" y1="97" x2="218.125" y2="256" stroke="currentColor" stroke-width="6"></line>
          </g>
        </svg>
        <div class="demo-caption">
          <h1 id="demo-turntable">Turntable</h1>
          <p data-demo-description>For visualizing RPM.</p>
        </div>
      </section>
      <section class="demo-slide demo-brand" data-demo-slide data-duration="2300" aria-label="Floppy icon" hidden>
        <svg class="demo-icon" data-demo-floppy viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#index"></use>
        </svg>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="1000" aria-labelledby="demo-point-simple" hidden>
        <svg class="demo-icon" data-demo-point-icon viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#star"></use>
        </svg>
        <h1 id="demo-point-simple">Simple</h1>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="1000" aria-labelledby="demo-point-documented" hidden>
        <svg class="demo-icon" data-demo-point-icon viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#reference"></use>
        </svg>
        <h1 id="demo-point-documented">Documented</h1>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="1000" aria-labelledby="demo-point-secure" hidden>
        <svg class="demo-icon" data-demo-point-icon viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#lock"></use>
        </svg>
        <h1 id="demo-point-secure">Secure</h1>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="1000" aria-labelledby="demo-point-source" hidden>
        <svg class="demo-icon" data-demo-point-icon viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#github"></use>
        </svg>
        <h1 id="demo-point-source">Open source</h1>
      </section>
      <section class="demo-slide" data-demo-slide data-duration="1000" aria-labelledby="demo-point-customizable" hidden>
        <svg class="demo-icon" data-demo-point-icon="fade" viewBox="0 0 512 512" aria-hidden="true">
          <use href="/icons.svg?v=<?php echo $iconVersion; ?>#settings"></use>
        </svg>
        <h1 id="demo-point-customizable">Customizable</h1>
      </section>
      <section class="demo-slide demo-brand" data-demo-slide data-duration="4000" aria-label="pekosoft.net" hidden>
        <p class="demo-tagline demo-url" data-demo-url aria-label="pekosoft.net"><a class="demo-url-typing" data-demo-url-link="/" aria-label="pekosoft.net"><span data-demo-url-text aria-hidden="true"></span><span class="demo-caret" data-demo-url-caret aria-hidden="true"></span></a></p>
      </section>
    </div>
    <div class="demo-controls" data-demo-controls<?php echo $embedded ? ' hidden' : ''; ?>>
      <button class="square icon-only" type="button" data-demo-more aria-label="More" title="Toggle playback controls" aria-expanded="false" aria-controls="demo-playback">
        <svg class="icons" aria-hidden="true"><use href="/icons.svg#more"></use></svg>
      </button>
      <div class="demo-playback" id="demo-playback" data-demo-playback role="group" aria-label="Playback" hidden>
        <a class="square icon-only" href="/" aria-label="Pekosoft" title="Go to front page">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#index"></use></svg>
        </a>
        <button class="square icon-only" type="button" data-demo-dark-mode aria-label="Dark mode" title="Toggle dark mode" aria-pressed="true">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#moon"></use></svg>
        </button>
        <button class="square icon-only" type="button" data-demo-sound aria-label="Sound" title="Toggle sound" aria-pressed="true">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#sound"></use></svg>
        </button>
        <button class="square icon-only" type="button" data-demo-play aria-label="Play" title="Toggle playback" aria-pressed="<?php echo $embedded ? 'false' : 'true'; ?>">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#play"></use></svg>
        </button>
        <button class="square icon-only" type="button" data-demo-replay aria-label="Replay" title="Restart demo">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#reset"></use></svg>
        </button>
        <button class="square icon-only" type="button" data-demo-loop aria-label="Loop" title="Toggle loop" aria-pressed="false">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#loop"></use></svg>
        </button>
        <button class="square icon-only" type="button" data-demo-download aria-label="Download" title="Download video with audio">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#download"></use></svg>
        </button>
        <button class="square icon-only" type="button" data-demo-fullscreen aria-label="Fullscreen" title="Toggle full screen" aria-pressed="false">
          <svg class="icons" aria-hidden="true"><use href="/icons.svg#full_screen"></use></svg>
        </button>
      </div>
    </div>
    <p class="demo-status" data-demo-status role="status" aria-live="polite"></p>
    <noscript>Enable JavaScript to play the demo.</noscript>
  </main>
  <script src="/js/audio.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/audio.js'); ?>"></script>
  <script src="/js/demo-video.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/demo-video.js'); ?>"></script>
  <script src="/js/demo.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/demo.js'); ?>"></script>
</body>

</html>
