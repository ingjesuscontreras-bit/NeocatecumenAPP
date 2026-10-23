/**
 * utils/telefono.js
 * Prepara los números para llamar, enviar SMS o abrir WhatsApp.
 *
 * Para llamar y SMS se usa el número tal como se guardó.
 * WhatsApp exige formato internacional (código de país + número, sin "+"):
 *  - Si el número se guardó con "+" (ej. +1 809 555 0101), se respeta.
 *  - Si se guardó local (ej. 809-555-0101), se le agrega el código del país
 *    que tiene configurado el teléfono de quien lo usa.
 */
const CODIGOS_PAIS = {
  DO: '1', PR: '1', US: '1', CA: '1',
  MX: '52', ES: '34', AR: '54', BR: '55', CU: '53', PE: '51', CL: '56',
  VE: '58', CO: '57', EC: '593', PA: '507', GT: '502', HN: '504', SV: '503',
  NI: '505', CR: '506', UY: '598', PY: '595', BO: '591', IT: '39', PT: '351',
};

export function regionDelTelefono() {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // ej. "es-DO"
    const region = locale.split('-')[1];
    return region ? region.toUpperCase() : null;
  } catch (error) {
    return null;
  }
}

// Para llamar o SMS: solo dígitos y un "+" inicial (si lo tiene)
export function numeroParaMarcar(texto) {
  if (!texto) return null;
  const original = texto.trim();
  const digitos = original.replace(/\D/g, '');
  if (digitos.length < 6) return null;
  return original.startsWith('+') ? `+${digitos}` : digitos;
}

// Para WhatsApp: número internacional, solo dígitos
export function numeroParaWhatsApp(texto, region = regionDelTelefono()) {
  if (!texto) return null;
  const original = texto.trim();
  let digitos = original.replace(/\D/g, '');
  if (digitos.length < 6) return null;

  if (original.startsWith('+')) return digitos;
  if (digitos.startsWith('00')) return digitos.slice(2);

  const codigo = CODIGOS_PAIS[region];
  if (!codigo) return digitos;

  if (codigo === '1') {
    // Números de 10 dígitos (809-555-0101) → se les antepone el 1
    return digitos.length === 10 ? `1${digitos}` : digitos;
  }

  digitos = digitos.replace(/^0+/, '');
  if (digitos.startsWith(codigo) && digitos.length >= 11) return digitos;
  return `${codigo}${digitos}`;
}
