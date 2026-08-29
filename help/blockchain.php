<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#release"></use>
  </svg>
  <div class="justify">
    <h1>General</h1>
    Pekosoft Blockchain displays the live Bitcoin blockchain using the public mempool.space API. Recent confirmed blocks are shown in the Instrument module. A WebSocket connection delivers new blocks in real time.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#tool"></use>
  </svg>
  <div class="justify">
    <h1>Instrument <span class="object">module</span></h1>
    A scrollable horizontal chain of confirmed Bitcoin blocks, newest on the left. Each card shows the block height, mining pool, transaction count, size, median fee, and age. Click a card to select it and load its details into the Panel.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#controls"></use>
  </svg>
  <div class="justify">
    <h1>Controls <span class="object">module</span></h1>
    Buttons, fields, menus, knobs and sliders are collected in the Controls module. The status bar displays control help and feedback.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#reset"></use>
  </svg>
  <div class="justify">
    <h1>REFRESH <span class="object">button</span></h1>
    Re-fetches the latest blocks, mempool count, and fee estimates from the REST API.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#play"></use>
  </svg>
  <div class="justify">
    <h1>LIVE <span class="object">button</span></h1>
    Toggles the WebSocket connection to mempool.space. When active, new confirmed blocks appear automatically. <span class="default">Default: on.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Status <span class="object">field</span></h1>
    Reflects the current WebSocket state: LIVE (green), CONNECTING (amber, pulsing), or OFFLINE (red).
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Blocks <span class="object">field</span></h1>
    Sets how many recent blocks to display in the Tool chain. <span class="default">Default: 10. Range: 5–50.</span>
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Height <span class="object">field</span></h1>
    Shows the height of the most recent confirmed block.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Mempool <span class="object">field</span></h1>
    Shows the number of unconfirmed transactions currently waiting in the mempool.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#field"></use>
  </svg>
  <div class="justify">
    <h1>Economy / 1h fee / 30m fee / Fast fee <span class="object">fields</span></h1>
    Recommended fee rates in sat/vByte for different confirmation targets, sourced from the mempool.space fee API.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#timeline"></use>
  </svg>
  <div class="justify">
    <h1>Timeline <span class="object">module</span></h1>
    A bar chart of block intervals for the visible blocks. Each bar is the time between that block and the one before it. The dashed line marks the 10-minute Bitcoin target. Bars near the target are blue; bars far from it are pink.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>COPY <span class="object">button</span></h1>
    Copies the Timeline canvas as a PNG image to clipboard.
  </div>
</div>

<div class="feature-row module">
  <svg class="standard-image-help">
    <use href="/icons.svg#panel"></use>
  </svg>
  <div class="justify">
    <h1>Panel <span class="object">module</span></h1>
    Displays detailed metadata for the selected block: height, pool, hashes, timestamp, transaction count, size, weight, fee, subsidy reward, difficulty, nonce, bits, and version.
  </div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#speech"></use></svg>
  <div class="justify"><h1>SPEECH <span class="object">button</span></h1>Speaks current Panel text. Press again to stop.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help"><use href="/icons.svg#download"></use></svg>
  <div class="justify"><h1>DOWNLOAD <span class="object">button</span></h1>Downloads current Panel text as a text file.</div>
</div>

<div class="feature-row border">
  <svg class="standard-image-help">
    <use href="/icons.svg#copy"></use>
  </svg>
  <div class="justify">
    <h1>COPY <span class="object">button</span></h1>
    Copies the Panel text to the clipboard.
  </div>
</div>
