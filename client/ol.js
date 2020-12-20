import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import MVT from 'ol/format/MVT'
import TileLayer from 'ol/layer/Tile'
import {fromLonLat, toLonLat} from 'ol/proj'
import VectorTileLayer from 'ol/layer/VectorTile'
import VectorTileSource from 'ol/source/VectorTile'
import {Fill, Icon, Stroke, Style, Text} from 'ol/style'
import olms from 'ol-mapbox-style'
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS'
import stylefunction from 'ol-mapbox-style/dist/stylefunction'
import merikarttaMapboxStyles from './merikartta.json'
import spriteData from '../assets/sprite@2x.json'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'

const zoomDiv = window.document.getElementById('zoom')
const opacitySlider = window.document.getElementById('opacitySlider')

function getInitialView() {
  const hashParts = (window.location.hash || '#').substring(1).split('/').map(parseFloat)
  if (hashParts.length === 3 && hashParts.every(v => isFinite(v))) {
    const center = fromLonLat([hashParts[1], hashParts[0]])
    return {center, zoom: hashParts[2]}
  }
  return {center: fromLonLat([22.96, 59.82]), zoom: 13}
}

const layer = new VectorTileLayer({
  declutter: false,
  zIndex: 1,
  source: new VectorTileSource({
    format: new MVT(),
    url: `${window.location.origin}/map/mylayer/{z}/{x}/{y}/tile.mvt`
  })
})

const map = new Map({
  layers: [],
  target: 'map',
  projection: 'EPSG:4326',
  view: new View(getInitialView())
})

map.on('moveend', (e) => {
  const view = map.getView()
  const center = view.getCenter()
  const [longitude, latitude] = toLonLat(center)
  const zoom = view.getZoom().toFixed(1)
  zoomDiv.innerText = zoom
  window.history.pushState(null, null, `#${latitude.toFixed(4)}/${longitude.toFixed(4)}/${zoom}`)
})

const spriteImageUrl = '/assets/sprite@2x.png'
const resolutions = [78271.51696402048,39135.75848201024, 19567.87924100512,9783.93962050256,4891.96981025128,2445.98490512564, 1222.99245256282,611.49622628141,305.748113140705,152.8740565703525, 76.43702828517625,38.21851414258813,19.109257071294063,9.554628535647032, 4.777314267823516,2.388657133911758,1.194328566955879,0.5971642834779395, 0.29858214173896974,0.14929107086948487,0.07464553543474244]
stylefunction(layer, merikarttaMapboxStyles, 'composite', resolutions, spriteData, spriteImageUrl)


function addMerikarttaLayer() {
  const parser = new WMTSCapabilities()
  fetch('https://julkinen.traficom.fi/rasteripalvelu/wmts?request=getcapabilities')
    .then(response => response.text())
    .then(text => parser.read(text))
    .then(capabilities => {
      const wmtsOptions = optionsFromCapabilities(capabilities, {
        layer: 'Traficom:Merikarttasarjat public',
        matrixSet: 'WGS84_Pseudo-Mercator',
      })

      const wmtsLayer = new TileLayer({
        opacity: 1,
        source: new WMTS(wmtsOptions),
      })
      map.addLayer(wmtsLayer)
    })
}

map.addLayer(layer)
addMerikarttaLayer()

opacitySlider.addEventListener('input', (evt) => {
  layer.setOpacity(opacitySlider.value / 100)
})