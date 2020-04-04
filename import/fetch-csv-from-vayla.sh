#!/bin/bash
set -e

# APIs:
# - https://julkinen.vayla.fi/inspirepalvelu/rajoitettu/wfs?request=GetCapabilities
# - https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetCapabilities
# Data documentation: https://vayla.fi/documents/20473/38174/Merikartta-aineistojen_tietosis%C3%A4ll%C3%B6n_kuvaus.pdf/78afa9e5-8f7c-4430-b798-f9848c79123f

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $PARENT_PATH
cd ..

curl "https://julkinen.vayla.fi/inspirepalvelu/rajoitettu/wfs?request=GetFeature&outputFormat=csv&typeNames=rajoitettu:syvyyskayra_v&srsName=urn:ogc:def:crs:EPSG::4326" -o data/syvyyskayra.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/rajoitettu/wfs?request=GetFeature&outputFormat=csv&typeNames=rajoitettu:syvyysalue_a&srsName=urn:ogc:def:crs:EPSG::4326" -o data/syvyysalue.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/rajoitettu/wfs?request=GetFeature&outputFormat=csv&typeNames=rajoitettu:syvyyspiste_p&srsName=urn:ogc:def:crs:EPSG::4326" -o data/syvyyspiste.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:vaylaalueet&srsName=urn:ogc:def:crs:EPSG::4326" -o data/vaylaalueet.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:vaylat&srsName=urn:ogc:def:crs:EPSG::4326" -o data/vaylat.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:turvalaitteet&srsName=urn:ogc:def:crs:EPSG::4326" -o data/turvalaitteet.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:taululinja&srsName=urn:ogc:def:crs:EPSG::4326" -o data/taululinja.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:loistot&srsName=urn:ogc:def:crs:EPSG::4326" -o data/loistot.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:navigointilinjat&srsName=urn:ogc:def:crs:EPSG::4326" -o data/navigointilinjat.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:rantarakenteet_v&srsName=urn:ogc:def:crs:EPSG::4326" -o data/rantarakenteet.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:tutkamajakat&srsName=urn:ogc:def:crs:EPSG::4326" -o data/tutkamajakat.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:valosektorit&srsName=urn:ogc:def:crs:EPSG::4326" -o data/valosektorit.csv

curl "https://julkinen.vayla.fi/inspirepalvelu/avoin/wfs?request=GetFeature&outputFormat=csv&typeNames=avoin:vesiliikennemerkit&srsName=urn:ogc:def:crs:EPSG::4326" -o data/vesiliikennemerkit.csv

echo "Done!"
