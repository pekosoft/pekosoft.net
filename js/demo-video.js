window.downloadDemoVideo = async ({ duration, audioContext, destinationNode, render, startAudio, onProgress, signal }) => {
  const format = [
    { mimeType: 'video/mp4;codecs=avc1.64002a,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' }
  ].find(candidate => window.MediaRecorder?.isTypeSupported(candidate.mimeType));
  if (!format || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error('This browser does not support video downloads. Try a current desktop browser.');
  }
  await document.fonts.ready;
  const sprites = new Map();
  for (const use of document.querySelectorAll('.demo-screen svg use')) {
    const href = use.getAttribute('href');
    if (href.startsWith('#')) continue;
    const url = new URL(href, document.baseURI);
    url.hash = '';
    if (sprites.has(url.href)) continue;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Video artwork could not load (${response.status}).`);
    const sprite = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    if (sprite.querySelector('parsererror')) throw new Error('Video artwork could not be read.');
    sprites.set(url.href, sprite);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = canvas.width;
  frameCanvas.height = canvas.height;
  const context = frameCanvas.getContext('2d');
  const output = canvas.getContext('2d');
  if (!context || !output) throw new Error('The video canvas could not start.');
  output.filter = getComputedStyle(document.documentElement).filter;
  const screen = document.querySelector('.demo-screen');
  const background = document.querySelector('[data-demo-static]');
  const pattern = document.querySelector('[data-demo-noise]');
  const patternWidth = Number(pattern.getAttribute('width'));
  const patternHeight = Number(pattern.getAttribute('height'));

  async function drawIcon(svg) {
    const style = getComputedStyle(svg);
    if (style.display === 'none' || Number(style.opacity) === 0) return;
    const clone = svg.cloneNode(true);
    const originals = [svg, ...svg.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    originals.forEach((element, index) => {
      const computed = getComputedStyle(element);
      for (const property of ['fill', 'stroke', 'stroke-width', 'color']) {
        copies[index].style.setProperty(property, computed.getPropertyValue(property));
      }
    });
    const definitions = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const included = new Set();
    for (const use of clone.querySelectorAll('use')) {
      const href = use.getAttribute('href');
      if (href.startsWith('#')) continue;
      const url = new URL(href, document.baseURI);
      const id = url.hash.slice(1);
      url.hash = '';
      const symbol = sprites.get(url.href)?.getElementById(id);
      if (!symbol) throw new Error(`Video artwork is missing: ${id}.`);
      if (!included.has(id)) definitions.append(symbol.cloneNode(true));
      included.add(id);
      use.setAttribute('href', `#${id}`);
      // Padding the outer viewBox must not enlarge symbols with implicit dimensions.
      if (!use.hasAttribute('width')) use.setAttribute('width', svg.viewBox.baseVal.width);
      if (!use.hasAttribute('height')) use.setAttribute('height', svg.viewBox.baseVal.height);
    }
    clone.prepend(definitions);
    const box = svg.viewBox.baseVal;
    const padding = 64;
    clone.setAttribute('viewBox', `${box.x - padding} ${box.y - padding} ${box.width + padding * 2} ${box.height + padding * 2}`);
    clone.setAttribute('width', box.width + padding * 2);
    clone.setAttribute('height', box.height + padding * 2);
    clone.style.opacity = '1';
    clone.style.transform = 'none';
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const rect = svg.getBoundingClientRect();
      const width = parseFloat(style.width);
      const height = parseFloat(style.height);
      const extraX = padding * width / box.width;
      const extraY = padding * height / box.height;
      context.save();
      context.globalAlpha *= Number(style.opacity);
      context.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
      if (style.transform !== 'none') {
        const matrix = new DOMMatrix(style.transform);
        context.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
      }
      context.drawImage(image, -width / 2 - extraX, -height / 2 - extraY, width + extraX * 2, height + extraY * 2);
      context.restore();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function drawText(element, align = 'center') {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;
    const rect = element.getBoundingClientRect();
    context.save();
    context.globalAlpha *= Number(style.opacity);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.fillStyle = style.color;
    context.textAlign = align;
    const metrics = context.measureText(element.textContent);
    const baseline = rect.y + rect.height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    context.fillText(element.textContent, align === 'left' ? rect.x : rect.x + rect.width / 2, baseline);
    context.restore();
  }

  async function paintFrame(elapsed) {
    render(elapsed);
    context.resetTransform();
    context.globalAlpha = 1;
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (background.style.display !== 'none') {
      const [offsetX, offsetY] = pattern.getAttribute('patternTransform').match(/\d+/g).map(Number);
      context.globalAlpha = Number(getComputedStyle(background).opacity);
      for (const grain of pattern.querySelectorAll('rect')) {
        context.fillStyle = getComputedStyle(grain).fill;
        const x = (Number(grain.getAttribute('x')) + offsetX) % patternWidth;
        const y = (Number(grain.getAttribute('y')) + offsetY) % patternHeight;
        for (let left = x; left < canvas.width; left += patternWidth) {
          for (let top = y; top < canvas.height; top += patternHeight) {
            context.fillRect(left, top, Number(grain.getAttribute('width')), Number(grain.getAttribute('height')));
          }
        }
      }
    }
    const rect = screen.getBoundingClientRect();
    const scale = Math.min(canvas.width / rect.width, canvas.height / rect.height);
    context.setTransform(scale, 0, 0, scale,
      (canvas.width - rect.width * scale) / 2 - rect.x * scale,
      (canvas.height - rect.height * scale) / 2 - rect.y * scale);
    const slide = screen.querySelector('[data-demo-slide]:not([hidden])');
    context.globalAlpha = Number(getComputedStyle(slide).opacity);
    const icon = slide.querySelector('svg');
    if (icon) await drawIcon(icon);
    for (const text of slide.querySelectorAll('h1, [data-demo-description], [data-demo-slogan]')) drawText(text);
    const link = slide.querySelector('[data-demo-url-link]');
    if (link) {
      drawText(link, 'left');
      const caret = link.querySelector('[data-demo-url-caret]');
      if (getComputedStyle(caret).visibility !== 'hidden') {
        const caretRect = caret.getBoundingClientRect();
        context.fillStyle = getComputedStyle(caret).backgroundColor;
        context.fillRect(caretRect.x, caretRect.y, caretRect.width, caretRect.height);
      }
    }
  }

  async function drawFrame(elapsed) {
    await paintFrame(elapsed);
    output.drawImage(frameCanvas, 0, 0);
  }

  let stream;
  let recorder;
  let audioDestination;
  const interrupt = () => stream?.getTracks().forEach(track => track.stop());
  signal.addEventListener('abort', interrupt, { once: true });
  try {
    if (signal.aborted) throw new Error('Video download was interrupted. Try again.');
    await drawFrame(0);
    stream = canvas.captureStream(60);
    audioDestination = audioContext.createMediaStreamDestination();
    destinationNode.connect(audioDestination);
    audioDestination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    const chunks = [];
    let recordingError = null;
    recorder = new MediaRecorder(stream, {
      mimeType: format.mimeType, videoBitsPerSecond: 16000000, audioBitsPerSecond: 256000
    });
    recorder.addEventListener('dataavailable', event => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener('error', event => {
      recordingError = event.error || new Error('Video recording failed.');
    });
    const stopped = new Promise(resolve => recorder.addEventListener('stop', resolve, { once: true }));
    recorder.start();
    const started = audioContext.currentTime;
    startAudio();
    let elapsed = 0;
    while (elapsed < duration) {
      if (document.hidden) throw new Error('Keep this tab visible while preparing the video, then try Download again.');
      if (recordingError) throw recordingError;
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (signal.aborted) throw new Error('Video download was interrupted. Try again.');
      elapsed = Math.min(duration, (audioContext.currentTime - started) * 1000);
      await drawFrame(elapsed);
      onProgress(Math.floor(elapsed / duration * 100));
    }
    recorder.stop();
    await stopped;
    if (recordingError) throw recordingError;
    const blob = new Blob(chunks, { type: recorder.mimeType });
    if (!blob.size) throw new Error('The video recording was empty.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pekosoft-demo.${format.extension}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } finally {
    signal.removeEventListener('abort', interrupt);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    if (audioDestination) destinationNode.disconnect(audioDestination);
    if (stream) stream.getTracks().forEach(track => track.stop());
  }
};
