// Pantalla de chat del Asistente Católico (sección Recursos).
// Diseño accesible: letra grande, alto contraste, botones amplios.

import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from '../components/TextoEscalable';
import { Ionicons } from '@expo/vector-icons';
import { ErrorAsistente, preguntarAlAsistente } from '../utils/asistente/gemini';
import { SUGERENCIAS } from '../utils/asistente/instrucciones';
import { COLORS } from '../theme/colors';

// Usa los colores de la app (theme/colors.js).
const C = {
  fondo: COLORS.background,
  tarjeta: COLORS.card,
  primario: COLORS.primary,
  primarioTexto: '#FFFFFF',
  texto: COLORS.text,
  textoSuave: COLORS.textMuted,
  burbujaUsuario: COLORS.primary,
  burbujaAsistente: COLORS.card,
  borde: COLORS.border,
  error: '#B00020',
};

const LIMITE_POR_SESION = 30; // preguntas máximas cada vez que se abre la app
const ESPERA_ENTRE_PREGUNTAS_MS = 3000;
const MAX_CARACTERES = 600;

let preguntasEnSesion = 0; // se reinicia al cerrar la app

const BIENVENIDA = {
  id: 'bienvenida',
  rol: 'asistente',
  texto:
    'Paz a ti. Soy el Asistente Católico. Puedo ayudarte a buscar lo que dicen la Biblia, el Catecismo, los papas, los santos y la historia de la Iglesia sobre un tema. ¿Qué te gustaría consultar?',
};

