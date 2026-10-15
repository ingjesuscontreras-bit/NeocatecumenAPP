/**
 * data/liturgia.js
 * Dummy data de lecturas y cantos litúrgicos.
 * En una fase posterior, esto se conectaría a una fuente real
 * (ej. una API del Vaticano o una base de datos propia).
 */
export const liturgiaHoy = {
  fecha: 'Miércoles, 14 de Octubre',
  tiempoLiturgico: 'Tiempo Ordinario',
  primeraLectura: {
    referencia: 'Romanos 2, 1-11',
    resumen:
      'San Pablo advierte que Dios juzga a cada uno según sus obras, sin hacer distinción de personas.',
  },
  salmo: {
    referencia: 'Salmo 61',
    estribillo: 'Tú pagas a cada uno según sus obras.',
  },
  evangelio: {
    referencia: 'Lucas 11, 42-46',
    resumen:
      'Jesús reprende a los fariseos y maestros de la ley por su hipocresía religiosa.',
  },
  cantos: [
    { id: 'c1', titulo: 'Entrada: Cantemos al Señor' },
    { id: 'c2', titulo: 'Ofertorio: Te Ofrecemos, Padre Bueno' },
    { id: 'c3', titulo: 'Comunión: Pescador de Hombres' },
    { id: 'c4', titulo: 'Salida: Id y Enseñad' },
  ],
};
