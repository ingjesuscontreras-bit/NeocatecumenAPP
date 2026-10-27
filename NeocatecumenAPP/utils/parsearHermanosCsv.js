/**
 * utils/parsearHermanosCsv.js
 * Plantilla CSV de hermanos y lectura del archivo lleno.
 * Una fila por familia: Nombre | Teléfono | Esposo(a) | Teléfono esposo(a)
 */
import { parsearHermanosTxt } from './parsearHermanosTxt';

let contador = 0;
function generarId() {
  contador += 1;
  return `h_${Date.now()}_${contador}_${Math.random().toString(36).slice(2, 6)}`;
}

export const ENCABEZADOS = ['Nombre', 'Teléfono', 'Esposo(a)', 'Teléfono esposo(a)'];

// Plantilla con punto y coma: Excel en español la abre directo en columnas.
// Las filas que empiezan con "Ejemplo" se ignoran al subir.
export function crearPlantillaCsv() {
  const filas = [
    ENCABEZADOS,
    ['Ejemplo: Juan Pérez', '8095551234', 'María López', '8095555678'],
    ['Ejemplo: Ana Gómez', '8295559999', '', ''],
  ];
  return '\uFEFF' + filas.map((f) => f.join(';')).join('\r\n') + '\r\n';
}

// Divide una línea respetando las comillas ("Pérez, Juan")
function partirLinea(linea, sep) {
  const celdas = [];
  let actual = '';
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (enComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        actual += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === sep) {
      celdas.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  celdas.push(actual);
  return celdas.map((x) => x.trim());
}

function elegirSeparador(linea) {
  const opciones = [';', ',', '\t'];
  let mejor = ';';
  let max = -1;
  for (const s of opciones) {
    const n = linea.split(s).length;
    if (n > max) {
      max = n;
      mejor = s;
    }
  }
  return mejor;
}

function limpiarTelefono(valor, nFila, errores) {
  const v = (valor || '').trim();
  if (/e\+/i.test(v)) {
    errores.push(`Fila ${nFila}: el teléfono "${v}" se dañó en Excel. Pon esa columna como Texto.`);
    return '';
  }
  return v;
}

export function parsearHermanosCsv(contenido) {
  const errores = [];
  const hermanos = [];
  let matrimonios = 0;
  let solos = 0;

  const texto = (contenido || '').replace(/^\uFEFF/, '');
  if (texto.includes('\uFFFD')) {
    errores.push('Algunos acentos o ñ no se leyeron bien. En Excel usa "Guardar como" → "CSV UTF-8".');
  }

  const lineas = texto.split(/\r\n|\n|\r/);
  const primeraUtil = lineas.find((l) => l.trim() !== '' && !/^sep=/i.test(l.trim()));
  if (!primeraUtil) return { hermanos, errores, matrimonios, solos };
  const sep = elegirSeparador(primeraUtil);

  let encabezadoVisto = false;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const nFila = i + 1;
    if (linea.trim() === '' || /^sep=/i.test(linea.trim())) continue;

    const [nombre = '', tel = '', pareja = '', telPareja = ''] = partirLinea(linea, sep);

    if (!encabezadoVisto) {
      encabezadoVisto = true;
      if (/nombre/i.test(nombre)) continue; // fila de títulos
    }
    if (!nombre && !tel && !pareja && !telPareja) continue; // fila vacía (;;;)
    if (/^ejemplo/i.test(nombre)) continue;
    if (!nombre) {
      errores.push(`Fila ${nFila}: falta el nombre, se ignoró.`);
      continue;
    }

    const telefono = limpiarTelefono(tel, nFila, errores);
    if (pareja) {
      const id1 = generarId();
      const id2 = generarId();
      const telefono2 = limpiarTelefono(telPareja, nFila, errores);
      hermanos.push({ id: id1, nombre, telefono: telefono || telefono2, parejaId: id2 });
      hermanos.push({ id: id2, nombre: pareja, telefono: telefono2 || telefono, parejaId: id1 });
      matrimonios++;
    } else {
      hermanos.push({ id: generarId(), nombre, telefono, parejaId: null });
      solos++;
    }
  }

  return { hermanos, errores, matrimonios, solos };
}

// Acepta la plantilla CSV y también el .txt de antes
export function parsearListaHermanos(contenido, nombreArchivo = '') {
  const esTxt =
    /\.txt$/i.test(nombreArchivo) ||
    (!/\.csv$/i.test(nombreArchivo) && (contenido || '').includes('|'));
  if (esTxt) {
    const r = parsearHermanosTxt(contenido);
    const matrimonios = r.hermanos.filter((h) => h.parejaId).length / 2;
    return { ...r, matrimonios, solos: r.hermanos.length - matrimonios * 2 };
  }
  return parsearHermanosCsv(contenido);
}
