import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchOrderTracking, type DeliveryStop } from '../api/client'

const POLL_INTERVAL_MS = 5000

type Props = {
  orderId: number
  token: string
}

function stopIcon(stop: DeliveryStop, index: number): L.DivIcon {
  const color = stop.status === 'completed' ? '#2b632a' : stop.stop_type === 'dropoff' ? '#a56b2f' : '#c1873a'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)">${index + 1}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const TRUCK_ICON = L.divIcon({
  className: '',
  html: '<div style="background:#1f4221;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.5)">🚚</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export default function DeliveryTrackingMap({ orderId, token }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current).setView([-11.2027, 17.8739], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const stopMarkers = new L.LayerGroup().addTo(map)
    let transporterMarker: L.Marker | null = null
    let cancelled = false
    let hasFitBounds = false

    async function poll() {
      try {
        const tracking = await fetchOrderTracking(orderId, token)
        if (cancelled) return

        stopMarkers.clearLayers()
        const bounds: L.LatLngTuple[] = []

        tracking.stops.forEach((stop, index) => {
          L.marker([stop.latitude, stop.longitude], { icon: stopIcon(stop, index) })
            .addTo(stopMarkers)
            .bindPopup(stop.farm_name ?? 'Entrega')
          bounds.push([stop.latitude, stop.longitude])
        })

        if (tracking.transporter_location) {
          const { latitude, longitude } = tracking.transporter_location
          if (transporterMarker) {
            transporterMarker.setLatLng([latitude, longitude])
          } else {
            transporterMarker = L.marker([latitude, longitude], { icon: TRUCK_ICON }).addTo(map)
          }
          bounds.push([latitude, longitude])
        }

        if (!hasFitBounds && bounds.length > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
          hasFitBounds = true
        }
      } catch {
        // transient poll failures are fine, just try again next tick
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
      map.remove()
    }
  }, [orderId, token])

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-80 w-full overflow-hidden rounded-2xl border border-leaf-100"
    />
  )
}
