import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'

const DEFAULT_CENTER: [number, number] = [-11.2027, 17.8739] // Angola

type Props = {
  initialGeoJSON?: GeoJSON.Polygon | null
  center?: [number, number]
  onChange: (polygon: GeoJSON.Polygon | null) => void
}

export default function PolygonMapDraw({ initialGeoJSON, center, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current).setView(center ?? DEFAULT_CENTER, 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)

    if (initialGeoJSON) {
      const layer = L.geoJSON(initialGeoJSON).getLayers()[0] as L.Polygon
      drawnItems.addLayer(layer)
      map.fitBounds(layer.getBounds(), { maxZoom: 16 })
    }

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#2b632a' },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    })
    map.addControl(drawControl)

    function emitChange() {
      const layers = drawnItems.getLayers()
      if (layers.length === 0) {
        onChangeRef.current(null)
        return
      }
      const geojson = (layers[0] as L.Polygon).toGeoJSON().geometry as GeoJSON.Polygon
      onChangeRef.current(geojson)
    }

    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers()
      drawnItems.addLayer((e as L.DrawEvents.Created).layer)
      emitChange()
    })
    map.on(L.Draw.Event.EDITED, emitChange)
    map.on(L.Draw.Event.DELETED, emitChange)

    return () => {
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-96 w-full overflow-hidden rounded-2xl border border-leaf-100"
    />
  )
}
