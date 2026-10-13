// Test tone definitions and sample generation
// pekosoft.net/js/test_tones.js

(() => {
    function createPresets() {
        const tones = [
            { channels: 'Mono', frequencies: [100], phases: [0] },
            { channels: 'Mono', frequencies: [440], phases: [0] },
            { channels: 'Stereo', frequencies: [1000, 1000], phases: [0, 0] },
            { channels: 'Stereo', frequencies: [1000, 1000], phases: [0, 180] },
            { channels: 'Stereo', frequencies: [1000, 1000], phases: [0, 90] },
            { channels: 'Stereo (Left only)', frequencies: [1000, 1000], phases: [0, 0], muted: 1 },
            { channels: 'Stereo (Right only)', frequencies: [1000, 1000], phases: [0, 0], muted: 0 },
            { channels: 'Stereo', frequencies: [440, 880], phases: [0, 0] }
        ];
        return tones.map(tone => {
            const frequency = tone.frequencies.every(value => value === tone.frequencies[0])
                ? `${tone.frequencies[0]} Hz`
                : `L ${tone.frequencies[0]} Hz R ${tone.frequencies[1]} Hz`;
            const phase = tone.phases.length === 1
                ? `${tone.phases[0]} deg`
                : `L ${tone.muted === 0 ? 'muted' : `${tone.phases[0]} deg`} R ${tone.muted === 1 ? 'muted' : `${tone.phases[1]} deg`}`;
            return {
                name: `Sine - ${tone.channels} - ${frequency} - ${phase} - -12 dBFS`,
                preset: tone
            };
        });
    }

    function generateBuffer(audioContext, tone) {
        const sampleRate = 48000;
        const buffer = audioContext.createBuffer(tone.frequencies.length, sampleRate * 5, sampleRate);
        const amplitude = Math.pow(10, -12 / 20);
        const fadeFrames = sampleRate * 0.005;
        tone.frequencies.forEach((frequency, channel) => {
            const samples = buffer.getChannelData(channel);
            if (channel === tone.muted) return;
            const phase = tone.phases[channel] * Math.PI / 180;
            for (let i = 0; i < samples.length; i++) {
                const envelope = Math.min(1, i / fadeFrames, (samples.length - 1 - i) / fadeFrames);
                samples[i] = amplitude * envelope * Math.sin(2 * Math.PI * frequency * i / sampleRate + phase);
            }
        });
        return buffer;
    }

    window.PekoTestTones = { createPresets, generateBuffer };
})();

// END OF FILE
