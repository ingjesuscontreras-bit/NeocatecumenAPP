/**
 * utils/generarCodigo.js
 * Genera códigos de acceso cortos pero con suficiente aleatoriedad
 * para que una comunidad no pueda "adivinar" el código de otra.
 *
 * Se excluyen caracteres ambiguos (0/O, 1/I/L) para que nadie
 * se equivoque al escribirlo a mano desde un cartel o mensaje.
 */
const CARACTERES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0,O,1,I,L

export function generarCodigoAcceso() {
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    const indice = Math.floor(Math.random() * CARACTERES.length);
    codigo += CARACTERES[indice];
    if (i === 3) codigo += '-'; // formato XXXX-XXXX, más fácil de leer
  }
  return codigo;
}
