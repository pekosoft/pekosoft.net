(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AudioMarkers = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseAudioMarkers(input) {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) :
      ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : null;
    const result = { format: 'non-wav', sampleRate: null, markers: [], errors: [] };
    if (!bytes || bytes.length < 4 || readId(bytes, 0) !== 'RIFF') return result;
    if (bytes.length < 12 || readId(bytes, 8) !== 'WAVE') {
      result.format = 'wav'; result.errors.push('Invalid or truncated RIFF/WAVE header'); return result;
    }
    result.format = 'wav';
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const declaredEnd = 8 + view.getUint32(4, true);
    const end = Math.min(declaredEnd, bytes.length);
    if (declaredEnd < 12 || declaredEnd > bytes.length) result.errors.push('RIFF size exceeds available data or is invalid');
    let offset = 12;
    const cues = new Map(), labels = new Map();
    while (offset + 8 <= end) {
      const id = readId(bytes, offset), size = view.getUint32(offset + 4, true);
      const data = offset + 8, chunkEnd = data + size;
      if (chunkEnd > end) { result.errors.push('Truncated ' + id + ' chunk'); break; }
      if (id === 'fmt ') {
        if (size < 16) result.errors.push('Malformed fmt chunk');
        else {
          const rate = view.getUint32(data + 4, true);
          if (rate === 0) result.errors.push('Invalid sample rate');
          else result.sampleRate = rate;
        }
      } else if (id === 'cue ') {
        if (size < 4) result.errors.push('Malformed cue chunk');
        else {
          const count = view.getUint32(data, true);
          if (count > Math.floor((size - 4) / 24)) result.errors.push('Truncated cue point records');
          for (let i = 0, pos = data + 4; i < count && pos + 24 <= chunkEnd; i++, pos += 24) {
            cues.set(view.getUint32(pos, true), view.getUint32(pos + 20, true));
          }
        }
      } else if (id === 'LIST') {
        if (size < 4) result.errors.push('Malformed LIST chunk');
        else if (readId(bytes, data) === 'adtl') {
          let sub = data + 4;
          while (sub + 8 <= chunkEnd) {
            const subId = readId(bytes, sub), subSize = view.getUint32(sub + 4, true);
            const subData = sub + 8, subEnd = subData + subSize;
            if (subEnd > chunkEnd) { result.errors.push('Truncated adtl ' + subId + ' subchunk'); break; }
            if (subId === 'labl') {
              if (subSize < 4) result.errors.push('Malformed labl subchunk');
              else {
                const cueId = view.getUint32(subData, true);
                let text = new TextDecoder('utf-8').decode(bytes.subarray(subData + 4, subEnd));
                const nul = text.indexOf('\0'); if (nul >= 0) text = text.slice(0, nul);
                labels.set(cueId, text);
              }
            }
            sub = subEnd + (subSize & 1);
            if (sub > chunkEnd) { result.errors.push('Missing adtl padding byte'); break; }
          }
          if (sub !== chunkEnd && sub + 8 > chunkEnd) result.errors.push('Truncated adtl subchunk header');
        }
      }
      offset = chunkEnd + (size & 1);
      if (offset > end) { result.errors.push('Missing RIFF chunk padding byte'); break; }
    }
    if (offset < end && end - offset < 8) result.errors.push('Trailing incomplete RIFF chunk header');
    for (const [id, sampleOffset] of cues) result.markers.push({ id, sampleOffset, time: result.sampleRate ? sampleOffset / result.sampleRate : null, name: labels.get(id) || '' });
    result.markers.sort((a, b) => a.sampleOffset - b.sampleOffset || a.id - b.id);
    if (result.sampleRate === null) result.errors.push('Missing valid fmt/sample rate');
    return result;
  }
  function readId(bytes, offset) { return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]); }

  function encodeWavMarkerChunks(markers, sampleRate) {
    if (!markers.length) return new Uint8Array(0);
    const encoder = new TextEncoder();
    const labels = markers.map(marker => encoder.encode(marker.name || ''));
    const labelSizes = labels.map(label => label.length ? 4 + label.length + 1 : 0);
    const cueSize = 4 + markers.length * 24;
    const listSize = 4 + labelSizes.reduce((sum, size) => sum + (size ? 8 + size + (size & 1) : 0), 0);
    const hasLabels = labelSizes.some(size => size > 0);
    const bytes = new Uint8Array(8 + cueSize + (hasLabels ? 8 + listSize : 0));
    const view = new DataView(bytes.buffer);
    const writeId = (offset, id) => {
      for (let i = 0; i < id.length; i++) bytes[offset + i] = id.charCodeAt(i);
    };
    writeId(0, 'cue ');
    view.setUint32(4, cueSize, true);
    view.setUint32(8, markers.length, true);
    markers.forEach((marker, index) => {
      const sample = Math.round(marker.time * sampleRate);
      if (!Number.isFinite(marker.time) || marker.time < 0 || !Number.isSafeInteger(sample) || sample > 0xffffffff) {
        throw new RangeError('WAV marker position is out of range');
      }
      const offset = 12 + index * 24;
      view.setUint32(offset, index + 1, true);
      view.setUint32(offset + 4, sample, true);
      writeId(offset + 8, 'data');
      view.setUint32(offset + 20, sample, true);
    });
    if (hasLabels) {
      let offset = 8 + cueSize;
      writeId(offset, 'LIST');
      view.setUint32(offset + 4, listSize, true);
      writeId(offset + 8, 'adtl');
      offset += 12;
      labels.forEach((label, index) => {
        const size = labelSizes[index];
        if (!size) return;
        writeId(offset, 'labl');
        view.setUint32(offset + 4, size, true);
        view.setUint32(offset + 8, index + 1, true);
        bytes.set(label, offset + 12);
        offset += 8 + size + (size & 1);
      });
    }
    return bytes;
  }
  return { parseAudioMarkers, encodeWavMarkerChunks };
});


