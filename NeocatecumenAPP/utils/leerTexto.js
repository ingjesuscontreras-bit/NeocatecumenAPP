/**
 * utils/leerTexto.js
 * Convierte los bytes de un archivo en texto. Primero intenta UTF-8;
 * si el archivo viene del formato antiguo de Excel (Windows), lo lee así.
 */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ABytes(b64) {
  const limpio = (b64 || '').replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((limpio.length * 3) / 4) + 3);
  let j = 0;
  for (let i = 0; i < limpio.length; i += 4) {
    const a = B64.indexOf(limpio[i]);
    const b = B64.indexOf(limpio[i + 1]);
    const c = i + 2 < limpio.length ? B64.indexOf(limpio[i + 2]) : -1;
    const d = i + 3 < limpio.length ? B64.indexOf(limpio[i + 3]) : -1;
    bytes[j++] = (a << 2) | (b >> 4);
    if (c >= 0) bytes[j++] = ((b & 15) << 4) | (c >> 2);
    if (d >= 0) bytes[j++] = ((c & 3) << 6) | d;
  }
  return bytes.subarray(0, j);
}

// Devuelve null si los bytes no son UTF-8 válido
function utf8Estricto(b) {
  let s = '';
  let i = 0;
  while (i < b.length) {
    const c = b[i];
    if (c < 0x80) {
      s += String.fromCharCode(c);
      i++;
      continue;
    }
    let n;
    let cp;
    if ((c & 0xe0) === 0xc0) {
      n = 1;
      cp = c & 0x1f;
    } else if ((c & 0xf0) === 0xe0) {
      n = 2;
      cp = c & 0x0f;
    } else if ((c & 0xf8) === 0xf0) {
      n = 3;
      cp = c & 0x07;
    } else {
      return null;
    }
    if (i + n > b.length - 1) return null;
    for (let k = 1; k <= n; k++) {
      const x = b[i + k];
      if ((x & 0xc0) !== 0x80) return null;
      cp = (cp << 6) | (x & 0x3f);
    }
    s += String.fromCodePoint(cp);
    i += n + 1;
  }
  return s;
}

// Formato antiguo de Excel en Windows: cada byte es una letra
function latin1(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

export function leerBytesComoTexto(bytes) {
  return utf8Estricto(bytes) ?? latin1(bytes);
}
