function shuffle(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function construirUnidades(hermanos) {
  const procesados = new Set();
  const unidades = [];

  hermanos.forEach((persona) => {
    if (procesados.has(persona.id)) return;

    if (persona.parejaId) {
      const conyuge = hermanos.find((h) => h.id === persona.parejaId);
      if (conyuge) {
        unidades.push({
          id: `pareja-${persona.id}-${conyuge.id}`,
          tipo: 'matrimonio',
          miembros: [persona, conyuge],
          etiqueta: `${persona.nombre} & ${conyuge.nombre}`,
        });
        procesados.add(persona.id);
        procesados.add(conyuge.id);
        return;
      }
    }

    unidades.push({
      id: `ind-${persona.id}`,
      tipo: 'individual',
      miembros: [persona],
      etiqueta: persona.nombre,
    });
    procesados.add(persona.id);
  });

  return unidades;
}

/**
 * Forma los grupos. Un matrimonio es una sola unidad: nunca se separa,
 * ni como cabeza ni dentro del grupo.
 * Cada grupo trae:
 *   cabezaNombres: ['Juan'] o ['Jesús', 'Ana'] si el cabeza es un matrimonio
 *   unidades: [['María'], ['Luis', 'Antonia'], ...] el resto del grupo
 *   miembros: todas las personas del grupo (incluido el cabeza)
 */
export function generarSorteo(hermanos, numGrupos, esManual, idsCabezasManual = []) {
  if (!numGrupos || numGrupos < 1) {
    throw new Error('La cantidad de grupos debe ser al menos 1.');
  }

  const unidades = construirUnidades(hermanos);

  if (numGrupos > unidades.length) {
    throw new Error(
      `No se pueden formar ${numGrupos} grupos: solo hay ${unidades.length} unidades disponibles (matrimonios cuentan como 1).`
    );
  }

  let unidadesCabeza = [];
  let unidadesRestantes = [];

  if (esManual) {
    const idsCabezaSet = new Set(idsCabezasManual);
    unidadesCabeza = unidades.filter((u) => u.miembros.some((m) => idsCabezaSet.has(m.id)));

    if (unidadesCabeza.length !== numGrupos) {
      throw new Error(
        `Debes seleccionar exactamente ${numGrupos} cabeza(s) de grupo (llevas ${unidadesCabeza.length}).`
      );
    }

    const idsUnidadesCabeza = new Set(unidadesCabeza.map((u) => u.id));
    unidadesRestantes = unidades.filter((u) => !idsUnidadesCabeza.has(u.id));
  } else {
    const barajadas = shuffle(unidades);
    unidadesCabeza = barajadas.slice(0, numGrupos);
    unidadesRestantes = barajadas.slice(numGrupos);
  }

  const grupos = unidadesCabeza.map((unidadCabeza, index) => ({
    numero: index + 1,
    cabeza: unidadCabeza.etiqueta,
    cabezaNombres: unidadCabeza.miembros.map((m) => m.nombre),
    unidades: [],
    miembros: [...unidadCabeza.miembros],
  }));

  // Cada familia va al grupo con menos personas (si hay empate, a uno al azar)
  shuffle(unidadesRestantes).forEach((unidad) => {
    let minimo = Infinity;
    let candidatos = [];
    grupos.forEach((g) => {
      const n = g.miembros.length;
      if (n < minimo) {
        minimo = n;
        candidatos = [g];
      } else if (n === minimo) {
        candidatos.push(g);
      }
    });
    const destino = candidatos[Math.floor(Math.random() * candidatos.length)];
    destino.unidades.push(unidad.miembros.map((m) => m.nombre));
    destino.miembros.push(...unidad.miembros);
  });

  return grupos;
}
