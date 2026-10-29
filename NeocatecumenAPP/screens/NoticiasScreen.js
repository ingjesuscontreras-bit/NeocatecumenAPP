import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import Text from '../components/TextoEscalable';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FUENTES, obtenerTitulares, formatoFecha } from '../utils/noticias';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

const CLAVE_CERRADAS = 'neocatecumenapp:noticiasCerradas';

async function abrirEnlace(url) {
  if (!/^https?:\/\//i.test(url)) {
    Alert.alert('Enlace no válido', 'Solo se pueden abrir enlaces web (http o https).');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('No se pudo abrir el enlace', 'Revisa tu conexión e inténtalo de nuevo.');
  }
}

function Fuente({ fuente, titulares, cargando, abierta, onAlternar }) {
  return (
    <View style={styles.card}>
      <View style={[styles.encabezado, !abierta && { marginBottom: 0 }]}>
        <TouchableOpacity
          style={styles.zonaTitulo}
          onPress={onAlternar}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${abierta ? 'Ocultar' : 'Mostrar'} ${fuente.nombre}`}
          accessibilityState={{ expanded: abierta }}
        >
          <Text style={styles.fuenteNombre}>{fuente.nombre}</Text>
          <Ionicons
            name={abierta ? 'chevron-down' : 'chevron-forward'}
            size={22}
            color={COLORS.primary}
            style={{ marginLeft: SPACING.xs }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonSitio}
          onPress={() => abrirEnlace(fuente.sitio)}
          accessibilityLabel={`Ir al sitio de ${fuente.nombre}`}
        >
          <Text style={styles.botonSitioTexto}>Ir al sitio</Text>
          <Ionicons name="open-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {abierta && (
        <>
          {cargando && titulares.length === 0 && fuente.feed && <ActivityIndicator color={COLORS.primary} />}

          {titulares.map((n, indice) => (
            <TouchableOpacity
              key={`${n.enlace}-${indice}`}
              style={styles.noticia}
              onPress={() => abrirEnlace(n.enlace)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.noticiaTitulo} numberOfLines={3}>
                  {n.titulo}
                </Text>
                {formatoFecha(n.fecha) ? <Text style={styles.noticiaFecha}>{formatoFecha(n.fecha)}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}

          {!cargando && titulares.length === 0 && (
            <Text style={styles.sinTitulares}>
              {fuente.feed
                ? 'No pudimos cargar los titulares ahora. Usa "Ir al sitio" para leer las noticias.'
                : 'Toca "Ir al sitio" para leer las noticias de esta fuente.'}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

export default function NoticiasScreen() {
  const [titulares, setTitulares] = useState({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [cerradas, setCerradas] = useState([]);

  // Recupera qué fuentes cerró esta persona la última vez
  useEffect(() => {
    AsyncStorage.getItem(CLAVE_CERRADAS)
      .then((valor) => {
        if (!valor) return;
        const lista = JSON.parse(valor);
        if (Array.isArray(lista)) setCerradas(lista);
      })
      .catch(() => {});
  }, []);

  const alternar = (id) => {
    setCerradas((prev) => {
      const nueva = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(CLAVE_CERRADAS, JSON.stringify(nueva)).catch(() => {});
      return nueva;
    });
  };

  const cargar = useCallback(async (forzar = false) => {
    const resultados = await Promise.all(FUENTES.map((f) => obtenerTitulares(f, forzar)));
    const mapa = {};
    FUENTES.forEach((f, i) => {
      mapa[f.id] = resultados[i];
    });
    setTitulares(mapa);
    setCargando(false);
    setRefrescando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar(false);
    }, [cargar])
  );

  const delCamino = FUENTES.filter((f) => f.categoria === 'camino');
  const deLaIglesia = FUENTES.filter((f) => f.categoria === 'iglesia');

  const pintar = (f) => (
    <Fuente
      key={f.id}
      fuente={f}
      titulares={titulares[f.id] || []}
      cargando={cargando}
      abierta={!cerradas.includes(f.id)}
      onAlternar={() => alternar(f.id)}
    />
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargar(true);
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.titulo}>📰 Noticias</Text>
      <Text style={styles.subtitulo}>
        Toca una noticia para leerla completa. Toca el nombre de una fuente para ocultarla o mostrarla.
      </Text>

      <Text style={styles.seccion}>Del Camino</Text>
      {delCamino.map(pintar)}

      <Text style={styles.seccion}>De la Iglesia</Text>
      {deLaIglesia.map(pintar)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  subtitulo: { fontSize: FONT.pequeno + 1, color: COLORS.textMuted, marginBottom: SPACING.sm },
  seccion: {
    fontSize: FONT.subtitulo + 2,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  zonaTitulo: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  fuenteNombre: { flexShrink: 1, fontSize: FONT.subtitulo + 1, fontWeight: '800', color: COLORS.text },
  botonSitio: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.sm + 4,
    marginLeft: SPACING.sm,
  },
  botonSitioTexto: { color: COLORS.primary, fontSize: FONT.pequeno, fontWeight: '700', marginRight: SPACING.xs + 2 },
  noticia: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  noticiaTitulo: { fontSize: FONT.texto, fontWeight: '600', color: COLORS.text, lineHeight: 22 },
  noticiaFecha: { fontSize: FONT.pequeno - 1, color: COLORS.textMuted, marginTop: 2 },
  sinTitulares: { fontSize: FONT.pequeno, color: COLORS.textMuted, marginTop: SPACING.xs },
});