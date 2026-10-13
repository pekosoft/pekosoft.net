// Pekosoft PCM recording worklet

class PcmRecorderProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.channelCount = options.processorOptions.channelCount;
        this.recording = false;
        this.offset = 0;
        this.allocateChunk();
        this.port.onmessage = ({ data }) => {
            if (data === 'start') {
                this.recording = true;
            } else if (data === 'stop') {
                this.recording = false;
                this.flushChunk();
                this.port.postMessage({ type: 'stop' });
            }
        };
    }

    allocateChunk() {
        this.channels = Array.from({ length: this.channelCount }, () => new Float32Array(4096));
        this.offset = 0;
    }

    flushChunk() {
        if (!this.offset) return;
        const channels = this.channels.map(channel => channel.slice(0, this.offset));
        this.port.postMessage({ type: 'data', channels }, channels.map(channel => channel.buffer));
        this.allocateChunk();
    }

    process(inputs) {
        const input = inputs[0];
        if (!this.recording || !input.length) return true;
        const frameCount = input[0].length;
        for (let frame = 0; frame < frameCount; frame++) {
            for (let channel = 0; channel < this.channelCount; channel++) {
                this.channels[channel][this.offset] = input[channel]?.[frame] ?? 0;
            }
            if (++this.offset === this.channels[0].length) this.flushChunk();
        }
        return true;
    }
}

registerProcessor('pcm-recorder', PcmRecorderProcessor);

// END OF FILE
