#!/bin/bash

datenow=`date '+%Y%m%d%H%M%S'`

sed "s/em:version=\"2.0.0-[0-9.]*\"/em:version=\"2.0.0-$datenow\"/g" install.rdf > install.rdf-new
mv install.rdf-new install.rdf