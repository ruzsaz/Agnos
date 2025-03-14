#!/bin/bash

cd /home/ruzsaz/IdeaProjects/Agnos/Agnos/public_html/less
for f in *.less; do
    echo "Processing $f...";
    /usr/bin/lessc $f ../css/${f%.*}.css --source-map
done
