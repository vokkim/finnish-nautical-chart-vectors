#!/usr/bin/env node

/*
  Fetch, filter and clean Maanmittauslaitos data sets.

  Some data set documentation:
  https://www.maanmittauslaitos.fi/sites/maanmittauslaitos.fi/files/attachments/2018/03/Maastotietokohteet_0.pdf
  https://www.maanmittauslaitos.fi/sites/maanmittauslaitos.fi/files/attachments/2018/05/MARA-MATI_Karttatiimi_Maastokartta_100000_koodit.pdf
*/
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const _ = require('lodash')
const {kohdeluokkaToType} = require('./enums')

const apis = [
  {
    filename: 'data/vesikivi.geojson',
    url: 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/vesikivi/items?f=json',
    properties: ['kohdeluokka']
  },
  {
    filename: 'data/hylky.geojson',
    url: 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/hylky/items?f=json',
    properties: ['kohdeluokka', 'teksti', 'mtk_id'],
    mergeWith: {
      url: 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/hylynsyvyys/items?f=json',
      parentReferenceId: 'hylkyviittaus',
      properties: ['teksti', 'hylkyviittaus']
    },
    processResult: (data) => {
      const features = data.features.map(feature => {
        return {
          ...feature,
          properties: {
            type: kohdeluokkaToType[feature.properties.kohdeluokka],
            teksti: feature.properties.teksti
          }
        }
      })
      return {
        type: data.type,
        features
      }
    }
  },
  {
    filename: 'data/ankkuripaikka.geojson',
    url: 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/ankkuripaikka/items?f=json',
    properties: []
  },
  /*{
    filename: 'data/korkeuskayra.geojson',
    url: 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/korkeuskayra/items?f=json',
    properties: ['korkeuskayrankorkeusarvotviittaus', 'korkeusarvo'],
    filter: (row) => row.properties.korkeusarvo <= 1000,
    autosave: true
  },*/
  {
    filename: 'data/paikannimi.geojson',
    url: 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/paikannimi/items?f=json&kohdeluokka=48112,48111,48120,36490,35070,35060,16101',
    properties: ['teksti', 'kohdeluokka', 'sijainti_piste', 'kirjasinkoko', 'kielikoodi', 'kirjasinvarikoodi'],
    processResult: (data) => {
      const featuresWithProperLocation = data.features.map(feature => {
        return {
          geometry: feature.properties.sijainti_piste,
          type: feature.type,
          properties: {
            kielikoodi: feature.properties.kielikoodi,
            kirjasinkoko: feature.properties.kirjasinkoko,
            [`teksti_${feature.properties.kielikoodi}`]: feature.properties.teksti,
            type: kohdeluokkaToType[feature.properties.kohdeluokka]
          }
        }
      })
      let features = {}
      featuresWithProperLocation.forEach(feature => {
        const key = feature.geometry.coordinates.join(',')
        if (!features[key]) {
          features[key] = feature
        } else if (!_.isEqual(features[key].properties, feature.properties)) {
          features[key].properties.teksti_swe = features[key].properties.teksti_swe || feature.properties.teksti_swe
          features[key].properties.teksti_fin = features[key].properties.teksti_fin || feature.properties.teksti_fin
          features[key].properties.kirjasinkoko = Math.max(features[key].properties.kirjasinkoko, feature.properties.kirjasinkoko)
        }
      })

      return {
        type: data.type,
        features: Object.values(features)
      }
    }
  }
]


function generator(api) {
  // Ugly result variable for lazy coders
  let result = null

  async function fetchGeoJSONData(url, api = {}) {
    const response = await axios.get(url)
    const nextUrl = response.data.links.length === 2 ? response.data.links[1].href : null
    delete response.data.links
    delete response.data.numberReturned
    delete response.data.timeStamp
    if (!result) {
      result = cleanupGeoJSON(response.data, api.properties, api.filter)
    } else {
      const cleanedJson = cleanupGeoJSON(response.data, api.properties, api.filter)
      result.features = result.features.concat(cleanedJson.features)
      console.log(`${url} :: ${result.features.length} :: ${cleanedJson.features.length}`)
    }
    return nextUrl
  }

  function cleanupGeoJSON(data, properties, filter) {
    const filteredFeatures = filter ? data.features.filter(filter) : data.features
    const features = filteredFeatures.map(feature => {
      delete feature.id
      Object.keys(feature.properties).forEach(key => {
        if (!properties.includes(key)) {
          delete feature.properties[key]
        }
      })
      return feature
    })
    return {type: data.type, features}
  }

  function mergeDatasets(parentData, childData) {
    // Ugly mutate is faster
    childData.features.forEach(feature => {
      const referenceId = feature.properties[api.mergeWith.parentReferenceId]
      if (!referenceId) {
        return feature
      }
      const referenceFeature = parentData.features.find(f => String(f.properties.mtk_id) === String(referenceId))
      if (!referenceFeature) {
        console.log('Feature:', feature)
        throw new Error('No reference feature?')
      }
      referenceFeature.properties = {...feature.properties, ...referenceFeature.properties}
    })
    return parentData
  }


  async function loopApi(url, api) {
    let nextUrl = url
    let resultSize = 0
    while(nextUrl !== null) {
      nextUrl = await fetchGeoJSONData(nextUrl, api)
      if (api.autosave && resultSize < result.features.length) {
        resultSize = result.features.length
        save(result, api)
      }
    }
  }

  function save(data) {
    fs.writeFileSync(path.resolve(__dirname, '../'+api.filename), JSON.stringify(data))
    console.log(`Created ${api.filename}!`)
  }

  async function run() {
    console.log(`Start ${api.filename}`)
    let mergeData = null
    if (api.mergeWith) {
      await loopApi(api.mergeWith.url, api.mergeWith)
      mergeData = result
      result = null
    }
    await loopApi(api.url, api)
    if (mergeData) {
      result = mergeDatasets(result, mergeData)
    }
    if (api.processResult) {
      result = api.processResult(result)
    }
    save(result, api)
    result = null
  }

  return run
}

apis.map(generator).forEach(run => run())
