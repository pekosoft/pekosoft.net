// Audio Helpers
// pekosoft.net/js/audio.js

(() => {
  const clickNoiseBuffers = new WeakMap();
  const drumNoiseBuffers = new WeakMap();

  function normalizeTone(tone) {
    const allowed = ["click", "kick", "hat", "sine", "square", "sawtooth", "triangle", "piano"];
    return allowed.includes(tone) ? tone : "click";
  }

  function normalizeContinuousTone(tone) {
    const allowed = ["sine", "square", "sawtooth", "triangle", "piano"];
    return allowed.includes(tone) ? tone : "sine";
  }

  function getContinuousOscillatorType(tone) {
    if (tone === "sine" || tone === "square" || tone === "sawtooth" || tone === "triangle") {
      return tone;
    }
    return "sine";
  }

  function normalizeSustainedTone(tone) {
    const allowed = ["sine", "square", "sawtooth", "triangle", "piano"];
    return allowed.includes(tone) ? tone : "sine";
  }

  function wakeAudioContext(audioContext) {
    if (!audioContext) return null;
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {
        // Ignore transient resume failures; the next user gesture can try again.
      });
    }
    return audioContext;
  }

  function getClickNoiseBuffer(audioContext) {
    if (!audioContext) return null;
    const cached = clickNoiseBuffers.get(audioContext);
    if (cached && cached.sampleRate === audioContext.sampleRate) {
      return cached;
    }

    const durationSec = 0.04;
    const length = Math.floor(audioContext.sampleRate * durationSec);
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.pow(1 - t, 2.2);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    clickNoiseBuffers.set(audioContext, buffer);
    return buffer;
  }

  function getTransientBaseFrequencyHz() {
    const a4 = parseFloat(localStorage.getItem("global.a4_hz"));
    const a4Hz = Number.isFinite(a4) && a4 > 0 ? a4 : 440;
    return a4Hz * 2;
  }

  window.getTransientBaseFrequencyHz = getTransientBaseFrequencyHz;

  function clampDrumValue(value, min, max, fallback) {
    const parsed = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : fallback));
  }

  function getDrumNoiseBuffer(audioContext) {
    const cached = drumNoiseBuffers.get(audioContext);
    if (cached && cached.sampleRate === audioContext.sampleRate) return cached;

    const length = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index++) {
      data[index] = (Math.random() * 2) - 1;
    }

    drumNoiseBuffers.set(audioContext, buffer);
    return buffer;
  }

  function createDrumOutput(audioContext, destinationNode, when, level, velocity, pan) {
    const outputGain = audioContext.createGain();
    const outputLevel = clampDrumValue(level, 0, 1, 0.8) * clampDrumValue(velocity, 0, 1, 1);
    outputGain.gain.setValueAtTime(outputLevel, when);

    const panner = typeof audioContext.createStereoPanner === "function"
      ? audioContext.createStereoPanner()
      : null;

    if (panner) {
      panner.pan.setValueAtTime(clampDrumValue(pan, -1, 1, 0), when);
      outputGain.connect(panner);
      panner.connect(destinationNode || audioContext.destination);
    } else {
      outputGain.connect(destinationNode || audioContext.destination);
    }

    return { input: outputGain, nodes: panner ? [outputGain, panner] : [outputGain] };
  }

  function releaseDrumNodes(sources, nodes) {
    let remaining = sources.length;
    const cleanup = () => {
      remaining--;
      if (remaining > 0) return;
      nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch (_) {
          // Node may already be disconnected by the browser.
        }
      });
    };

    sources.forEach((source) => {
      source.addEventListener("ended", cleanup, { once: true });
    });
  }

  window.playDrumSound = function (options = {}) {
    const {
      audioContext,
      destinationNode = null,
      voice = "kick",
      when,
      velocity = 1,
      level = 0.8,
      pan = 0,
      frequency,
      decay,
      tone = 0.5,
      snap = 0.7
    } = options;

    if (!audioContext) return null;
    wakeAudioContext(audioContext);

    const selectedVoice = ["kick", "snare", "hat", "perc"].includes(voice) ? voice : "kick";
    const startTime = Math.max(when ?? audioContext.currentTime, audioContext.currentTime + 0.001);
    const output = createDrumOutput(audioContext, destinationNode, startTime, level, velocity, pan);
    const sources = [];
    const nodes = [...output.nodes];
    let stopTime = startTime;

    if (selectedVoice === "kick") {
      const baseFrequency = clampDrumValue(frequency, 35, 180, 55);
      const duration = clampDrumValue(decay, 0.06, 1.2, 0.35);
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      const clickLevel = clampDrumValue(tone, 0, 1, 0.5);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(baseFrequency * (2.6 + clickLevel), startTime);
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency, startTime + Math.min(0.09, duration * 0.35));
      envelope.gain.setValueAtTime(1, startTime);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(envelope);
      envelope.connect(output.input);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.01);

      sources.push(oscillator);
      nodes.push(oscillator, envelope);
      stopTime = startTime + duration + 0.01;
    } else if (selectedVoice === "snare") {
      const baseFrequency = clampDrumValue(frequency, 90, 360, 180);
      const duration = clampDrumValue(decay, 0.04, 0.8, 0.2);
      const noiseAmount = clampDrumValue(snap, 0, 1, 0.75);
      const toneAmount = clampDrumValue(tone, 0, 1, 0.55);
      const noise = audioContext.createBufferSource();
      const noiseFilter = audioContext.createBiquadFilter();
      const noiseEnvelope = audioContext.createGain();
      const oscillator = audioContext.createOscillator();
      const oscillatorEnvelope = audioContext.createGain();

      noise.buffer = getDrumNoiseBuffer(audioContext);
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(700 + (toneAmount * 2400), startTime);
      noiseFilter.Q.setValueAtTime(0.7, startTime);
      noiseEnvelope.gain.setValueAtTime(Math.max(0.0001, noiseAmount), startTime);
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(output.input);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(baseFrequency, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 0.72, startTime + duration);
      oscillatorEnvelope.gain.setValueAtTime(Math.max(0.0001, 0.65 * (1 - (noiseAmount * 0.55))), startTime);
      oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(duration, 0.16));
      oscillator.connect(oscillatorEnvelope);
      oscillatorEnvelope.connect(output.input);

      noise.start(startTime);
      noise.stop(startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.01);

      sources.push(noise, oscillator);
      nodes.push(noise, noiseFilter, noiseEnvelope, oscillator, oscillatorEnvelope);
      stopTime = startTime + duration + 0.01;
    } else if (selectedVoice === "hat") {
      const cutoff = clampDrumValue(frequency, 3000, 14000, 8000);
      const duration = clampDrumValue(decay, 0.015, 0.5, 0.06);
      const toneAmount = clampDrumValue(tone, 0, 1, 0.75);
      const noise = audioContext.createBufferSource();
      const highPass = audioContext.createBiquadFilter();
      const bandPass = audioContext.createBiquadFilter();
      const envelope = audioContext.createGain();

      noise.buffer = getDrumNoiseBuffer(audioContext);
      highPass.type = "highpass";
      highPass.frequency.setValueAtTime(Math.max(2500, cutoff * 0.58), startTime);
      bandPass.type = "bandpass";
      bandPass.frequency.setValueAtTime(cutoff, startTime);
      bandPass.Q.setValueAtTime(0.35 + toneAmount, startTime);
      envelope.gain.setValueAtTime(0.85, startTime);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      noise.connect(highPass);
      highPass.connect(bandPass);
      bandPass.connect(envelope);
      envelope.connect(output.input);
      noise.start(startTime);
      noise.stop(startTime + duration);

      sources.push(noise);
      nodes.push(noise, highPass, bandPass, envelope);
      stopTime = startTime + duration;
    } else {
      const cutoff = clampDrumValue(frequency, 120, 2400, 620);
      const duration = clampDrumValue(decay, 0.025, 0.8, 0.14);
      const toneAmount = clampDrumValue(tone, 0, 1, 0.6);
      const noise = audioContext.createBufferSource();
      const envelope = audioContext.createGain();
      const highPass = audioContext.createBiquadFilter();
      const lowPass = audioContext.createBiquadFilter();

      noise.buffer = getDrumNoiseBuffer(audioContext);
      noise.loop = true;
      highPass.type = "highpass";
      highPass.frequency.setValueAtTime(cutoff * 2, startTime);
      highPass.Q.setValueAtTime(0.7, startTime);
      lowPass.type = "lowpass";
      lowPass.frequency.setValueAtTime(Math.min(4000 + (toneAmount * 10000), audioContext.sampleRate * 0.45), startTime);
      lowPass.Q.setValueAtTime(0.7, startTime);
      // Uneven bursts mimic seeds striking a shaker rather than a pitched drum.
      envelope.gain.setValueAtTime(0.0001, startTime);
      envelope.gain.linearRampToValueAtTime(0.8, startTime + duration * 0.02);
      envelope.gain.linearRampToValueAtTime(0.25, startTime + duration * 0.045);
      envelope.gain.linearRampToValueAtTime(0.65, startTime + duration * 0.06);
      envelope.gain.linearRampToValueAtTime(0.2, startTime + duration * 0.09);
      envelope.gain.linearRampToValueAtTime(0.45, startTime + duration * 0.12);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      noise.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(envelope);
      envelope.connect(output.input);
      noise.start(startTime, Math.random() * noise.buffer.duration);
      noise.stop(startTime + duration);

      sources.push(noise);
      nodes.push(noise, highPass, lowPass, envelope);
      stopTime = startTime + duration;
    }

    releaseDrumNodes(sources, nodes);
    return { sources, stopTime, voice: selectedVoice };
  };

  window.playTransientSound = function (options = {}) {
    const {
      audioContext,
      tone = "click",
      when,
      gain = 1,
      pitchRatio = 1,
      durationSec = 0.05,
      baseFrequencyHz = null,
      destinationNode = null
    } = options;

    if (!audioContext) return null;
    wakeAudioContext(audioContext);

    const gainValue = Math.max(0, Number(gain) || 0);
    if (gainValue <= 0) return null;

    const ratio = Number.isFinite(pitchRatio) && pitchRatio > 0 ? pitchRatio : 1;
    const selectedTone = normalizeTone(tone);
    const now = audioContext.currentTime;
    const startTime = Math.max(when ?? now, now + 0.001);
    const outputNode = destinationNode || audioContext.destination;

    if (selectedTone === "click") {
      const buffer = getClickNoiseBuffer(audioContext);
      if (!buffer) return null;

      const baseGain = Math.max(gainValue, 0.0001);
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = buffer;

      const highPass = audioContext.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.setValueAtTime(1800 * ratio, startTime);
      highPass.Q.setValueAtTime(0.8, startTime);

      const lowPass = audioContext.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.setValueAtTime(7200 * ratio, startTime);
      lowPass.Q.setValueAtTime(0.7, startTime);

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(baseGain * 0.9, startTime + 0.0007);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(baseGain * 0.2, 0.0001), startTime + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.02);

      noiseSource.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(gainNode);
      gainNode.connect(outputNode);

      noiseSource.start(startTime);
      noiseSource.stop(startTime + 0.024);

      noiseSource.onended = () => {
        noiseSource.disconnect();
        highPass.disconnect();
        lowPass.disconnect();
        gainNode.disconnect();
      };

      return { stopNode: noiseSource, gainNode, stopTime: startTime + 0.024 };
    }

    if (selectedTone === "kick") {
      // Cap kick to the requested interval so it doesn't bleed into the next hit
      const kickDuration = Math.min(0.09, Math.max(durationSec, 0.008));
      const stopTime = startTime + kickDuration;
      const sweepTime = kickDuration * 0.56; // proportional to natural 50ms/90ms sweep

      // Kick oscillator with fast pitch sweep
      const kickOsc = audioContext.createOscillator();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(160 * ratio, startTime);
      kickOsc.frequency.exponentialRampToValueAtTime(42 * ratio, startTime + sweepTime);

      const kickGain = audioContext.createGain();
      kickGain.gain.setValueAtTime(Math.max(gainValue, 0.0001), startTime);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      kickOsc.connect(kickGain);
      kickGain.connect(outputNode);
      kickOsc.start(startTime);
      kickOsc.stop(stopTime);

      // Snap transient noise burst — scales with kick duration
      const snapDur = Math.min(0.007, kickDuration * 0.5);
      const snapLen = Math.floor(audioContext.sampleRate * snapDur);
      const snapBuf = audioContext.createBuffer(1, snapLen, audioContext.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapLen; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snapLen, 3);
      }

      const snapSource = audioContext.createBufferSource();
      snapSource.buffer = snapBuf;

      const snapHp = audioContext.createBiquadFilter();
      snapHp.type = "highpass";
      snapHp.frequency.setValueAtTime(2200, startTime);

      const snapGain = audioContext.createGain();
      snapGain.gain.setValueAtTime(Math.max(gainValue * 0.45, 0.0001), startTime);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, startTime + snapDur);

      snapSource.connect(snapHp);
      snapHp.connect(snapGain);
      snapGain.connect(outputNode);
      snapSource.start(startTime);
      snapSource.stop(startTime + snapDur);

      kickOsc.onended = () => { kickOsc.disconnect(); kickGain.disconnect(); };
      snapSource.onended = () => { snapSource.disconnect(); snapHp.disconnect(); snapGain.disconnect(); };

      return { stopNode: kickOsc, gainNode: kickGain, stopTime };
    }

    if (selectedTone === "hat") {
      const hatEvent = window.playDrumSound({
        audioContext,
        destinationNode: outputNode,
        voice: "hat",
        when: startTime,
        velocity: Math.min(gainValue, 1),
        level: 1,
        pan: 0,
        frequency: Math.max(3000, Math.min(14000, 8000 * ratio)),
        decay: Math.max(0.015, Math.min(0.5, Math.max(Number(durationSec) || 0.06, 0.02))),
        tone: 0.78
      });

      if (!hatEvent) return null;
      return {
        stopNode: hatEvent.sources?.[0] || null,
        gainNode: null,
        stopTime: hatEvent.stopTime
      };
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const transientBaseFrequencyHz = Number.isFinite(baseFrequencyHz) && baseFrequencyHz > 0
      ? baseFrequencyHz
      : getTransientBaseFrequencyHz();
    const clampedDurationSec = Math.max(Number(durationSec) || 0.05, 0.008);
    const stopTime = startTime + clampedDurationSec;
    const attackSec = Math.min(0.003, clampedDurationSec * 0.3);
    const releaseSec = Math.min(0.006, clampedDurationSec * 0.4);
    const peakTime = startTime + attackSec;
    const releaseStartTime = Math.max(peakTime, stopTime - releaseSec);

    if (selectedTone === "piano") {
      const real = new Float32Array(8);
      const imag = new Float32Array([0, 1.0, 0.46, 0.23, 0.14, 0.08, 0.04, 0.02]);
      const periodicWave = audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
      oscillator.setPeriodicWave(periodicWave);
      oscillator.frequency.setValueAtTime(transientBaseFrequencyHz * ratio * 1.01, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(transientBaseFrequencyHz * ratio, Math.min(startTime + 0.03, stopTime));

      const pianoPeak = Math.max(gainValue * 1.15, 0.0001);
      const pianoBody = Math.max(gainValue * 0.35, 0.0001);
      const pianoRelease = Math.max(Math.min(clampedDurationSec * 1.35, 0.18), 0.04);
      const pianoReleaseStartTime = Math.max(peakTime, stopTime - pianoRelease);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(pianoPeak, peakTime);
      gainNode.gain.exponentialRampToValueAtTime(pianoBody, Math.min(peakTime + 0.035, stopTime));
      gainNode.gain.setValueAtTime(pianoBody, pianoReleaseStartTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);
    } else {
      oscillator.type = selectedTone;
      oscillator.frequency.setValueAtTime(transientBaseFrequencyHz * ratio, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gainValue, peakTime);
      gainNode.gain.setValueAtTime(gainValue, releaseStartTime);
      gainNode.gain.linearRampToValueAtTime(0, stopTime);
    }

    oscillator.connect(gainNode);
    gainNode.connect(outputNode);

    oscillator.start(startTime);
    oscillator.stop(stopTime);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };

    return { stopNode: oscillator, gainNode, stopTime };
  };

  window.stopContinuousToneVoice = function (voiceState) {
    if (!voiceState) return;

    if (voiceState.oscillator) {
      try {
        voiceState.oscillator.stop();
      } catch {
        // ignore stop races on already-stopped oscillator
      }
      voiceState.oscillator.disconnect();
      voiceState.oscillator = null;
    }

    if (voiceState.filterNode) {
      voiceState.filterNode.disconnect();
      voiceState.filterNode = null;
    }

    if (voiceState.gainNode) {
      voiceState.gainNode.disconnect();
      voiceState.gainNode = null;
    }

    voiceState.mode = "";
  };

  window.updateContinuousToneVoice = function (options = {}) {
    const {
      audioContext,
      tone = "sine",
      baseHz = 440,
      bpmRatio = 1,
      gain = 0.08,
      enabled = true,
      destinationNode = null,
      voiceState = {}
    } = options;

    if (!audioContext) return null;
    wakeAudioContext(audioContext);

    if (!enabled) {
      window.stopContinuousToneVoice(voiceState);
      return voiceState;
    }

    const selectedTone = normalizeContinuousTone(tone);
    const voiceMode = "standard";

    if (voiceState.mode && voiceState.mode !== voiceMode) {
      window.stopContinuousToneVoice(voiceState);
    }

    voiceState.mode = voiceMode;

    if (!voiceState.gainNode) {
      voiceState.gainNode = audioContext.createGain();
      voiceState.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      voiceState.gainNode.connect(destinationNode || audioContext.destination);
    }

    const now = audioContext.currentTime;
    const safeRatio = Number.isFinite(bpmRatio) && bpmRatio > 0 ? bpmRatio : 1;
    const targetFrequency = Math.max(20, (Number(baseHz) || 440) * safeRatio);

    if (voiceState.filterNode) {
      voiceState.filterNode.disconnect();
      voiceState.filterNode = null;
    }

    if (!voiceState.oscillator) {
      voiceState.oscillator = audioContext.createOscillator();
      voiceState.oscillator.type = getContinuousOscillatorType(selectedTone);
      voiceState.oscillator.frequency.setValueAtTime(targetFrequency, now);
      voiceState.oscillator.connect(voiceState.gainNode);
      voiceState.oscillator.start();
    }

    voiceState.oscillator.type = getContinuousOscillatorType(selectedTone);
    voiceState.oscillator.frequency.setValueAtTime(targetFrequency, now);

    const targetGain = Math.max(0, Number(gain) || 0);
    voiceState.gainNode.gain.cancelScheduledValues(now);
    voiceState.gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.01);

    return voiceState;
  };

  window.createSustainedToneVoice = function (options = {}) {
    const {
      audioContext,
      tone = "sine",
      frequency = 440,
      destinationNode = null,
      standardGain = 0.5,
      pianoPeakGain = 0.65,
      pianoBodyGain = 0.25
    } = options;

    if (!audioContext) return null;
    wakeAudioContext(audioContext);

    const selectedTone = normalizeSustainedTone(tone);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const output = destinationNode || audioContext.destination;
    const now = audioContext.currentTime;
    const hz = Math.max(20, Number(frequency) || 440);
    const sustainedHz = hz;

    if (selectedTone === "piano") {
      const real = new Float32Array(8);
      const imag = new Float32Array([0, 1.0, 0.46, 0.23, 0.14, 0.08, 0.04, 0.02]);
      const periodicWave = audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
      oscillator.setPeriodicWave(periodicWave);
      oscillator.frequency.setValueAtTime(sustainedHz * 1.01, now);
      oscillator.frequency.exponentialRampToValueAtTime(sustainedHz, now + 0.03);
    } else {
      oscillator.type = selectedTone;
      oscillator.frequency.setValueAtTime(sustainedHz, now);
    }

    gainNode.gain.setValueAtTime(0, now);
    oscillator.connect(gainNode);
    gainNode.connect(output);
    oscillator.start();

    if (selectedTone === "piano") {
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(pianoPeakGain, 0.0001), now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(pianoBodyGain, 0.0001), now + 0.08);
    } else {
      gainNode.gain.setTargetAtTime(Math.max(standardGain, 0), now, 0.01);
    }

    return { oscillator, gainNode, tone: selectedTone };
  };

  window.updateSustainedToneFrequency = function (voice, options = {}) {
    const { frequency = 440, audioContext = null, glideSec = 0 } = options;
    if (!voice || !voice.oscillator) return;

    const hz = Math.max(20, Number(frequency) || 440);
    const targetHz = hz;
    const now = audioContext ? audioContext.currentTime : undefined;

    if (now !== undefined && glideSec > 0) {
      voice.oscillator.frequency.setTargetAtTime(targetHz, now, glideSec);
      return;
    }

    if (now !== undefined) {
      voice.oscillator.frequency.setValueAtTime(targetHz, now);
      return;
    }

    voice.oscillator.frequency.value = targetHz;
  };

  window.releaseSustainedToneVoice = function (options = {}) {
    const {
      audioContext,
      voice,
      releaseSec = 0.1,
      onEnded = null
    } = options;

    if (!audioContext || !voice || !voice.oscillator || !voice.gainNode) return;

    const now = audioContext.currentTime;
    const safeRelease = Math.max(Number(releaseSec) || 0.1, 0.01);
    const isPiano = voice.tone === "piano";
    const gainNode = voice.gainNode;
    const oscillator = voice.oscillator;

    gainNode.gain.cancelScheduledValues(now);
    if (isPiano) {
      gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + safeRelease);
    } else {
      gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0), now);
      gainNode.gain.setTargetAtTime(0, now, Math.max(safeRelease * 0.5, 0.01));
    }

    oscillator.stop(now + safeRelease + 0.01);
    oscillator.onended = () => {
      try {
        oscillator.disconnect();
      } catch {
        // ignore disconnect races
      }
      try {
        gainNode.disconnect();
      } catch {
        // ignore disconnect races
      }
      if (typeof onEnded === "function") onEnded();
    };
  };
})();

// END OF FILE
