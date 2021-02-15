#!/bin/bash
set -e

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $PARENT_PATH
cd ..

## Syvyysalue: Split "blue" and "white" water into own files, merge polygons and chop features up for Mapbox/PostGIS import
node_modules/mapshaper/bin/mapshaper -i data/syvyysalue.geojson -filter invert '["3","6","10"].includes(DRVAL2)' -drop fields=DRVAL2 -split-on-grid 200,500 -dissolve2 gap-fill-area=1m2 DRVAL1 -clean gap-fill-area=1m2 -merge-layers -each 'WATER="white"' -o 'data/syvyysalueet-dissolved-white.geojson'
node_modules/mapshaper/bin/mapshaper -i data/syvyysalue.geojson -filter '["3","6","10"].includes(DRVAL2)' -drop fields=DRVAL2 -split-on-grid 100,100 -dissolve DRVAL1 -clean gap-fill-area=1m2 -merge-layers -each 'WATER="blue"' -explode -o 'data/syvyysalueet-dissolved-blue.geojson'

## Syvyysalue: create flattened and heavily simplified file
node_modules/mapshaper/bin/mapshaper -i data/syvyysalue.geojson -drop fields=* -dissolve2 gap-fill-area=100m2 -explode -simplify 1% -o geojson-type=FeatureCollection data/syvyysalueet-simplified.geojson

## Calculate lowres visible ground areas
node_modules/mapshaper/bin/mapshaper -i data/ground-area-background.geojson -erase source=data/syvyysalueet-simplified.geojson -o data/visible-ground-area-lowres.geojson

# Taululinjat (remove overlaps with navigational lines)
node_modules/mapshaper/bin/mapshaper -i data/taululinja.geojson -erase source=data/taululinjat_overlap.geojson -drop fields=GDO_GID,NAVILINJAT -clean -o data/taululinja_cleaned.geojson

# Paikannimet (clip only relevant map area)
node_modules/mapshaper/bin/mapshaper -i data/paikannimi.geojson -clip source=data/map-area-mask.geojson -o data/paikannimi-clipped.geojson

# Vesikivi (clip only relevant map area)
node_modules/mapshaper/bin/mapshaper -i data/vesikivi.geojson -clip source=data/syvyysalue.geojson -o data/vesikivi-clipped.geojson

# Masto (clip only relevant map area)
node_modules/mapshaper/bin/mapshaper -i data/masto.geojson -clip source=data/map-area-mask.geojson -o data/masto-clipped.geojson

# Maastokuovion reuna
node_modules/mapshaper/bin/mapshaper -i data/maastokuvionreuna.geojson -filter invert 'kohdeluokka === 30999' -o data/maastokuvionreuna-filtered.geojson



node_modules/mapshaper/bin/mapshaper -i data/syvyysalue.geojson -filter '["3","6","10"].includes(DRVAL2)' -drop fields=DRVAL2 -each 'WATER="blue"' -o 'data/syvyysalueet-dissolved-blue.geojson'
