export async function convertToWav(fileOrBlob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBufferToWav(audioBuffer);
}

function audioBufferToWav(buffer) {
  let numOfChan = buffer.numberOfChannels;
  let len = buffer.length * numOfChan * 2 + 44;
  let out = new ArrayBuffer(len);
  let view = new DataView(out);
  let channels = [];
  let format = 1; // PCM
  let sampleRate = buffer.sampleRate;
  let p = 0;
  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(p + i, s.charCodeAt(i));
    }
    p += s.length;
  }
  writeString('RIFF');
  view.setUint32(p, 36 + buffer.length * numOfChan * 2, true); p += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(p, 16, true); p += 4;
  view.setUint16(p, format, true); p += 2;
  view.setUint16(p, numOfChan, true); p += 2;
  view.setUint32(p, sampleRate, true); p += 4;
  view.setUint32(p, sampleRate * 2 * numOfChan, true); p += 4;
  view.setUint16(p, numOfChan * 2, true); p += 2;
  view.setUint16(p, 16, true); p += 2;
  writeString('data');
  view.setUint32(p, buffer.length * numOfChan * 2, true); p += 4;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  let offset = 0;
  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(p, sample, true);
      p += 2;
    }
    offset++;
  }
  return new Blob([out], { type: 'audio/wav' });
}
