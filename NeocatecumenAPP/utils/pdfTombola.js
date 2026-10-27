/**
 * utils/pdfTombola.js
 * Arma el PDF de los grupos de la tómbola y lo comparte.
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const escapar = (t) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const unirNombres = (nombres) => nombres.join(' y ');

export function crearHtmlTombola(titulo, grupos) {
  const bloques = grupos
    .map((g) => {
      const lista = g.unidades.length
        ? `<ul>${g.unidades.map((u) => `<li>${escapar(unirNombres(u))}</li>`).join('')}</ul>`
        : '';
      return `<section class="grupo"><h2>Grupo ${g.numero} - ${escapar(unirNombres(g.cabezaNombres))}</h2>${lista}</section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapar(titulo)}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1E1B2E; }
  h1 { font-size: 22pt; margin: 0 0 16pt; }
  h2 { font-size: 13pt; font-weight: 700; margin: 0 0 4pt; }
  ul { margin: 0; padding-left: 18pt; }
  li { font-size: 12pt; font-weight: 400; margin: 2pt 0; }
  .grupo { margin-bottom: 14pt; page-break-inside: avoid; break-inside: avoid; }
</style>
</head>
<body>
<h1>${escapar(titulo)}</h1>
${bloques}
</body>
</html>`;
}

function nombreArchivo(titulo) {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'grupos'}.pdf`;
}

export async function exportarPdfTombola(titulo, grupos) {
  const html = crearHtmlTombola(titulo, grupos);

  // Web: se abre en una pestaña nueva con la ventana de imprimir ("Guardar como PDF")
  if (Platform.OS === 'web') {
    const ventana = window.open('', '_blank');
    if (!ventana) {
      throw new Error('El navegador bloqueó la ventana nueva. Permite las ventanas emergentes para este sitio.');
    }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 300);
    return;
  }

  // Teléfono: crea el PDF con el título como nombre y abre el menú para compartir
  const { uri } = await Print.printToFileAsync({ html });
  const destino = `${FileSystem.cacheDirectory}${nombreArchivo(titulo)}`;
  await FileSystem.deleteAsync(destino, { idempotent: true });
  await FileSystem.moveAsync({ from: uri, to: destino });
  await Sharing.shareAsync(destino, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: titulo,
  });
}
