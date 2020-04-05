import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import MVT from 'ol/format/MVT'
import VectorTileLayer from 'ol/layer/VectorTile'
import VectorTileSource from 'ol/source/VectorTile'
import {Fill, Icon, Stroke, Style, Text} from 'ol/style'
import olms from 'ol-mapbox-style'
import stylefunction from 'ol-mapbox-style/dist/stylefunction'
import merikarttaMapboxStyles from './merikartta.json'
import spriteData from '../assets/sprite@2x.json'

const zoomDiv = window.document.getElementById('zoom')

const layer = new VectorTileLayer({
  declutter: false,
  source: new VectorTileSource({
    format: new MVT(),
    url: `${window.location.origin}/map/mylayer/{z}/{x}/{y}/tile.mvt`
  })
})

const map = new Map({
  layers: [],
  target: 'map',
  projection: 'EPSG:4326',
  view: new View({
    center: [2778615,8429230],
    zoom: 13
  })
})

map.on('moveend', (e) => {
  zoomDiv.innerText = map.getView().getZoom().toFixed(1)
})

const spriteImageUrl = '/assets/sprite@2x.png'
const resolutions = [78271.51696402048,39135.75848201024, 19567.87924100512,9783.93962050256,4891.96981025128,2445.98490512564, 1222.99245256282,611.49622628141,305.748113140705,152.8740565703525, 76.43702828517625,38.21851414258813,19.109257071294063,9.554628535647032, 4.777314267823516,2.388657133911758,1.194328566955879,0.5971642834779395, 0.29858214173896974,0.14929107086948487,0.07464553543474244]
stylefunction(layer, merikarttaMapboxStyles, 'composite', resolutions, spriteData, spriteImageUrl)

map.addLayer(layer)
