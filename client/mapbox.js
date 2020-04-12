import merikarttaMapboxStyles from './merikartta.json'

const mapboxgl = window.mapboxgl

const layers = merikarttaMapboxStyles.layers
merikarttaMapboxStyles.sprite = 'http://localhost:3000/assets/sprite'
merikarttaMapboxStyles.glyphs = 'http://localhost:3000/glyphs/{fontstack}/{range}.pbf'
merikarttaMapboxStyles.sources = {}
merikarttaMapboxStyles.layers = []

const map = new mapboxgl.Map({
  container: 'map',
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
  for (const layer of layers) {
    map.addLayer(layer)
  }
})