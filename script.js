// WICG Shape Detection API
// https://wicg.github.io/shape-detection-api/
let picks = [];
const log = document.querySelector('.log');
const video = document.querySelector('video');

function showPicks() {
  'use strict';
  log.textContent = `Picks: ${picks.length}\n${picks.join('\n')}`;
}

function deletePicks() {
  'use strict';
  if (confirm('Delete picks?')) {
    picks = [];
    try {
      sessionStorage.clear();
    } catch (error) {
      log.textContent = error;
    }
    showPicks();
  }
}

function isValidBarcode(value) {
  'use strict';
  // We only allow correct length barcodes
  if (!value.match(/^(\d{8}|\d{12,14})$/)) {
    return false;
  }

  const paddedValue = value.padStart(14, '0');

  let result = 0;
  for (let i = 0; i < paddedValue.length - 1; i += 1) {
    result += parseInt(paddedValue.charAt(i), 10) * ((i % 2 === 0) ? 3 : 1);
  }

  return ((10 - (result % 10)) % 10) === parseInt(paddedValue.charAt(13), 10);
}

function filterTexts(text) {
  'use strict';
  if ((/[0-9]/).test(text)) {
    if (text.length === 14) {
      // Remove padding from EAN-13
      text = text.slice(1);
    }
    if (isValidBarcode(text) && !picks.includes(text)) {
      // Article number can be valid EAN-8
      if (text.length === 8 && !confirm(`Add ${text}?`)) {
        return;
      }
      picks.push(text);
    }
  }
}

async function addPicks() {
  'use strict';
  try {
    const textDetector = new TextDetector();
    const texts = await textDetector.detect(video);
    texts.forEach(text => filterTexts(text.rawValue));
    sessionStorage.setItem('picks', JSON.stringify(picks));
    showPicks();
  } catch (error) {
    log.textContent = error;
  }
}

async function startCamera() {
  'use strict';
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'environment'
      }
    });
    const barcodeDetector = new BarcodeDetector();
    const detectBarcodes = async () => {
      try {
        const barcodes = await barcodeDetector.detect(video);
        if (barcodes.length) {
          log.textContent = barcodes.map(({
            format,
            rawValue
          }) => `${format}: ${rawValue}`).join('\n');
        }
        barcodes.forEach((barcode) => {
          if (picks.includes(barcode.rawValue)) {
            alert(`${barcode.rawValue}: match`);
          }
        });
        requestAnimationFrame(detectBarcodes);
      } catch (error) {
        log.textContent = error;
      }
    };
    const flashButton = document.querySelector('.flash-button');
    const track = await media.getVideoTracks()[0];
    const toggleFlash = () => {
      if (flashButton.textContent === 'flashlight_off') {
        track.applyConstraints({
          advanced: [{
            torch: true
          }]
        });
        flashButton.textContent = 'flashlight_on';
      } else {
        track.applyConstraints({
          advanced: [{
            torch: false
          }]
        });
        flashButton.textContent = 'flashlight_off';
      }
    };
    await navigator.wakeLock.request('screen');
    video.srcObject = media;
    video.addEventListener('play', detectBarcodes);
    flashButton.addEventListener('click', toggleFlash);
    showPicks();
  } catch (error) {
    log.textContent = error;
  }
}

function main() {
  'use strict';
  const listButton = document.querySelector('.list-button');
  const deleteButton = document.querySelector('.delete-button');
  const addButton = document.querySelector('.add-button');
  listButton.addEventListener('click', showPicks);
  deleteButton.addEventListener('click', deletePicks);
  addButton.addEventListener('click', addPicks);
  try {
    picks = JSON.parse(sessionStorage.getItem('picks')) || [];
  } catch (error) {
    log.textContent = error;
  }
  startCamera();
}

main();
