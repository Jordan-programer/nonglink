import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { colors } from '../theme/colors'
import { fetchOrderTracking, type OrderTracking } from '../lib/api'

const DEFAULT_CENTER: [number, number] = [-11.2027, 17.8739] // Angola
const POLL_INTERVAL_MS = 5000

type Props = {
  orderId: number
  token: string
}

function buildHtml(center: [number, number]) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${center[0]}, ${center[1]}], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    var stopMarkers = new L.LayerGroup().addTo(map);
    var transporterMarker = null;
    var hasFitBounds = false;

    function stopIcon(stop, index) {
      var color = stop.status === 'completed' ? '#2b632a' : stop.stop_type === 'dropoff' ? '#a56b2f' : '#c1873a';
      return L.divIcon({
        className: '',
        html: '<div style="background:' + color + ';color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)">' + (index + 1) + '</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    var truckIcon = L.divIcon({
      className: '',
      html: '<div style="background:#1f4221;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.5)">🚚</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    window.updateTracking = function (tracking) {
      stopMarkers.clearLayers();
      var bounds = [];

      tracking.stops.forEach(function (stop, index) {
        L.marker([stop.latitude, stop.longitude], { icon: stopIcon(stop, index) })
          .addTo(stopMarkers)
          .bindPopup(stop.farm_name || 'Entrega');
        bounds.push([stop.latitude, stop.longitude]);
      });

      if (tracking.transporter_location) {
        var lat = tracking.transporter_location.latitude;
        var lon = tracking.transporter_location.longitude;
        if (transporterMarker) {
          transporterMarker.setLatLng([lat, lon]);
        } else {
          transporterMarker = L.marker([lat, lon], { icon: truckIcon }).addTo(map);
        }
        bounds.push([lat, lon]);
      }

      if (!hasFitBounds && bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        hasFitBounds = true;
      }
    };

    window.ReactNativeWebView.postMessage('ready');
  </script>
</body>
</html>`
}

export default function DeliveryTrackingMap({ orderId, token }: Props) {
  const webviewRef = useRef<WebView>(null)
  const [mapReady, setMapReady] = useState(false)
  const html = useMemo(() => buildHtml(DEFAULT_CENTER), [])

  useEffect(() => {
    if (!mapReady) return

    let cancelled = false

    async function poll() {
      try {
        const tracking: OrderTracking = await fetchOrderTracking(orderId, token)
        if (cancelled) return
        webviewRef.current?.injectJavaScript(
          `window.updateTracking(${JSON.stringify(tracking)}); true;`,
        )
      } catch {
        // transient poll failures are fine, just try again next tick
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [mapReady, orderId, token])

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={() => setMapReady(true)}
        style={styles.webview}
      />
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
