#!/bin/bash
set -e

# APIs:
# - https://julkinen.vayla.fi/inspirepalvelu/rajoitettu/wfs?request=GetCapabilities
# - https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetCapabilities
# - https://julkinen.traficom.fi/inspirepalvelu/rajoitettu/wms?request=getcapabilities
# - https://julkinen.traficom.fi/inspirepalvelu/avoin/wms?request=getcapabilities
# Data documentation: https://vayla.fi/documents/20473/38174/Merikartta-aineistojen_tietosis%C3%A4ll%C3%B6n_kuvaus.pdf/78afa9e5-8f7c-4430-b798-f9848c79123f
# Overview documentation: https://www.paikkatietohakemisto.fi/geonetwork/srv/fin/catalog.search#/metadata/1d1c8600-76bf-4e1f-bd09-b5c154ca30dc

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $PARENT_PATH
cd ..

curl "https://julkinen.traficom.fi/inspirepalvelu/rajoitettu/wfs?request=GetFeature&outputFormat=csv&typeNames=rajoitettu:DepthContour_L&srsName=urn:ogc:def:crs:EPSG::4326" -o data/syvyyskayra.csv

curl "https://julkinen.traficom.fi/inspirepalvelu/rajoitettu/wfs?request=GetFeature&outputFormat=csv&typeNames=rajoitettu:DepthArea_A&srsName=urn:ogc:def:crs:EPSG::4326" -o data/syvyysalue.csv

curl "https://julkinen.traficom.fi/inspirepalvelu/rajoitettu/wfs?request=GetFeature&outputFormat=csv&typeNames=rajoitettu:Sounding_P&srsName=urn:ogc:def:crs:EPSG::4326" -o data/syvyyspiste.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:vaylaalueet&srsName=urn:ogc:def:crs:EPSG::4326" -o data/vaylaalueet.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:vaylat&srsName=urn:ogc:def:crs:EPSG::4326" -o data/vaylat.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:turvalaitteet&srsName=urn:ogc:def:crs:EPSG::4326" -o data/turvalaitteet.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:taululinja&srsName=urn:ogc:def:crs:EPSG::4326" -o data/taululinja.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:loistot&srsName=urn:ogc:def:crs:EPSG::4326" -o data/loistot.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:navigointilinjat&srsName=urn:ogc:def:crs:EPSG::4326" -o data/navigointilinjat.csv

curl "https://julkinen.traficom.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:ShorelineConstruction_L&srsName=urn:ogc:def:crs:EPSG::4326" -o data/rantarakenteet.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:tutkamajakat&srsName=urn:ogc:def:crs:EPSG::4326" -o data/tutkamajakat.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:valosektorit&srsName=urn:ogc:def:crs:EPSG::4326" -o data/valosektorit.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:vesiliikennemerkit&srsName=urn:ogc:def:crs:EPSG::4326" -o data/vesiliikennemerkit.csv

# In case of errors, the downloaded files will contain an xml description of the error
(for i in $(ls -1 data/*.csv); do grep -q Exception $i && echo ERROR downloading $i; done)

echo "Done!"
