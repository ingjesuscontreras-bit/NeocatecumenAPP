/**
 * utils/parsearHermanosTxt.js
 * -----------------------------------------------------------------------
 * Convierte el texto del archivo TXT que sube el Admin en una lista de
 * objetos "hermano" listos para guardar en Firestore.
 *
 * FORMATO ESPERADO (una persona o matrimonio por línea):
 *   Juan Pérez & María Pérez | 809-555-0101
 *   Carlos Rodríguez & Ana Rodríguez | 809-555-0202
 *   Isabel Torres | 809-555-0505
 *
 * Regla: si el nombre contiene " & ", se interpreta como matrimonio y
 * ambos quedan vinculados por "parejaId" (igual que en la Tómbola).
 * -----------------------------------------------------------------------
 */

function generarId() {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parsearHermanosTxt(textoCompleto) {
  const lineas = textoCompleto
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const hermanos = [];
  const errores = [];

  lineas.forEach((linea, index) => {
    const numeroLinea = index + 1;

    if (!linea.includes('|')) {
      errores.push(`Línea ${numeroLinea}: falta el símbolo "|" antes del teléfono.`);
      return;
    }

    const [parteNombres, parteTelefono] = linea.split('|').map((p) => p.trim());

    if (!parteNombres) {
      errores.push(`Línea ${numeroLinea}: falta el nombre.`);
      return;
    }

    const telefono = parteTelefono || '';

    if (parteNombres.includes(' & ')) {
      // Es un matrimonio: dos hermanos vinculados
      const [nombre1, nombre2] = parteNombres.split(' & ').map((n) => n.trim());
      const id1 = generarId();
      const id2 = generarId();

      hermanos.push({ id: id1, nombre: nombre1, telefono, parejaId: id2 });
      hermanos.push({ id: id2, nombre: nombre2, telefono, parejaId: id1 });
    } else {
      // Persona individual
      hermanos.push({ id: generarId(), nombre: parteNombres, telefono, parejaId: null });
    }
  });

  return { hermanos, errores };
}
