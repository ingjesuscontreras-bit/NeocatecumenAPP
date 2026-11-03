import React from 'react';
import { COLORS } from '../theme/colors';

/**
 * Solo para la web: usa el calendario y el reloj que trae el navegador
 * (Chrome, Edge, Safari, Firefox). En el teléfono no se usa.
 *   modo: 'date' (fecha) o 'time' (hora)
 *   minimo: fecha mínima permitida (opcional, solo para 'date')
 */
const dos = (n) => String(n).padStart(2, '0');
const aFecha = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const aHora = (d) => `${dos(d.getHours())}:${dos(d.getMinutes())}`;

export default function CampoFechaWeb({ valor, onCambio, modo = 'date', minimo }) {
  const alCambiar = (evento) => {
    const texto = evento.target.value;
    if (!texto) return; // la persona borró el campo: dejamos el valor anterior
    const nuevo = new Date(valor);
    if (modo === 'date') {
      const [a, m, d] = texto.split('-').map(Number);
      nuevo.setFullYear(a, m - 1, d);
    } else {
      const [h, min] = texto.split(':').map(Number);
      nuevo.setHours(h, min, 0, 0);
    }
    if (!isNaN(nuevo.getTime())) onCambio(nuevo);
  };

  return React.createElement('input', {
    type: modo === 'date' ? 'date' : 'time',
    value: modo === 'date' ? aFecha(valor) : aHora(valor),
    min: modo === 'date' && minimo ? aFecha(minimo) : undefined,
    onChange: alCambiar,
    'aria-label': modo === 'date' ? 'Fecha' : 'Hora',
    style: {
      minHeight: 44,
      boxSizing: 'border-box',
      padding: '8px 12px',
      marginRight: 8,
      marginTop: 4,
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 8,
      backgroundColor: COLORS.background,
      color: COLORS.text,
      fontSize: 16,
      fontFamily: 'inherit',
      cursor: 'pointer',
    },
  });
}
