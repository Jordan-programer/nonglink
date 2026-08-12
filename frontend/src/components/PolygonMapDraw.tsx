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

    // The default double-click-to-finish gesture races with Leaflet's
    // double-click-to-zoom, which on touch/trackpad regularly finished
    // polygons after only 3 points. We drive drawing explicitly instead.
    map.doubleClickZoom.disable()

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

    function locate() {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          map.setView([latitude, longitude], 16)
          L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#2b7de9',
            weight: 2,
            fillColor: '#2b7de9',
            fillOpacity: 0.35,
          }).addTo(map)
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      )
    }

    if (!initialGeoJSON) locate()

    const polygonDrawer = new L.Draw.Polygon(map, {
      allowIntersection: false,
      showArea: true,
      shapeOptions: { color: '#2b632a', weight: 3 },
    })

    const editControl = new L.Control.Draw({
      draw: false,
      edit: { featureGroup: drawnItems, remove: true },
    } as unknown as L.Control.DrawConstructorOptions)
    map.addControl(editControl)

    const Toolbar = L.Control.extend({
      options: { position: 'topleft' as L.ControlPosition },
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar polygon-toolbar')
        container.style.background = '#fff'
        container.style.padding = '4px'
        container.style.display = 'flex'
        container.style.flexDirection = 'column'
        container.style.gap = '4px'

        function makeButton(label: string) {
          const btn = L.DomUtil.create('a', '', container)
          btn.href = '#'
          btn.innerText = label
          btn.style.display = 'block'
          btn.style.width = 'auto'
          btn.style.height = 'auto'
          btn.style.padding = '6px 10px'
          btn.style.fontSize = '12px'
          btn.style.fontWeight = '600'
          btn.style.whiteSpace = 'nowrap'
          btn.style.color = '#1f4221'
          return btn
        }

        const drawBtn = makeButton('✏️ Desenhar polígono')
        const finishBtn = makeButton('✔ Terminar')
        const cancelBtn = makeButton('✕ Cancelar')
        const locateBtn = makeButton('📍 A minha localização')
        finishBtn.style.display = 'none'
        cancelBtn.style.display = 'none'

        L.DomEvent.disableClickPropagation(container)

        L.DomEvent.on(drawBtn, 'click', (e) => {
          L.DomEvent.preventDefault(e)
          drawnItems.clearLayers()
          polygonDrawer.enable()
        })
        L.DomEvent.on(finishBtn, 'click', (e) => {
          L.DomEvent.preventDefault(e)
          polygonDrawer.completeShape()
        })
        L.DomEvent.on(cancelBtn, 'click', (e) => {
          L.DomEvent.preventDefault(e)
          polygonDrawer.disable()
        })
        L.DomEvent.on(locateBtn, 'click', (e) => {
          L.DomEvent.preventDefault(e)
          locate()
        })

        map.on(L.Draw.Event.DRAWSTART, () => {
          drawBtn.style.display = 'none'
          finishBtn.style.display = 'block'
          cancelBtn.style.display = 'block'
        })
        map.on(L.Draw.Event.DRAWSTOP, () => {
          drawBtn.style.display = 'block'
          finishBtn.style.display = 'none'
          cancelBtn.style.display = 'none'
        })

        return container
      },
    })
    map.addControl(new Toolbar())

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
