import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { colors } from '../theme/colors'
import type { SoilPolygon } from '../lib/api'

const DEFAULT_CENTER: [number, number] = [-11.2027, 17.8739] // Angola

type Props = {
  initialGeoJSON?: SoilPolygon | null
  center?: [number, number]
  onChange: (polygon: SoilPolygon | null) => void
}

function buildHtml(initialGeoJSON: SoilPolygon | null, center: [number, number]) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
  <style>
    .polygon-toolbar { background: #fff; padding: 4px; display: flex; flex-direction: column; gap: 4px; }
    .polygon-toolbar a {
      display: block; padding: 8px 10px; font-size: 13px; font-weight: 600;
      color: #1f4221; white-space: nowrap; text-decoration: none;
    }
  </style>
  <script>
    var map = L.map('map').setView([${center[0]}, ${center[1]}], 14);

    // The default double-click-to-finish gesture races with double-tap-to-zoom
    // on touch screens, which was finishing polygons after only 3 points.
    map.doubleClickZoom.disable();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    var initial = ${JSON.stringify(initialGeoJSON)};
    if (initial) {
      var initialLayer = L.geoJSON(initial).getLayers()[0];
      drawnItems.addLayer(initialLayer);
      map.fitBounds(initialLayer.getBounds(), { maxZoom: 16 });
    }

    var polygonDrawer = new L.Draw.Polygon(map, {
      allowIntersection: false,
      showArea: true,
      shapeOptions: { color: '#2b632a', weight: 3 },
    });

    var editControl = new L.Control.Draw({
      draw: false,
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(editControl);

    var Toolbar = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        var container = L.DomUtil.create('div', 'leaflet-bar polygon-toolbar');

        var drawBtn = L.DomUtil.create('a', '', container);
        drawBtn.href = '#';
        drawBtn.innerText = '✏️ Desenhar';
        var finishBtn = L.DomUtil.create('a', '', container);
        finishBtn.href = '#';
        finishBtn.innerText = '✔ Terminar';
        finishBtn.style.display = 'none';
        var cancelBtn = L.DomUtil.create('a', '', container);
        cancelBtn.href = '#';
        cancelBtn.innerText = '✕ Cancelar';
        cancelBtn.style.display = 'none';

        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.on(drawBtn, 'click', function (e) {
          L.DomEvent.preventDefault(e);
          drawnItems.clearLayers();
          polygonDrawer.enable();
        });
        L.DomEvent.on(finishBtn, 'click', function (e) {
          L.DomEvent.preventDefault(e);
          polygonDrawer.completeShape();
        });
        L.DomEvent.on(cancelBtn, 'click', function (e) {
          L.DomEvent.preventDefault(e);
          polygonDrawer.disable();
        });

        map.on(L.Draw.Event.DRAWSTART, function () {
          drawBtn.style.display = 'none';
          finishBtn.style.display = 'block';
          cancelBtn.style.display = 'block';
        });
        map.on(L.Draw.Event.DRAWSTOP, function () {
          drawBtn.style.display = 'block';
          finishBtn.style.display = 'none';
          cancelBtn.style.display = 'none';
        });

        return container;
      },
    });
    map.addControl(new Toolbar());

    function emitChange() {
      var layers = drawnItems.getLayers();
      var payload = layers.length === 0 ? null : layers[0].toGeoJSON().geometry;
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }

    map.on(L.Draw.Event.CREATED, function (e) {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      emitChange();
    });
    map.on(L.Draw.Event.EDITED, emitChange);
    map.on(L.Draw.Event.DELETED, emitChange);
  </script>
</body>
</html>`
}

export default function PolygonMapDraw({ initialGeoJSON, center, onChange }: Props) {
  const html = useMemo(
    () => buildHtml(initialGeoJSON ?? null, center ?? DEFAULT_CENTER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function handleMessage(event: WebViewMessageEvent) {
    onChange(JSON.parse(event.nativeEvent.data))
  }

  return (
    <View style={styles.container}>
      <WebView originWhitelist={['*']} source={{ html }} onMessage={handleMessage} style={styles.webview} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.leaf100,
  },
  webview: {
    flex: 1,
  },
})
