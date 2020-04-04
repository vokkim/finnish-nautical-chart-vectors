#!/usr/bin/env node

/*
  Finds overlapping lines in navigointilinjat.geojson and taululinja.geojson.
  Overlapping lines are 'buffed' by radius of 50m and
  saved into a taululinjat_overlap.geojson file.
  Result can be used (after dissolving and cleanup)
  to remove overlapping lines from taululinja.geojson.
*/

const lineOverlap = require('@turf/line-overlap').default
const lineSplit = require('@turf/line-split').default
const buffer = require('@turf/buffer').default
const fs = require('fs')
const path = require('path')

const navigointilinjat = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/navigointilinjat.geojson')))
const taululinjat = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/taululinja.geojson')))

let result = null

function findNavigationLine(id) {
  return navigointilinjat.features.find(line => line.properties.GDO_GID === id)
}

function check(target) {
  const navigationLineIds = target.properties.NAVLINJAT.trim().split(',')
  navigationLineIds.forEach(id => {
    const navigationLine = findNavigationLine(id)
    if (!navigationLine) {
      return
    }
    const overlap = lineOverlap(target, navigationLine, {tolerance: 1})
    if (overlap.features.length > 0) {
      const properFeatures = overlap.features.filter(f => !f.properties.NAVLINJAT)
      if (!result) {
        result = overlap
        result.features = properFeatures
      } else {
        result.features = result.features.concat(properFeatures)
      }
    }
  })
}

taululinjat.features.map(check)

const buffered = buffer(result, 0.06)

fs.writeFileSync(path.resolve(__dirname, '../data/taululinjat_overlap.geojson'), JSON.stringify(buffered))

console.log('Done, wrote taululinjat_overlap.geojson!')
