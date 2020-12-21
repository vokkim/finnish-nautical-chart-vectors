import merikarttaMapboxStyles from './merikartta.json'

const mapboxgl = window.mapboxgl

const merikarttaSlider = window.document.getElementById('merikartatSlider')
const s57Slider = window.document.getElementById('s57Slider')

const layers = merikarttaMapboxStyles.layers
merikarttaMapboxStyles.sprite = 'http://localhost:3000/assets/sprite'
merikarttaMapboxStyles.glyphs = 'http://localhost:3000/glyphs/{fontstack}/{range}.pbf'
merikarttaMapboxStyles.sources = {}
merikarttaMapboxStyles.layers = []

const map = new mapboxgl.Map({
  container: 'map',
  hash: true,
  style: merikarttaMapboxStyles
})


const zoomDiv = window.document.getElementById('zoom')
map.on('zoomend', (z) => zoomDiv.innerText = map.getZoom().toFixed(1))
map.on('load', () => {
  map.addSource('composite', {
    type: 'vector',
    tiles: [`${window.location.origin}/map/mylayer/{z}/{x}/{y}/tile.mvt`],
    minzoom: 1
  })
  map.addSource('merikartta', {
    type: 'raster',
    tiles: ["https://julkinen.traficom.fi/rasteripalvelu/wmts/rest/Traficom:Merikarttasarjat%20public//WGS84_Pseudo-Mercator/WGS84_Pseudo-Mercator:{z}/{y}/{x}?format=image/png"],
    minzoom: 1
  })

  map.addSource('s57', {
    type: 'raster',
    tiles: ['https://julkinen.traficom.fi/s57/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=cells&ID=27&STYLES=style-id-201&styles=style-id-202&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'],
    tileSize: 256
  })

  for (const layer of layers) {
    map.addLayer(layer)
  }
  map.addLayer({
    id: 'merikartta',
    type: 'raster',
    source: 'merikartta',
    paint: {
      'raster-opacity': 0
    },
    minzoom: 1,
    maxzoom: 22
  })

  map.addLayer({
    id: 's57',
    type: 'raster',
    source: 's57',
    paint: {
      'raster-opacity': 0
    },
    minzoom: 1,
    maxzoom: 22
  })

  merikarttaSlider.addEventListener('input', () => {
    map.setPaintProperty('merikartta', 'raster-opacity', parseInt(merikarttaSlider.value, 10) / 100)
  })
  s57Slider.addEventListener('input', () => {
    map.setPaintProperty('s57', 'raster-opacity', parseInt(s57Slider.value, 10) / 100)
  })
})