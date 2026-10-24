const fs = require('fs');
const L = (...lineas) => lineas.join('\n');

const CAMBIOS = [
  {
    archivo: 'App.js',
    pasos: [
      {
        nombre: 'Importar Platform',
        ya: 'BackHandler, Platform, StyleSheet',
        buscar: "import { ActivityIndicator, BackHandler, StyleSheet } from 'react-native';",
        poner: "import { ActivityIndicator, BackHandler, Platform, StyleSheet } from 'react-native';",
      },
      {
        nombre: 'Importar useSafeAreaInsets',
        ya: 'useSafeAreaInsets',
        buscar: "import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';",
        poner: "import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';",
      },
      {
        nombre: 'Número ELEVAR_BARRA_ANDROID',
        ya: 'ELEVAR_BARRA_ANDROID',
        buscar: 'const Tab = createBottomTabNavigator();',
        poner: L(
          'const Tab = createBottomTabNavigator();',
          '',
          '// Cuántos puntos sube la barra inferior en Android. Súbelo si aún te queda baja.',
          'const ELEVAR_BARRA_ANDROID = 10;'
        ),
      },
      {
        nombre: 'Calcular el margen inferior en AppTabs',
        ya: 'const margenInferior',
        buscar: L('function AppTabs({ esAdmin }) {', '  return ('),
        poner: L(
          'function AppTabs({ esAdmin }) {',
          '  const insets = useSafeAreaInsets();',
          "  const margenInferior = Math.max(insets.bottom, 8) + (Platform.OS === 'android' ? ELEVAR_BARRA_ANDROID : 0);",
          '',
          '  return ('
        ),
      },
      {
        nombre: 'Altura de la barra con margen seguro',
        ya: '66 + margenInferior',
        buscar: 'tabBarStyle: { height: 78, paddingBottom: 12, paddingTop: 8 },',
        poner: L(
          'tabBarStyle: { height: 66 + margenInferior, paddingBottom: margenInferior, paddingTop: 8 },',
          '        tabBarHideOnKeyboard: true,'
        ),
      },
    ],
  },
  {
    archivo: 'components/ContactarModal.js',
    pasos: [
      {
        nombre: 'Importar useSafeAreaInsets',
        ya: 'useSafeAreaInsets',
        buscar: "import { numeroParaMarcar, numeroParaWhatsApp } from '../utils/telefono';",
        poner: L(
          "import { numeroParaMarcar, numeroParaWhatsApp } from '../utils/telefono';",
          "import { useSafeAreaInsets } from 'react-native-safe-area-context';"
        ),
      },
      {
        nombre: 'Leer el margen del sistema',
        ya: 'const insets',
        buscar: L('export default function ContactarModal({ persona, onCerrar }) {', '  const visible = !!persona;'),
        poner: L(
          'export default function ContactarModal({ persona, onCerrar }) {',
          '  const insets = useSafeAreaInsets();',
          '  const visible = !!persona;'
        ),
      },
      {
        nombre: 'Margen inferior en la hoja',
        ya: 'insets.bottom',
        buscar: '<View style={styles.hoja}>',
        poner: '<View style={[styles.hoja, { paddingBottom: SPACING.xl + insets.bottom }]}>',
      },
    ],
  },
];

const contar = (t, f) => t.split(f).length - 1;
let hayErrores = false;

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
    const veces = contar(texto, paso.buscar);
    if (veces !== 1) { console.log(`   NO SE PUDO (${veces} coincidencias): ${paso.nombre}`); hayErrores = true; continue; }
    texto = texto.replace(paso.buscar, () => paso.poner);
    cambio = true;
    console.log(`   aplicado: ${paso.nombre}`);
  }

  if (cambio) {
    const copia = `${archivo}.antes-retoques`;
    if (!fs.existsSync(copia)) fs.writeFileSync(copia, original);
    fs.writeFileSync(archivo, usaCRLF ? texto.replace(/\n/g, '\r\n') : texto);
    console.log(`   guardado (copia en ${copia})`);
  }
}

console.log(hayErrores ? '\nTerminó con avisos: lo que dice "NO SE PUDO" se hace a mano.' : '\nListo: todos los retoques están aplicados.');
process.exit(hayErrores ? 1 : 0);
