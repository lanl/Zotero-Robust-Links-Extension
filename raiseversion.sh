#!/bin/bash

datenow=`date '+%Y%m%d%H%M%S'`

sed "s/em:version=\"2.0.0-[0-9.]*\"/em:version=\"2.0.0-$datenow\"/g" install.rdf > install.rdf-new
sed "s/version: 2.0.0-[0-9]*/version: 2.0.0-$datenow/g" CITATION.cff > CITATION.cff-new
mv install.rdf-new install.rdf
mv CITATION.cff-new CITATION.cff