export default function AsistenteScreen({ onVolver }) {
  const [mensajes, setMensajes] = useState([BIENVENIDA]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const listaRef = useRef(null);
  const ultimoEnvioRef = useRef(0);

  const enviar = useCallback(
    async (contenido) => {
      const pregunta = (contenido ?? texto).trim();
      if (!pregunta || cargando) return;

      const ahora = Date.now();
      if (ahora - ultimoEnvioRef.current < ESPERA_ENTRE_PREGUNTAS_MS) return;

      if (preguntasEnSesion >= LIMITE_POR_SESION) {
        setMensajes((prev) => [
          ...prev,
          {
            id: `lim-${ahora}`,
            rol: 'aviso',
            texto: 'Llegaste al límite de consultas por ahora. Cierra y vuelve a abrir la app más tarde.',
          },
        ]);
        return;
      }

      ultimoEnvioRef.current = ahora;
      preguntasEnSesion += 1;

      const nuevoMensaje = { id: `u-${ahora}`, rol: 'usuario', texto: pregunta };
      const historial = [...mensajes, nuevoMensaje];
      setMensajes(historial);
      setTexto('');
      setCargando(true);

      try {
        // La bienvenida y los avisos no se envían al modelo.
        const paraModelo = historial
          .filter((m) => m.id !== 'bienvenida' && m.rol !== 'aviso')
          .map(({ rol, texto: t }) => ({ rol, texto: t }));
        const respuesta = await preguntarAlAsistente(paraModelo);
        setMensajes((prev) => [...prev, { id: `a-${Date.now()}`, rol: 'asistente', texto: respuesta }]);
      } catch (e) {
        const aviso =
          e instanceof ErrorAsistente
            ? e.mensajeParaUsuario
            : 'Ocurrió un error inesperado. Inténtalo de nuevo.';
        if (__DEV__) console.warn('[Asistente]', e?.message);
        setMensajes((prev) => [...prev, { id: `e-${Date.now()}`, rol: 'aviso', texto: aviso }]);
      } finally {
        setCargando(false);
      }
    },
    [texto, cargando, mensajes]
  );

  const nuevaConversacion = () => {
    if (cargando) return;
    setMensajes([BIENVENIDA]);
    setTexto('');
  };

  const soloBienvenida = mensajes.length === 1;

  const renderMensaje = ({ item }) => {
    if (item.rol === 'aviso') {
      return (
        <View style={styles.aviso} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={22} color={C.error} />
          <Text style={styles.avisoTexto}>{item.texto}</Text>
        </View>
      );
    }
    const esUsuario = item.rol === 'usuario';
    return (
      <View
        style={[styles.burbuja, esUsuario ? styles.burbujaUsuario : styles.burbujaAsistente]}
        accessible
        accessibilityLabel={`${esUsuario ? 'Tú' : 'Asistente'}: ${item.texto}`}
      >
        {!esUsuario && (
          <View style={styles.autor}>
            <Ionicons name="book-outline" size={18} color={C.primario} />
            <Text style={styles.autorTexto}>Asistente Católico</Text>
          </View>
        )}
        <Text selectable style={[styles.mensajeTexto, esUsuario && styles.mensajeTextoUsuario]}>
          {item.texto}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.barraTitulo}>
        {onVolver && (
          <Pressable
            onPress={onVolver}
            style={({ pressed }) => [styles.botonVolver, pressed && styles.presionado]}
            accessibilityRole="button"
            accessibilityLabel="Volver a Liturgia"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={28} color={C.primario} />
          </Pressable>
        )}
        <Text style={styles.titulo}>Asistente Católico</Text>
      </View>
      <View style={styles.cabecera}>
        <Text style={styles.nota}>
          Responde con fuentes oficiales de la Iglesia. Puede equivocarse: verifica las citas y, ante dudas
          personales, habla con tus catequistas o tu presbítero.
        </Text>
        {!soloBienvenida && (
          <Pressable
            onPress={nuevaConversacion}
            style={({ pressed }) => [styles.botonNueva, pressed && styles.presionado]}
            accessibilityRole="button"
            accessibilityLabel="Empezar una nueva conversación"
          >
            <Ionicons name="refresh" size={20} color={C.primario} />
            <Text style={styles.botonNuevaTexto}>Nueva</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listaRef}
        data={mensajes}
        keyExtractor={(m) => m.id}
        renderItem={renderMensaje}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <>
            {soloBienvenida && (
              <View style={styles.sugerencias}>
                <Text style={styles.sugerenciasTitulo}>Puedes empezar con:</Text>
                {SUGERENCIAS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => enviar(s)}
                    style={({ pressed }) => [styles.sugerencia, pressed && styles.presionado]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sugerenciaTexto}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {cargando && (
              <View style={styles.cargando} accessibilityLiveRegion="polite">
                <ActivityIndicator color={C.primario} />
                <Text style={styles.cargandoTexto}>Buscando en las fuentes…</Text>
              </View>
            )}
          </>
        }
      />

      <View style={styles.barraEntrada}>
        <TextInput
          style={styles.entrada}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe tu consulta…"
          placeholderTextColor={C.textoSuave}
          multiline
          maxLength={MAX_CARACTERES}
          editable={!cargando}
          accessibilityLabel="Escribe tu consulta"
        />
        <Pressable
          onPress={() => enviar()}
          disabled={cargando || !texto.trim()}
          style={({ pressed }) => [
            styles.botonEnviar,
            (cargando || !texto.trim()) && styles.botonDeshabilitado,
            pressed && styles.presionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Enviar consulta"
        >
          <Ionicons name="send" size={26} color={C.primarioTexto} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: C.fondo },
  barraTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.tarjeta,
  },
  botonVolver: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  titulo: { fontSize: 22, fontWeight: '800', color: C.texto },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
    backgroundColor: C.tarjeta,
  },
  nota: { flex: 1, fontSize: 14, lineHeight: 20, color: C.textoSuave },
  botonNueva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.primario,
  },
  botonNuevaTexto: { fontSize: 16, fontWeight: '600', color: C.primario },
  lista: { padding: 16, gap: 12 },
  burbuja: { maxWidth: '92%', borderRadius: 16, padding: 14 },
  burbujaUsuario: { alignSelf: 'flex-end', backgroundColor: C.burbujaUsuario },
  burbujaAsistente: {
    alignSelf: 'flex-start',
    backgroundColor: C.burbujaAsistente,
    borderWidth: 1,
    borderColor: C.borde,
  },
  autor: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  autorTexto: { fontSize: 14, fontWeight: '700', color: C.primario },
  mensajeTexto: { fontSize: 18, lineHeight: 27, color: C.texto },
  mensajeTextoUsuario: { color: C.primarioTexto },
  aviso: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#FDECEE',
    borderRadius: 12,
    padding: 12,
  },
  avisoTexto: { flex: 1, fontSize: 16, lineHeight: 23, color: C.error },
  sugerencias: { marginTop: 4, gap: 10 },
  sugerenciasTitulo: { fontSize: 16, fontWeight: '600', color: C.textoSuave },
  sugerencia: {
    backgroundColor: C.tarjeta,
    borderWidth: 1.5,
    borderColor: C.primario,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  sugerenciaTexto: { fontSize: 17, color: C.primario, fontWeight: '600' },
  cargando: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  cargandoTexto: { fontSize: 16, color: C.textoSuave },
  barraEntrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.borde,
    backgroundColor: C.tarjeta,
  },
  entrada: {
    flex: 1,
    minHeight: 52,
    maxHeight: 140,
    fontSize: 18,
    color: C.texto,
    backgroundColor: C.fondo,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borde,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
  botonEnviar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonDeshabilitado: { opacity: 0.4 },
  presionado: { opacity: 0.7 },
});
