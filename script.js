// WICG Shape Detection API
// https://wicg.github.io/shape-detection-api/
let picks = JSON.parse(sessionStorage.getItem('picks')) || [];
try {
  const start = document.getElementById('start');
  const video = document.getElementById('video');
  const result = document.getElementById('result');
  const barcodeDetector = new BarcodeDetector();
  const capture = async () => {
    try {
      const barcodes = await barcodeDetector.detect(video);
      result.textContent = barcodes.map(({
        format,
        rawValue
      }) => `${format}: ${rawValue}`).join('\n');
      barcodes.forEach((barcode) => {
        if (picks.includes(barcode.rawValue)) {
          alert(barcode.rawValue + ': match');
        }
      });
      requestAnimationFrame(capture);
    } catch (error) {
      result.textContent = error;
    }
  };

  video.addEventListener('play', () => capture());

  start.addEventListener('click', () => {
    start.disabled = true;
    (async () => {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment'
        }
      });
      const track = await media.getVideoTracks()[0];
      const flashButton = document.getElementById('flashButton');
      flashButton.addEventListener('click', function () {
        if (flashButton.textContent === 'Flash: Off') {
          track.applyConstraints({
            advanced: [{
              torch: true
            }]
          });
          flashButton.textContent = 'Flash: On';
        } else {
          track.applyConstraints({
            advanced: [{
              torch: false
            }]
          });
          flashButton.textContent = 'Flash: Off';
        }
      });
      video.srcObject = media;
    })().catch(console.error);
  }, {
    once: true
  });
} catch (error) {
  result.textContent = error;
}

function isValidBarcode(value) {
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

// function isValidBarcode(barcode) {
//   'use strict';
//   const lastDigit = Number(barcode.slice(-1));
//   let digits = [];
//   let i = 0;
//   let oddTotal = 0;
//   let evenTotal = 0;
//   let checksum = 0;
//   if (Number.isNaN(lastDigit)) {
//     return false;
//   }
//   if (barcode.length < 8 || barcode.length > 18 ||
//     (barcode.length != 8 && barcode.length != 12 &&
//       barcode.length != 13 && barcode.length != 14 &&
//       barcode.length != 18)) {
//     return false;
//   }
//   if (Number.isNaN(lastDigit)) {
//     return false;
//   }
//   digits = barcode.slice(0, -1).split('');
//   while (i < barcode.length - 1) {
//     if (Number.isNaN(digits[i])) {
//       return false;
//     }
//     if (i % 2 === 0) {
//       oddTotal += Number(digits[i]);
//     } else {
//       evenTotal += Number(digits[i]);
//     }
//     i += 1;
//   }
//   checksum = (10 - ((evenTotal + (oddTotal * 3)) % 10)) % 10;
//   return checksum === lastDigit;
// }

function filterTexts(text) {
  // if (!(/[^0-9]/).test(text) && text.length > 11 && !picks.includes(text)) {
  if (!(/[^0-9]/).test(text)) {
    if (text.length === 14) {
      text = text.slice(1);
    }
    if (isValidBarcode(text) && !picks.includes(text)) {
      picks.push(text);
    }
  }
}

function viewPicks() {
  alert('Total: ' + picks.length + '\n' + picks.join('\n'));
}

async function addPicks() {
  try {
    const textDetector = new TextDetector();
    const texts = await textDetector.detect(video);
    texts.forEach(text => filterTexts(text.rawValue));
    sessionStorage.setItem('picks', JSON.stringify(picks));
    viewPicks();
  } catch (error) {
    result.textContent = error;
  }
}

function clearPickList() {
  if (confirm('Clear pick list?')) {
    picks = [];
    sessionStorage.clear();
  }
}

async function wakeLock() {
  try {
    await navigator.wakeLock.request('screen');
    alert('Preventing sleep');
  } catch (error) {
    result.textContent = error;
  }
}

function main() {
  const addButton = document.getElementById('addButton');
  const viewButton = document.getElementById('viewButton');
  const clearButton = document.getElementById('clearButton');
  addButton.addEventListener('click', addPicks);
  viewButton.addEventListener('click', viewPicks);
  clearButton.addEventListener('click', clearPickList);
  wakeLock();
  start.click();
}

main();
