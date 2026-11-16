(() => {
  const slides = [...document.querySelectorAll('[data-demo-slide]')];
  const controls = document.querySelector('[data-demo-controls]');
  const moreButton = document.querySelector('[data-demo-more]');
  const playbackControls = document.querySelector('[data-demo-playback]');
  const darkModeButton = document.querySelector('[data-demo-dark-mode]');
  const playButton = document.querySelector('[data-demo-play]');
  const replayButton = document.querySelector('[data-demo-replay]');
  const startButton = document.querySelector('[data-demo-start]');
  const soundButton = document.querySelector('[data-demo-sound]');
  const loopButton = document.querySelector('[data-demo-loop]');
  const downloadButton = document.querySelector('[data-demo-download]');
  const fullscreenButton = document.querySelector('[data-demo-fullscreen]');
  const statusMessage = document.querySelector('[data-demo-status]');
  const staticBackground = document.querySelector('[data-demo-static]');
  const staticNoise = document.querySelector('[data-demo-noise]');
  const openingDuration = Number(slides[0].dataset.duration);
  const openingPartDuration = openingDuration / 2;
  const openingLogo = document.querySelector('[data-demo-opening-logo]');
  const openingSlogan = document.querySelector('[data-demo-slogan]');
  const closingIcon = document.querySelector('[data-demo-floppy]');
  const closingIconDelay = 300;
  const closingIconHoldDuration = 1000;
  const closingIconZoomDuration = 1000;
  const closingUrl = document.querySelector('[data-demo-url]');
  const closingUrlLink = closingUrl.querySelector('[data-demo-url-link]');
  const closingUrlHref = closingUrlLink.getAttribute('data-demo-url-link');
  const closingUrlText = closingUrl.querySelector('[data-demo-url-text]');
  const closingUrlCaret = closingUrl.querySelector('[data-demo-url-caret]');
  const closingUrlLabel = closingUrl.getAttribute('aria-label');
  const typingInterval = 90;
  const caretBlinkInterval = 250;
  const closingUrlColorDelay = 200;
  const logoFadeInDuration = 300;
  const logoFadeOutDuration = 600;
  const logoBlinkTimes = [900, 1160];
  const logoBlinkDuration = 80;
  const descriptionDelay = 2500;
  const descriptionFadeDuration = 500;
  const pointTransitionDuration = 200;
  const tapFeedback = document.querySelector('[data-demo-tap]');
  const noteStream = document.querySelector('[data-demo-notes]');
  const pendulum = document.querySelector('[data-demo-pendulum]');
  const signatureBeats = [...document.querySelectorAll('[data-demo-signature-beat]')];
  const platter = document.querySelector('[data-demo-platter]');
  const duration = slides.reduce((total, slide) => total + Number(slide.dataset.duration), 0);
  const noteDuration = openingDuration + 600;
  const noteFadeOutDuration = 1200;
  const noteScrollDuration = 5000;
  const noteScrollDistance = 1280;
  const beatDuration = 60000 / 120;
  const audioTailDuration = 600;
  const platterRpm = 100 / 3;
  const platterFrequency = 65.4064;
  const platterGain = 0.1;
  const platterStartDuration = 1000;
  const platterStopDuration = 2000;
  const playbackFadeDuration = 0.02;
  const activeSources = new Set();
  const audioNodes = new Set();
  let playing = !startButton;
  let sound = true;
  let loop = false;
  let position = 0;
  let startedAt = performance.now();
  let frame = null;
  let audioContext = null;
  let analyser = null;
  let masterGain = null;
  let playbackGain = null;
  let playbackStartedAt = 0;
  let audioScheduled = false;
  let audioRequest = 0;
  let audioError = '';
  let fullscreenError = '';
  let downloading = false;
  let downloadController = null;
  let downloadMessage = '';
  let controlsTimer = null;
  let videoClickTimer = null;

  function closeControls() {
    playbackControls.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
  }

  function showControls() {
    controls.hidden = Boolean(startButton && !startButton.hidden);
    if (controls.hidden) return;
    clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => {
      if (!playbackControls.hidden) return;
      if (controls.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
      controls.hidden = true;
    }, 3000);
  }

  moreButton.addEventListener('click', () => {
    const expanded = playbackControls.hidden;
    playbackControls.hidden = !expanded;
    moreButton.setAttribute('aria-expanded', String(expanded));
    showControls();
  });
  document.addEventListener('pointermove', showControls, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (!controls.contains(event.target)) closeControls();
    showControls();
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !playbackControls.hidden) {
      closeControls();
      moreButton.focus();
    }
    showControls();
  });
  controls.addEventListener('focusin', showControls);
  controls.addEventListener('focusout', showControls);

  function currentPosition() {
    return playing ? position + performance.now() - startedAt : position;
  }

  function getOpeningOpacity(elapsed, fadeDuration = openingDuration, fadeOutDuration = logoFadeOutDuration) {
    return Math.max(0, Math.min(
      1,
      elapsed / logoFadeInDuration,
      (fadeDuration - elapsed) / fadeOutDuration
    ));
  }

  function updateControls() {
    darkModeButton.setAttribute('aria-pressed', String(!document.documentElement.classList.contains('invert-colors')));
    playButton.setAttribute('aria-pressed', String(playing));
    soundButton.setAttribute('aria-pressed', String(sound));
    loopButton.setAttribute('aria-pressed', String(loop));
    for (const button of [darkModeButton, soundButton, playButton, replayButton, loopButton, downloadButton]) {
      button.disabled = downloading;
    }
    fullscreenButton.disabled = downloading || !document.fullscreenEnabled;
    fullscreenButton.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
    statusMessage.textContent = downloadMessage || fullscreenError || audioError || (
      sound && audioContext?.state === 'suspended'
        ? 'The browser blocked sound. Pause and press Play to enable it.'
        : ''
    );
  }

  function trackSource(source, nodes = []) {
    activeSources.add(source);
    nodes.forEach(node => audioNodes.add(node));
    source.addEventListener('ended', () => {
      activeSources.delete(source);
      source.disconnect();
      nodes.forEach(node => {
        node.disconnect();
        audioNodes.delete(node);
      });
    }, { once: true });
  }

  function stopAudio(fade = false) {
    const sources = [...activeSources];
    const nodes = [...audioNodes];
    const output = playbackGain;
    activeSources.clear();
    audioNodes.clear();
    playbackGain = null;
    audioScheduled = false;
    const disconnect = () => {
      sources.forEach(source => source.disconnect());
      nodes.forEach(node => node.disconnect());
      if (output) output.disconnect();
    };
    if (fade && output && sources.length && audioContext.state === 'running') {
      const now = audioContext.currentTime;
      output.gain.cancelScheduledValues(now);
      output.gain.setValueAtTime(Math.min(1, Math.max(0, (now - playbackStartedAt) / playbackFadeDuration)), now);
      output.gain.linearRampToValueAtTime(0, now + playbackFadeDuration);
      let remaining = sources.length;
      sources.forEach(source => {
        source.addEventListener('ended', () => {
          remaining -= 1;
          if (!remaining) disconnect();
        }, { once: true });
        source.stop(now + playbackFadeDuration);
      });
    } else {
      sources.forEach(source => source.stop());
      disconnect();
    }
  }

  function playOpeningNote(elapsed) {
    if (elapsed >= noteDuration) return;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    const now = audioContext.currentTime;
    const remaining = (noteDuration - elapsed) / 1000;
    oscillator.type = 'triangle';
    oscillator.frequency.value = 440 * 2 ** (-45 / 12);
    envelope.gain.setValueAtTime(0.22 * getOpeningOpacity(elapsed, noteDuration, noteFadeOutDuration), now);
    if (elapsed < logoFadeInDuration) {
      envelope.gain.linearRampToValueAtTime(0.22, now + (logoFadeInDuration - elapsed) / 1000);
    }
    const fadeOutStart = noteDuration - noteFadeOutDuration;
    if (elapsed < fadeOutStart) {
      envelope.gain.setValueAtTime(0.22, now + (fadeOutStart - elapsed) / 1000);
    }
    envelope.gain.linearRampToValueAtTime(0, now + remaining);
    oscillator.connect(envelope);
    envelope.connect(playbackGain);
    trackSource(oscillator, [envelope]);
    oscillator.start();
    oscillator.stop(now + remaining);
  }

  function getPlatterMotion(sceneTime, sceneDuration) {
    const time = Math.max(0, Math.min(sceneTime, sceneDuration)) / 1000;
    const startDuration = platterStartDuration / 1000;
    const stopDuration = platterStopDuration / 1000;
    const startingTime = Math.min(time, startDuration);
    const cruisingTime = Math.max(0, Math.min(time, (sceneDuration - platterStopDuration) / 1000) - startDuration);
    const brakingTime = Math.max(0, time - (sceneDuration - platterStopDuration) / 1000);
    const speedRatio = Math.max(0, Math.min(time / startDuration, 1, (sceneDuration / 1000 - time) / stopDuration));
    const angle = 6 * platterRpm * (startingTime ** 2 / (2 * startDuration) + cruisingTime
      + brakingTime - brakingTime ** 2 / (2 * stopDuration));
    return { speedRatio, angle };
  }

  function schedulePlatter(start, end, elapsed, audioNow) {
    const offset = Math.max(0, elapsed - start);
    const motion = getPlatterMotion(offset, end - start);
    const when = audioNow + Math.max(0, start - elapsed) / 1000;
    const tailEnd = end + audioTailDuration;
    const remaining = (tailEnd - Math.max(start, elapsed)) / 1000;
    const fadeStart = end - Math.min(1200, (end - start) / 2);
    const attack = Math.min(0.08, remaining / 4);
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const envelope = audioContext.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(platterFrequency * motion.speedRatio, when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900 * motion.speedRatio, when);
    for (const time of [start + platterStartDuration, end - platterStopDuration, end]) {
      if (time <= Math.max(start, elapsed)) continue;
      const { speedRatio } = getPlatterMotion(time - start, end - start);
      const rampWhen = audioNow + (time - elapsed) / 1000;
      oscillator.frequency.linearRampToValueAtTime(platterFrequency * speedRatio, rampWhen);
      filter.frequency.linearRampToValueAtTime(900 * speedRatio, rampWhen);
    }
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(
      platterGain * Math.min(1, (remaining - attack) * 1000 / (tailEnd - fadeStart)),
      when + attack
    );
    if (elapsed < fadeStart) {
      envelope.gain.setValueAtTime(platterGain, audioNow + (fadeStart - elapsed) / 1000);
    }
    envelope.gain.linearRampToValueAtTime(0, when + remaining);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(playbackGain);
    trackSource(oscillator, [filter, envelope]);
    oscillator.start(when);
    oscillator.stop(when + remaining);
    if (offset < end - start) {
      const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * (end - start) / 1000), audioContext.sampleRate);
      const samples = buffer.getChannelData(0);
      const burstLength = Math.ceil(audioContext.sampleRate * 0.002);
      let index = 0;
      while (index < samples.length) {
        const { speedRatio } = getPlatterMotion(index / audioContext.sampleRate * 1000, end - start);
        for (let sample = 0; sample < burstLength && index + sample < samples.length; sample += 1) {
          samples[index + sample] = (Math.random() * 2 - 1) * 0.15 * speedRatio * Math.exp(-6 * sample / burstLength);
        }
        index += Math.ceil(audioContext.sampleRate * (0.035 + Math.random() * 0.09) / Math.max(speedRatio, 0.1));
      }
      const crackle = audioContext.createBufferSource();
      const crackleFilter = audioContext.createBiquadFilter();
      crackle.buffer = buffer;
      crackleFilter.type = 'lowpass';
      crackleFilter.frequency.value = 3500;
      crackle.connect(crackleFilter);
      crackleFilter.connect(envelope);
      trackSource(crackle, [crackleFilter]);
      crackle.start(when, offset / 1000);
      crackle.stop(when + (end - start - offset) / 1000);
    }
  }

  function createReverbInput(durationSec, wetLevel) {
    const input = audioContext.createGain();
    const reverb = audioContext.createConvolver();
    const wet = audioContext.createGain();
    const length = Math.ceil(audioContext.sampleRate * durationSec);
    const impulse = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const samples = impulse.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * Math.exp(-3 * index / length)
        * Math.min(1, (length - index) / (audioContext.sampleRate * 0.1));
    }
    reverb.buffer = impulse;
    wet.gain.value = wetLevel;
    input.connect(playbackGain);
    input.connect(reverb);
    reverb.connect(wet);
    wet.connect(playbackGain);
    [input, reverb, wet].forEach(node => audioNodes.add(node));
    return input;
  }

  function createTripletDelay(endTime) {
    const input = audioContext.createGain();
    const delay = audioContext.createDelay(1);
    const feedback = audioContext.createGain();
    const wet = audioContext.createGain();
    delay.delayTime.value = beatDuration / 3000;
    feedback.gain.value = 0.38;
    wet.gain.setValueAtTime(0.55, audioContext.currentTime);
    wet.gain.setValueAtTime(0.55, Math.max(audioContext.currentTime, endTime - 0.12));
    wet.gain.linearRampToValueAtTime(0, endTime);
    input.connect(playbackGain);
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(playbackGain);
    [input, delay, feedback, wet].forEach(node => audioNodes.add(node));
    return input;
  }

  function scheduleBlinkClick(time, elapsed, audioNow) {
    if (time < elapsed) return;
    const event = window.playTransientSound({
      audioContext, destinationNode: playbackGain, tone: 'click',
      when: audioNow + (time - elapsed) / 1000,
      gain: 0.14, pitchRatio: 0.65
    });
    trackSource(event.stopNode);
  }

  function schedulePointPling(when, destination) {
    for (const [ratio, gain, duration] of [[1, 0.075, 0.32], [2.756, 0.022, 0.16], [5.404, 0.008, 0.08]]) {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1046.5023 * ratio, when);
      envelope.gain.setValueAtTime(0, when);
      envelope.gain.linearRampToValueAtTime(gain, when + 0.002);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration - 0.006);
      envelope.gain.linearRampToValueAtTime(0, when + duration);
      oscillator.connect(envelope);
      envelope.connect(destination);
      trackSource(oscillator, [envelope]);
      oscillator.start(when);
      oscillator.stop(when + duration);
    }
  }

  function scheduleAudio() {
    if (audioScheduled) return;
    const elapsed = currentPosition();
    const audioNow = audioContext.currentTime;
    playbackGain = audioContext.createGain();
    playbackStartedAt = audioNow;
    playbackGain.gain.setValueAtTime(0, audioNow);
    playbackGain.gain.linearRampToValueAtTime(1, audioNow + playbackFadeDuration);
    playbackGain.connect(analyser);
    playOpeningNote(elapsed);
    logoBlinkTimes.forEach(time => scheduleBlinkClick(time, elapsed, audioNow));
    let start = 0;
    let pointReverbInput = null;
    for (const slide of slides) {
      const end = start + Number(slide.dataset.duration);
      if (end > elapsed || (slide.contains(platter) && end + audioTailDuration > elapsed)) {
        if (slide.contains(closingUrl)) {
          for (let index = 0; index < closingUrlLabel.length; index += 1) {
            const time = start + (index + 1) * typingInterval;
            if (time < elapsed) continue;
            const event = window.playTransientSound({
              audioContext, destinationNode: playbackGain, tone: 'click',
              when: audioNow + (time - elapsed) / 1000,
              gain: 0.16, pitchRatio: [0.45, 0.5, 0.47][index % 3]
            });
            trackSource(event.stopNode);
          }
        } else if (slide.querySelector('[data-demo-point-icon]') && start >= elapsed) {
          if (!pointReverbInput) pointReverbInput = createReverbInput(0.35, 0.12);
          schedulePointPling(audioNow + (start - elapsed) / 1000, pointReverbInput);
        } else if (slide.contains(platter)) {
          schedulePlatter(start, end, elapsed, audioNow);
        } else if (slide.contains(tapFeedback) || slide.contains(noteStream) || slide.contains(pendulum)) {
          const delayInput = slide.contains(noteStream)
            ? createTripletDelay(audioNow + (end + audioTailDuration - elapsed) / 1000)
            : null;
          const destination = delayInput || (slide.contains(tapFeedback)
            ? createReverbInput((beatDuration + audioTailDuration) / 1000, 0.65)
            : playbackGain);
          for (let beat = 0, time = start; time < end; beat += 1, time += beatDuration) {
            if (time < elapsed) continue;
            const when = audioNow + (time - elapsed) / 1000;
            if (slide.contains(tapFeedback)) {
              const event = window.playDrumSound({
                audioContext, destinationNode: destination, voice: 'kick', when,
                frequency: 48, decay: 0.3, level: 0.55
              });
              event.sources.forEach(source => trackSource(source));
            } else {
              const accented = beat % 4 === 0;
              const event = window.playTransientSound({
                audioContext, destinationNode: destination, when,
                tone: delayInput ? 'piano' : 'click',
                gain: delayInput ? 0.2 : (accented ? 0.675 : 0.425),
                pitchRatio: delayInput ? 1 : (accented ? 1.55 : 1),
                baseFrequencyHz: [261.6256, 311.127, 391.9954, 523.2511][beat % 4],
                durationSec: delayInput ? 0.18 : 0.05
              });
              trackSource(event.stopNode);
            }
          }
        }
      }
      start = end;
    }
    audioScheduled = true;
  }

  async function enableAudio() {
    const request = ++audioRequest;
    try {
      if (!audioContext) {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) throw new Error('This browser does not support Web Audio.');
        audioContext = new AudioContextConstructor();
        analyser = audioContext.createAnalyser();
        masterGain = audioContext.createGain();
        masterGain.gain.value = sound ? 1 : 0;
        analyser.connect(masterGain);
        masterGain.connect(audioContext.destination);
        audioContext.addEventListener('statechange', updateControls);
      }
      const resumed = audioContext.resume();
      updateControls();
      await resumed;
      if (request !== audioRequest || !playing || !sound) return;
      audioError = '';
      scheduleAudio();
      updateControls();
    } catch (error) {
      if (request !== audioRequest) return;
      stopAudio();
      audioError = error instanceof Error ? error.message : 'Demo sound could not start.';
      console.error('Demo sound failed:', error);
      updateControls();
    }
  }

  function render(elapsed) {
    let start = 0;
    const showingGrain = elapsed >= openingPartDuration && elapsed < openingPartDuration * 2;
    slides.forEach((slide, index) => {
      const end = start + Number(slide.dataset.duration);
      slide.hidden = !(elapsed >= start && (elapsed < end || index === slides.length - 1));
      if (!slide.hidden) {
        const sceneTime = elapsed - start;
        if (slide.contains(closingIcon)) {
          closingIcon.style.opacity = sceneTime < closingIconDelay ? '0' : '1';
          const zoomStart = closingIconDelay + closingIconHoldDuration;
          const progress = Math.max(0, Math.min(1, (sceneTime - zoomStart) / closingIconZoomDuration));
          closingIcon.style.transform = `scale(${64 ** progress})`;
        }
        if (slide.contains(closingUrl)) {
          const characters = Math.min(closingUrlLabel.length, Math.floor(sceneTime / typingInterval));
          closingUrlText.textContent = closingUrlLabel.slice(0, characters);
          const caretTime = sceneTime - closingUrlLabel.length * typingInterval;
          const caretFinishedTime = caretBlinkInterval * 4;
          if (caretTime >= caretFinishedTime) {
            closingUrlLink.setAttribute('href', closingUrlHref);
          } else {
            closingUrlLink.removeAttribute('href');
          }
          if (caretTime >= caretFinishedTime + closingUrlColorDelay) {
            closingUrlLink.setAttribute('data-demo-url-color', '');
          } else {
            closingUrlLink.removeAttribute('data-demo-url-color');
          }
          const caretVisible = caretTime < 0 || (
            caretTime < caretBlinkInterval * 4 && Math.floor(caretTime / caretBlinkInterval) % 2 === 1
          );
          closingUrlCaret.style.visibility = caretVisible ? 'visible' : 'hidden';
        }
        const beatPhase = (sceneTime % beatDuration) / beatDuration;
        const description = slide.querySelector('[data-demo-description]');
        if (description) {
          slide.querySelector('h1').style.visibility = sceneTime < descriptionDelay ? 'visible' : 'hidden';
          description.style.opacity = String(Math.max(0, Math.min(1,
            (sceneTime - descriptionDelay) / descriptionFadeDuration
          )));
        }
        const pointIcon = slide.querySelector('[data-demo-point-icon]');
        if (pointIcon) {
          const entrance = 1 - (1 - Math.min(1, sceneTime / pointTransitionDuration)) ** 3;
          const exit = Math.max(0, (sceneTime - (end - start) + pointTransitionDuration) / pointTransitionDuration) ** 3;
          pointIcon.style.transform = pointIcon.dataset.demoPointIcon === 'fade'
            ? 'none'
            : `rotate(${90 * (entrance + exit - 1)}deg)`;
          pointIcon.style.opacity = String(entrance - exit);
        }
        if (slide.contains(tapFeedback)) {
          tapFeedback.setAttribute('r', String(92 + 28 * beatPhase));
        }
        if (slide.contains(noteStream)) {
          const progress = (sceneTime % noteScrollDuration) / noteScrollDuration;
          const offset = noteScrollDistance * progress;
          noteStream.setAttribute('transform', `translate(${-offset} 0)`);
        }
        if (slide.contains(pendulum)) {
          const angle = 28 * Math.cos(Math.PI * sceneTime / beatDuration);
          pendulum.setAttribute('transform', `rotate(${angle} 254.051 454)`);
          const currentBeat = Math.floor(sceneTime / beatDuration) % signatureBeats.length;
          signatureBeats.forEach((circle, index) => {
            circle.setAttribute('fill', index === currentBeat ? 'none' : '#000');
          });
        }
        if (slide.contains(platter)) {
          const { angle } = getPlatterMotion(sceneTime, end - start);
          platter.setAttribute('transform', `rotate(${angle % 360} 218.125 256)`);
        }
      }
      start = end;
    });
    staticBackground.style.display = showingGrain ? 'block' : 'none';
    const noiseFrame = Math.floor(elapsed / 120);
    const noiseTransform = `translate(${noiseFrame * 73 % 320} ${noiseFrame * 137 % 320})`;
    if (showingGrain && staticNoise.getAttribute('patternTransform') !== noiseTransform) {
      staticNoise.setAttribute('patternTransform', noiseTransform);
    }
    openingLogo.style.display = elapsed < openingPartDuration ? '' : 'none';
    const logoBlink = logoBlinkTimes.some(time => elapsed >= time && elapsed < time + logoBlinkDuration);
    openingLogo.style.opacity = logoBlink ? '0.25' : '1';
    openingSlogan.hidden = elapsed < openingPartDuration;
    slides[0].style.opacity = String(elapsed < openingDuration
      ? getOpeningOpacity(elapsed % openingPartDuration, openingPartDuration)
      : 0);
  }

  function tick() {
    frame = null;
    const elapsed = currentPosition();
    if (elapsed >= duration) {
      stopAudio();
      if (loop) {
        position = elapsed % duration;
        startedAt = performance.now();
        if (sound) enableAudio();
      } else {
        position = duration;
        playing = false;
        audioRequest += 1;
      }
      updateControls();
    }
    render(currentPosition());
    if (playing) frame = requestAnimationFrame(tick);
  }

  darkModeButton.addEventListener('click', () => {
    const lightMode = !document.documentElement.classList.contains('invert-colors');
    localStorage.setItem('global.theme', lightMode ? 'light' : 'dark');
    document.documentElement.classList.toggle('invert-colors', lightMode);
    updateControls();
  });

  playButton.addEventListener('click', () => {
    clearTimeout(videoClickTimer);
    if (playing) {
      position = Math.min(duration, currentPosition());
      playing = false;
      audioRequest += 1;
      cancelAnimationFrame(frame);
      frame = null;
      stopAudio(true);
    } else {
      if (position >= duration) position = 0;
      startedAt = performance.now();
      playing = true;
      if (sound) enableAudio();
      tick();
    }
    if (startButton && playing) {
      startButton.hidden = true;
      showControls();
    }
    updateControls();
  });

  startButton?.addEventListener('click', () => {
    playButton.click();
    moreButton.focus();
  });

  document.addEventListener('click', event => {
    if (downloading || controls.contains(event.target) || event.target.closest('button, a[href]')) return;
    clearTimeout(videoClickTimer);
    videoClickTimer = setTimeout(() => {
      if (!downloading) playButton.click();
    }, 320);
  });

  document.addEventListener('dblclick', event => {
    if (downloading || controls.contains(event.target) || event.target.closest('button, a[href]')) return;
    event.preventDefault();
    clearTimeout(videoClickTimer);
    if (!fullscreenButton.disabled) fullscreenButton.click();
  });

  replayButton.addEventListener('click', () => {
    audioRequest += 1;
    cancelAnimationFrame(frame);
    frame = null;
    stopAudio(true);
    position = 0;
    playing = false;
    playButton.click();
  });

  soundButton.addEventListener('click', () => {
    sound = !sound;
    audioRequest += 1;
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(sound ? 1 : 0, audioContext.currentTime, 0.008);
    }
    if (sound) enableAudio();
    updateControls();
  });

  loopButton.addEventListener('click', () => {
    loop = !loop;
    updateControls();
  });

  downloadButton.addEventListener('click', async () => {
    if (downloading) return;
    clearTimeout(videoClickTimer);
    const savedPosition = Math.min(duration, currentPosition());
    const wasPlaying = playing;
    const controller = new AbortController();
    downloadController = controller;
    downloading = true;
    downloadMessage = 'Preparing video. Keep this tab open.';
    playing = false;
    audioRequest += 1;
    cancelAnimationFrame(frame);
    frame = null;
    stopAudio();
    updateControls();
    try {
      if (!audioContext) await enableAudio();
      if (!audioContext) throw new Error('This browser does not support Web Audio.');
      await audioContext.resume();
      if (audioContext.state !== 'running') throw new Error('Sound could not start for the video.');
      await window.downloadDemoVideo({
        duration, audioContext, destinationNode: analyser, render, signal: controller.signal,
        startAudio() {
          position = 0;
          scheduleAudio();
        },
        onProgress(percent) {
          const message = `Preparing video: ${percent}%. Keep this tab open.`;
          if (message !== downloadMessage) {
            downloadMessage = message;
            updateControls();
          }
        }
      });
      downloadMessage = 'Video download started.';
    } catch (error) {
      downloadMessage = error instanceof Error ? error.message : 'The video could not be downloaded.';
      console.error('Demo video download failed:', error);
    } finally {
      stopAudio();
      position = savedPosition;
      startedAt = performance.now();
      playing = wasPlaying && !controller.signal.aborted;
      downloading = false;
      downloadController = null;
      render(position);
      if (playing) {
        if (sound) enableAudio();
        frame = requestAnimationFrame(tick);
      }
      updateControls();
    }
  });

  fullscreenButton.addEventListener('click', async () => {
    clearTimeout(videoClickTimer);
    fullscreenError = '';
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      fullscreenError = 'Fullscreen could not change. Please try again.';
      console.error('Demo fullscreen failed:', error);
    }
    updateControls();
  });
  document.addEventListener('fullscreenchange', updateControls);

  window.addEventListener('pagehide', () => {
    clearTimeout(controlsTimer);
    clearTimeout(videoClickTimer);
    downloadController?.abort();
    position = Math.min(duration, currentPosition());
    playing = false;
    audioRequest += 1;
    cancelAnimationFrame(frame);
    stopAudio();
    if (audioContext) {
      audioContext.close().catch(error => console.error('Demo audio cleanup failed:', error));
      audioContext = null;
      analyser = null;
      masterGain = null;
    }
    updateControls();
  }, { once: true });

  showControls();
  render(0);
  updateControls();
  if (playing) {
    enableAudio();
    frame = requestAnimationFrame(tick);
  }
})();
