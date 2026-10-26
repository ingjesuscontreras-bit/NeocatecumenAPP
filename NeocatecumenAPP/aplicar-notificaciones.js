const fs = require('fs');
const L = (...lineas) => lineas.join('\n');
const contar = (t, f) => t.split(f).length - 1;
let hayErrores = false;

// ---------- 1) app.json ----------
console.log('\n== app.json');
try {
  const original = fs.readFileSync('app.json', 'utf8');
  const app = JSON.parse(original);
  const expo = app.expo;
  let cambio = false;

  expo.plugins = expo.plugins || [];
  const tiene = expo.plugins.some((p) => (Array.isArray(p) ? p[0] : p) === 'expo-notifications');
  if (tiene) {
    console.log('   ya estaba: plugin expo-notifications');
  } else {
    expo.plugins.push([
      'expo-notifications',
      { icon: './assets/images/notification-icon.png', color: '#4C3AAE', defaultChannel: 'default' },
    ]);
    cambio = true;
    console.log('   aplicado: plugin expo-notifications');
  }

  expo.android = expo.android || {};
  if (expo.android.googleServicesFile) {
    console.log('   ya estaba: googleServicesFile');
  } else {
    expo.android.googleServicesFile = './google-services.json';
    cambio = true;
    console.log('   aplicado: googleServicesFile');
  }

  if (cambio) {
    if (!fs.existsSync('app.json.antes-push')) fs.writeFileSync('app.json.antes-push', original);
    fs.writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');
    console.log('   guardado (copia en app.json.antes-push)');
  }
} catch (e) {
  console.log('   NO SE PUDO leer/escribir app.json:', e.message);
  hayErrores = true;
}

// ---------- 2) comprobaciones ----------
console.log('\n== Comprobaciones');
const comprobar = (ok, bien, mal) => {
  console.log(ok ? `   ok: ${bien}` : `   FALTA: ${mal}`);
  if (!ok) hayErrores = true;
};
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  comprobar(!!(pkg.dependencies || {})['expo-notifications'], 'expo-notifications instalado', 'corre  npx expo install expo-notifications');
} catch (e) {
  comprobar(false, '', 'no se pudo leer package.json');
}
comprobar(fs.existsSync('google-services.json'), 'google-services.json en la raíz', 'el archivo google-services.json (Paso A1)');
comprobar(fs.existsSync('assets/images/notification-icon.png'), 'ícono de notificación', 'corre  node crear-icono-notificacion.js  (Paso B2)');
comprobar(fs.existsSync('utils/registrarPush.js'), 'utils/registrarPush.js', 'crear utils/registrarPush.js (Paso C1)');
comprobar(fs.existsSync('utils/enviarNotificaciones.js'), 'utils/enviarNotificaciones.js', 'crear utils/enviarNotificaciones.js (Paso C1)');

// ---------- 3) archivos de código ----------
const CAMBIOS = [
  {
    archivo: 'context/ComunidadContext.js',
    pasos: [
      {
        nombre: 'Importar registrarPush',
        ya: "from '../utils/registrarPush'",
        buscar: "import { generarCodigoAcceso } from '../utils/generarCodigo';",
        poner: L("import { generarCodigoAcceso } from '../utils/generarCodigo';", "import { registrarPush } from '../utils/registrarPush';"),
      },
      {
        nombre: 'Registrar al reabrir la app (miembro ya unido)',
        ya: 'registrarPush(idGuardado',
        buscar: 'setComunidadId(idGuardado);',
        poner: L('setComunidadId(idGuardado);', '            registrarPush(idGuardado, user.uid);'),
      },
      {
        nombre: 'Registrar al unirse con el código',
        ya: 'registrarPush(idComunidad',
        buscar: 'setComunidadId(idComunidad);',
        poner: L('setComunidadId(idComunidad);', '    registrarPush(idComunidad, credenciales.user.uid);'),
      },
    ],
  },
  {
    archivo: 'components/AdminAvisos.js',
    pasos: [
      {
        nombre: 'Importar enviarNotificacionComunidad',
        ya: "from '../utils/enviarNotificaciones'",
        inicio: "import { enviarNotificacionComunidad } from '../utils/enviarNotificaciones';",
      },
      {
        nombre: 'Enviar notificación al publicar un aviso',
        ya: 'enviarNotificacionComunidad(',
        requiere: ['comunidadId', 'datos.titulo'],
        buscar: "Alert.alert('¡Publicado!', 'El aviso ya está visible para tu comunidad.');",
        poner: L(
          "enviarNotificacionComunidad(comunidadId, 'Nuevo aviso', datos.titulo);",
          "Alert.alert('¡Publicado!', 'El aviso ya está visible para tu comunidad.');"
        ),
      },
    ],
  },
  {
    archivo: 'components/AdminCelebraciones.js',
    pasos: [
      {
        nombre: 'Importar enviarNotificacionComunidad',
        ya: "from '../utils/enviarNotificaciones'",
        inicio: "import { enviarNotificacionComunidad } from '../utils/enviarNotificaciones';",
      },
      {
        nombre: 'Enviar notificación al publicar una celebración',
        ya: 'enviarNotificacionComunidad(',
        requiere: ['comunidadId'],
        buscar: "Alert.alert('¡Publicado!', 'La celebración ya está visible para tu comunidad.');",
        poner: L(
          "enviarNotificacionComunidad(comunidadId, 'Nueva celebración', 'Hay una nueva celebración en tu comunidad. Ábrela para ver los detalles.');",
          "Alert.alert('¡Publicado!', 'La celebración ya está visible para tu comunidad.');"
        ),
      },
    ],
  },
];

for (const { archivo, pasos } of CAMBIOS) {
  console.log(`\n== ${archivo}`);
  if (!fs.existsSync(archivo)) {
    console.log('   NO EXISTE: revisa que estés en la carpeta del proyecto.');
    hayErrores = true;
    continue;
  }
  const original = fs.readFileSync(archivo, 'utf8');
  const usaCRLF = original.includes('\r\n');
  let texto = original.replace(/\r*\n/g, '\n');
  let cambio = false;

  for (const paso of pasos) {
    if (texto.includes(paso.ya)) { console.log(`   ya estaba: ${paso.nombre}`); continue; }

    const faltan = (paso.requiere || []).filter((r) => !texto.includes(r));
    if (faltan.length) {
      console.log(`   NO SE PUDO (no encuentro "${faltan.join('", "')}" en el archivo): ${paso.nombre}`);
      hayErrores = true;
      continue;
    }

    if (paso.inicio) {
      texto = paso.inicio + '\n' + texto;
    } else {
      const veces = contar(texto, paso.buscar);
      if (veces !== 1) { console.log(`   NO SE PUDO (${veces} coincidencias): ${paso.nombre}`); hayErrores = true; continue; }
      texto = texto.replace(paso.buscar, () => paso.poner);
    }
    cambio = true;
    console.log(`   aplicado: ${paso.nombre}`);
  }

  if (cambio) {
    const copia = `${archivo}.antes-push`;
    if (!fs.existsSync(copia)) fs.writeFileSync(copia, original);
    fs.writeFileSync(archivo, usaCRLF ? texto.replace(/\n/g, '\r\n') : texto);
    console.log(`   guardado (copia en ${copia})`);
  }
}

console.log(hayErrores
  ? '\nTerminó con avisos: lo que dice "NO SE PUDO" o "FALTA" hay que resolverlo.'
  : '\nListo: todo aplicado.');
process.exit(hayErrores ? 1 : 0);
