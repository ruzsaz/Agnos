/* global Panel, d3, topojson, mapOfHungary, global, projections */

'use strict';

const mappanel = panel_map;

/**
 * Call this to make a map panel.
 *
 * @param {Object} init Initializer object
 * @returns {undefined}
 */
function panel_map(init) {
    const that = this;

    this.constructorName = "panel_map";

    // Inicializáló objektum beolvasása, feltöltése default értékekkel.
    this.defaultInit = {
        group: 0,
        position: undefined,
        dim: 0,
        val: 0,
        ratio: false,
        alternate: false,
        domain: [],
        domainr: [],
        range: undefined,
        mag: 1,
        frommg: 1
    };
    this.actualInit = global.combineObjects(that.defaultInit, init);
    this.isColorsLocked = (that.actualInit.range !== undefined);

    Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], false, !that.alternate, 0, 0); // A Panel konstruktorának meghívása.

    // Ha a kért dimenzió nem ábrázolható, keresünk egy olyat, ami igen.
    if (that.localMeta.dimensions[that.actualInit.dim].is_territorial !== 1) {
        for (let d = 0, dMax = that.localMeta.dimensions.length; d < dMax; d++) {
            if (that.localMeta.dimensions[d].is_territorial === 1) {
                that.actualInit.dim = d;
                break;
            }
        }
    }

    this.valMultiplier = 1;						// A mutatott érték szorzója.
    this.fracMultiplier = 1;					// A mutatott érték szorzója.
    this.dimToShow = that.actualInit.dim;		// A mutatott dimenzió.
    this.valToShow = that.actualInit.val;		// Az ennyiedik mutatót mutatja.
    this.valFraction = that.actualInit.ratio;	// Hányadost mutasson, vagy abszolútértéket?
    this.alternate = that.actualInit.alternate;	// Is alternate mode?
    this.mapKey = that.meta.mapKey;
    this.currentLevel = undefined;							// Az épp kirajzolt szint.
    this.maxDepth = that.localMeta.dimensions[that.dimToShow].levels - 1;	// Maximális lefúrási szint. 1: megye, 2: kistérség, 3: település

    this.imageWidthCover = 0.9 * that.width / that.w;
    this.imageHeightCover = that.height / that.h; // Ennyiszerese fedhető le a panelnek térképpel.
    this.maskId = global.randomString(12);      // A maszk réteg id-je. Véletlen, nehogy kettő azonos legyen.

    // A színskála.
    this.colorScale = d3.scaleLinear()
        .clamp(true);
    this.radiusScale = d3.scaleSqrt().range([that.minBubbleSize, that.maxBubbleSize]);

    // A színskála alacsony, magas, és opcionálisan középső elemét tartalmazó tömb.
    this.colorRange = undefined;
    if (!that.isColorsLocked) {
        that.colorRange = [that.defaultColorMin, global.colorValue(that.valToShow, that.panelSide), that.defaultColorMax];
    } else {
        that.colorRange = that.actualInit.range;
        if (that.colorRange.length === 2) {
            const mid = d3.scaleLinear().domain([0, 1]).range(that.colorRange)(0.5);
            that.colorRange[2] = that.colorRange[1];
            that.colorRange[1] = mid;
        }
    }

    // Térképdefiníció és projekció beolvasása
    const mapToUse = global.mapStore.get(that.mapKey);
    this.projection = eval(mapToUse.projection)()
        .translate([that.w / 2, that.height / 2 + that.margin.top]);
    this.topology = mapToUse.map;
    this.topology.levelsInMap = that.levelsInMap();

    // Görbegenerátor a térképrajzoláshoz.
    this.path = d3.geoPath()
        .projection(that.projection);

    // Alapréteg.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget0")
        .on('click', function () {
            that.drill();
        })
        .on('mouseover', function () {
            that.hoverOn(this);
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .append("svg:rect")
        .attr("width", that.w)
        .attr("height", that.h);

    // Színezett térkép rétege.
    this.gMapHolder = that.svg.insert("svg:g", ".title_group")
        .attr("class", "mapHolder");

    // Vízrajz rétege.
    this.gWater = that.svg.insert("svg:g", ".title_group")
        .attr("class", "mapHolder water noEvents");

    // Körök rétege.
    this.gBubbles = that.svg.insert("svg:g", ".title_group")
        .attr("class", "mapHolder bubble_group hoverControl");

    // Címkék rétege.
    this.gLabelHolder = that.svg.insert("svg:g", ".title_group")
        .attr("class", "mapHolder labels noEvents");

    // Jelkulcs rétege.
    this.gLegend = that.svg.insert("svg:g", ".title_group")
        .attr("class", "legend noEvents");

    // A dimenzió felírása.
    this.axisXCaption = that.svg.insert("svg:text", ".title_group")
        .attr("class", "dimensionLabel noEvents")
        .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");

    // A zoomolásnál nem kellő elmeket kitakaró maszk.
    this.mask = that.svg.append("svg:mask")
        .attr("id", "maskurl" + that.maskId);

    // Feliratkozás a mediátorokra.
    var med;
    med = that.mediator.subscribe("changeValue", function (id, val, ratio) {
        that.doChangeValue(id, val, ratio);
    });
    that.mediatorIds.push({"channel": "changeValue", "id": med.id});

    // Feliratkozás a dimenzióváltó mediátorra.
    med = that.mediator.subscribe("changeDimension", function (panelId, newDimId) {
        that.doChangeDimension(panelId, newDimId);
    });
    that.mediatorIds.push({"channel": "changeDimension", "id": med.id});

    // Panel regisztrálása a nyilvántartóba.
    that.mediator.publish("register", that, that.panelId, [that.dimToShow], that.preUpdate, that.update, that.getConfig);

    // Kezdeti magyarország kirajzolása.
    const box = that.path.bounds((topojson.feature(that.topology, that.topoLevel(that.topology.objects.level0)).features)[0]);
    const scalemeasure = Math.min(that.imageWidthCover / ((box[1][0] - box[0][0]) / that.w), that.imageHeightCover / ((box[1][1] - box[0][1]) / that.h));
    that.svg.selectAll(".mapHolder")
        .attr("transform", "translate(" + that.projection.translate() + ")" + "scale(" + scalemeasure + ")" + "translate(" + -(box[1][0] + box[0][0]) / 2 + "," + -(box[1][1] + box[0][1]) / 2 + ")");

    // Vízréteg kirajzolása.
    that.gWater.selectAll("path").data(topojson.feature(that.topology, that.topology.objects.viz).features)
        .enter().append("svg:path")
        .attr("class", function (d) {
            return d.geometry.type;
        })
        .attr("d", that.path)
        .attr("mask", "url(#maskurl" + that.maskId + ")");

    this.svg.selectAll(".panelControlButton").each(function() {
        this.parentNode.appendChild(this);
    })

}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    panel_map.prototype = global.subclassOf(Panel);	// A Panel metódusainak átvétele.
    panel_map.prototype.mapLabelSize = 10;			// a térképre helyezendő feliratok betűmérete.
    panel_map.prototype.mapLabelOpacity = 0.8;		// A térképre helyezendő feliratok átlátszósága.
    panel_map.prototype.legendTicks = 7;			// A jelkulcs kívánatos elemszáma. Kb. ennyi is lesz.
    panel_map.prototype.defaultColorMin = 'white';	// Az alapértelmezett skála minimumszíne.
    panel_map.prototype.defaultColorMax = 'black';	// Az alapértelmezett skála maximumszíne.
    panel_map.prototype.minBubbleSize = 0;          // Smallest circle size.
    panel_map.prototype.maxBubbleSize = 30;         // Largest circle size.
    panel_map.prototype.alternateBorderSize = 1.5;  // Border size in alternate mode.
}

//////////////////////////////////////////////////
// Kirajzolást segítő függvények
//////////////////////////////////////////////////

/**
 * Egy adatsorból meghatározza a megmutatandó értéket.
 *
 * @param {Object} d Nyers adatsor.
 * @returns {Object} Az értékek.
 */
panel_map.prototype.valueToShow = function (d) {
    const that = this;
    if (d !== undefined && d.vals !== undefined) {
        let val = (that.valFraction) ? that.fracMultiplier * d.vals[that.valToShow].sz / d.vals[that.valToShow].n : that.valMultiplier * d.vals[that.valToShow].sz;
        let origVal = val;
        if (!isFinite(parseFloat(val))) {
            val = 0;
        }
        if (isNaN(parseFloat(origVal))) {
            origVal = "???";
        }
        return {value: val, originalValue: origVal};
    } else {
        return null;
    }
};

/**
 * Legyártja az elemhez tartozó tooltipet.
 *
 * @param {Object} d Az elem.
 * @returns {String} A megjelenítendő tooltip.
 */
panel_map.prototype.getTooltip = function (d) {
    const that = this;
    const unitProperty = (d.value === 1) ? "unit" : "unitPlural";
    return that.createTooltip([{
        name: that.localMeta.dimensions[that.dimToShow].description, value: (d.name) ? d.name : _("Nincs adat")
    }], [{
        name: that.localMeta.indicators[that.valToShow].description,
        value: d.originalValue,
        dimension: ((that.valFraction) ? that.localMeta.indicators[that.valToShow].fraction[unitProperty] : that.localMeta.indicators[that.valToShow].value[unitProperty])
    }]);
};

/**
 * Egy értékhez hozzárendeli az őt kódoló színt, illetve undefiendhez a semlegest.
 *
 * @param {Number} val A reprezentálandó érték.
 * @returns {String} Az őt repreentáló szín.
 */
panel_map.prototype.colorLinear = function (val) {
    return (!isNaN(val)) ? this.colorScale(val) : global.colorNA;
};

/**
 * Beállítja az értékek ábrázolását lehetővé tevő színskálát.
 *
 * @param {Number} dMin A minimális megjelenítendő érték.
 * @param {Number} dMed A megjelenítendő középérték.
 * @param {Number} dMax A maximális megjelenítendő érték.
 * @returns {undefined}
 */
panel_map.prototype.setColorRange = function (dMin, dMed, dMax) {
    const that = this;
    const actualScaleDomain = (that.valFraction) ? that.actualInit.domainr : that.actualInit.domain;
    if (!(actualScaleDomain instanceof Array) || actualScaleDomain.length < 2) {
        that.colorScale.domain([dMin, dMed, dMax])
            .range(that.colorRange);
    } else if (actualScaleDomain.length === 2) {
        that.colorScale.domain(actualScaleDomain)
            .range([that.colorRange[0], that.colorRange[2]]);
    } else {
        that.colorScale.domain(actualScaleDomain)
            .range(that.colorRange);
    }
    that.colorScale.nice(that.legendTicks);
};

/**
 * Megkeresi egy zoomszinthez tartozó térképi elemeket.
 *
 * @param {int} level A zoomszint.
 * @returns {Object} Hozzá tartozó térképi elemkupac.
 */
panel_map.prototype.topoLevel = function (level) {

    switch (level) {
        case 1:
            return (this.maxDepth >= 1) ? this.topology.objects.level1 : this.topology.objects.level0;
        case 2:
            return (this.maxDepth >= 2) ? this.topology.objects.level2 : this.topology.objects.level1;
        case 3:
            return (this.maxDepth >= 3) ? this.topology.objects.level3 : this.topology.objects.level2;
        case 4:
            return this.topology.objects.level3;
        default:
            return this.topology.objects.level0;
    }
};

panel_map.prototype.levelsInMap = function () {
    if (this.topology === undefined || this.topology.objects === undefined || this.topology.objects.level0 === undefined) {
        return 0;
    }
    if (this.topology.objects.level1 === undefined) {
        return 1;
    }
    if (this.topology.objects.level2 === undefined) {
        return 2;
    }
    if (this.topology.objects.level3 === undefined) {
        return 3;
    }
    if (this.topology.objects.level4 === undefined) {
        return 4;
    }
    if (this.topology.objects.level5 === undefined) {
        return 5;
    }
    return 6;
}

/**
 * Megkeresi egy térképi elem-kupac közös szülőelemét a id-ja alapján.
 *
 * @param {Array} dataRows A térképi elemeket leíró adattömb.
 * @returns {Object} A szülő térképi elem.
 */
panel_map.prototype.getParent = function (dataRows) {
    let parentObj;
    if (dataRows.length > 0) {
        // Vesszük az adatkupac első elemét. Ha az épp N/A, akkor a másodikat.
        const shapeId = (dataRows[0].dims[0].id !== "N/A") ? dataRows[0].dims[0].id : (dataRows.length > 1) ? dataRows[1].dims[0].id : undefined;
        for (let level = 0; level <= this.maxDepth; level++) {
            const currentTopoLevel = this.topoLevel(level);
            if (currentTopoLevel === undefined) {
                return undefined;
            }
            const thisObj = topojson.feature(this.topology, currentTopoLevel).features.filter(function (d) {
                return shapeId === d.properties.shapeid;
            });
            if (thisObj.length > 0) {
                parentObj = topojson.feature(this.topology, this.topoLevel(level - 1)).features.filter(function (d) {
                    return thisObj[0].properties.parentid === d.properties.shapeid;
                });
                break;
            }
        }
    }
    return (parentObj === undefined) ? undefined : parentObj[0];
};

/**
 * Megkeres egy térképi element a id-ja alapján.
 *
 * @param {String} shapeId A keresett elem id-ja.
 * @returns {Feature} A térképi elem.
 */
panel_map.prototype.getSelf = function (shapeId) {
    for (let level = 0; level <= this.maxDepth; level++) {
        const thisObj = topojson.feature(this.topology, this.topoLevel(level)).features.filter(function (d) {
            return shapeId === d.properties.shapeid;
        });
        if (thisObj.length > 0) {
            return thisObj[0];
        }
    }
    return undefined;
};


//////////////////////////////////////////////////
// Rajzolási folyamat függvényei
//////////////////////////////////////////////////

/**
 * A klikkeléskor azonnal végrehajtandó animáció.
 *
 * @param {Object} drill A lefúrást leíró objektum: {dim: a fúrás dimenziója, direction: iránya (+1 fel, -1 le), fromId: az előzőleg kijelzett elem azonosítója, toId: az új elem azonosítója}
 * @returns {undefined}
 */
panel_map.prototype.preUpdate = function (drill) {
    const that = this;

    if (that.alternate) {
        if (drill.direction === -1) {
            that.gBubbles.selectAll(".bubble")
                .filter(function (d) {
                    return (d.id !== drill.toId);
                })
                .on("click", null)
                .remove();

            that.gBubbles.selectAll(".bubble_label")
                .filter(function (d) {
                    return (d.id !== drill.toId);
                })
                .remove();
        }
    } else {
        // Lefúrás esetén az adott objektum kivételével mindent törlünk.
        if (drill.direction === -1) {

            // Letöröljük a kívül eső területeket.
            that.gMapHolder.selectAll("path").filter(function (d) {
                return (d.id !== drill.toId);
            })
                .on("click", null)
                .remove();

            // A vízrajz maszkját leszűkítjük a mutatott területre.
            that.mask.selectAll("path").filter(function (d) {
                return (d.id !== drill.toId);
            }).remove();

        }

        // Ha a dimenzióban történt a változás, akkor az aktuális név kivételével minden nevet törlünk.
        if (that.dimToShow === drill.dim && that.currentLevel !== that.maxDepth + 1) {
            that.gLabelHolder.selectAll(".mapLabel").filter(function (d) {
                return (d.id !== drill.toId);
            }).remove();
        }
    }
};

/**
 * Az új adat előkészítése. A megjelenítésre kerülő térképi elemekhez
 * hozzárakja a megjelenítendő adatokat.
 *
 * @param {Array} newDataRows Az új adatsorokat tartalmazó tömb.
 * @returns {Object} .data: a térképi elemek az adatokkal, .scale: szükséges nagyítás, .origin: a középpont.
 */
panel_map.prototype.prepareData = function (newDataRows) {
    const that = this;

    // Ha nincs térképen ábrázolható adat, akkor üres választ adunk.
    if (newDataRows.length === 0 || (newDataRows[0].dims[0].id === "N/A" && newDataRows.length === 1)) {
        return undefined;
    }

    // If it contains lat/lon, then it is a bubble map.
    if (newDataRows.length > 0 && newDataRows[0].dims[0].lat !== undefined) {
        this.setAlternateSwitch(false);
        this.alternateSwitch(true);

        const intersectingFeatureIds = [];
        for (let level = 0; level < that.topology.levelsInMap; level++) {
            intersectingFeatureIds[level] = new Set();
        }

        const parentShape = topojson.feature(this.topology, this.topoLevel(0)).features[0];

        if (parentShape === undefined) {
            console.log("parentShape is undefined");
        }

        const answer = [];
        let lastFeature = undefined;
        for (let w = 0, wMax = newDataRows.length; w < wMax; w++) {
            const dataRow = newDataRows[w];
            const dim = dataRow.dims[0];
            const val = that.valueToShow(dataRow);
            const element = {};
            element.id = dim.id;
            element.uniqueId = that.currentLevel + "L" + element.id;
            element.name = dim.name.trim();
            element.value = val.value;
            element.originalValue = val.originalValue;
            const projectedPoint = that.projection([dim.lon, dim.lat]);
            element.centerX = projectedPoint[0];
            element.centerY = projectedPoint[1];
            element.tooltip = that.getTooltip(element);
            answer.push(element);

            // A kirajzolandó térképi elemek adatainak megszerzése.
            for (let level = 0; level < that.topology.levelsInMap; level++) {
                const featuresToDraw = topojson.feature(that.topology, that.topoLevel(level)).features.filter(function (d) {
                    return d3.geoContains(d, [dim.lon, dim.lat]);
                });
                if (featuresToDraw.length > 0) {
                    intersectingFeatureIds[level].add(featuresToDraw[0].properties.shapeid);
                    lastFeature = featuresToDraw[0];
                }
            }

        }

        let mapLevelToShow = 0;
        let parentShapeId = undefined;
        for (; mapLevelToShow < that.topology.levelsInMap; mapLevelToShow++) {
            if (mapLevelToShow + 1 === that.topology.levelsInMap || intersectingFeatureIds[mapLevelToShow].size > 1) {
                break;
            }
            parentShapeId = intersectingFeatureIds[mapLevelToShow].values().next().value;
        }

        const featuresToDraw = topojson.feature(that.topology, that.topoLevel(mapLevelToShow)).features.filter(function (d) {
            return parentShapeId === d.properties.parentid;
        });

        const extentX = d3.extent(answer, d => d.centerX);
        const extentY = d3.extent(answer, d => d.centerY);
        const lastFeatureExtent = that.path.bounds(lastFeature);
        extentX[0] = Math.min(lastFeatureExtent[0][0], extentX[0]);
        extentX[1] = Math.max(lastFeatureExtent[1][0], extentX[1]);
        extentY[0] = Math.min(lastFeatureExtent[0][1], extentY[0]);
        extentY[1] = Math.max(lastFeatureExtent[1][1], extentY[1]);

        const extent = [[extentX[0], extentY[0]], [extentX[1], extentY[1]]];
        const scaleMeasure = Math.min(that.imageWidthCover / ((extent[1][0] - extent[0][0]) / that.w), that.imageHeightCover / ((extent[1][1] - extent[0][1]) / that.h));

        that.radiusScale.domain([0, Math.max(0, d3.max(answer, d => d.value))]);
        that.radiusScale.range([that.minBubbleSize, that.maxBubbleSize * Math.sqrt(that.magLevel)]);

        featuresToDraw.scale = scaleMeasure;
        featuresToDraw.isLastLevel = (that.maxDepth + 1 === that.currentLevel);
        answer.scale = scaleMeasure;
        answer.isLastLevel = (that.maxDepth + 1 === that.currentLevel);
        return {
            level: mapLevelToShow,
            data: featuresToDraw,
            bubbleData: answer,
            scale: scaleMeasure,
            origin: -(extent[1][0] + extent[0][0]) / 2 + "," + -(extent[1][1] + extent[0][1]) / 2
        };

    } else {
        this.setAlternateSwitch(true);

        // Különben valódit.


        // Az épp kirajzolandó területek parent-je.
        const parentShape = (that.currentLevel !== that.maxDepth + 1) ? that.getParent(newDataRows) : that.getSelf(newDataRows[0].dims[0].id);
        if (parentShape === undefined) {
            return undefined;
        } else {
            const extent = that.path.bounds(parentShape);
            let scaleMeasure = Math.min(that.imageWidthCover / ((extent[1][0] - extent[0][0]) / that.w), that.imageHeightCover / ((extent[1][1] - extent[0][1]) / that.h));

            // A kirajzolandó térképi elemek adatainak megszerzése.
            const featuresToDraw = topojson.feature(that.topology, that.topoLevel(that.currentLevel)).features.filter(function (d) {
                return parentShape.properties.shapeid === ((that.currentLevel === that.maxDepth + 1) ? d.properties.shapeid : d.properties.parentid);
            });

            const pairedData = [];
            const bounds = that.path.bounds;
            featuresToDraw.map(function (d) {
                for (let w = 0, wMax = newDataRows.length; w < wMax; w++) {
                    if (newDataRows[w].dims[0].id === d.properties.shapeid) {
                        const datarow = newDataRows[w];
                        const b = bounds(d);
                        const val = that.valueToShow(datarow);
                        const element = {};
                        element.geometry = d.geometry;
                        element.properties = d.properties;
                        element.type = d.type;
                        element.id = datarow.dims[0].id;
                        element.uniqueId = that.currentLevel + "L" + element.id;
                        element.name = datarow.dims[0].name.trim();
                        element.value = val.value;
                        element.originalValue = val.originalValue;
                        element.centerX = isNaN((b[1][0] + b[0][0]) / 2) ? 0 : (b[1][0] + b[0][0]) / 2;
                        element.centerY = isNaN((b[1][1] + b[0][1]) / 2) ? 0 : (b[1][1] + b[0][1]) / 2;
                        element.tooltip = that.getTooltip(element);
                        pairedData.push(element);
                        break;
                    }
                }
            });

            that.radiusScale.domain([0, Math.max(0, d3.max(pairedData, d => d.value))]);
            that.radiusScale.range([that.minBubbleSize, that.maxBubbleSize * Math.sqrt(that.magLevel)]);

            pairedData.scale = scaleMeasure;
            pairedData.isLastLevel = (that.maxDepth + 1 === that.currentLevel);
            return {
                level: that.currentLevel,
                data: pairedData,
                bubbleData: pairedData,
                scale: scaleMeasure,
                origin: -(extent[1][0] + extent[0][0]) / 2 + "," + -(extent[1][1] + extent[0][1]) / 2
            };
        }
    }
};

/**
 * Új adat megérkeztekor elvégzi a panel frissítését.
 *
 * @param {Array} data Az új adat.
 * @param {Object} drill Az épp végrehajzásra kerülő fúrás.
 * @returns {undefined}
 */
panel_map.prototype.update = function (data = undefined, drill = undefined) {
    var that = this;
    that.data = data || that.data;
    drill = drill || {dim: -1, direction: 0};

    // Színséma feltöltése
    if (!that.isColorsLocked) {
        that.colorRange = [that.defaultColorMin, global.colorValue(that.valToShow, that.panelSide), that.defaultColorMax];
    }

    // A hányados kijelzés, és a szorzó felfrissítése.
    if (that.valFraction && that.localMeta.indicators[that.valToShow].fraction.hide) {
        that.valFraction = false;
    }
    if (!that.valFraction && that.localMeta.indicators[that.valToShow].value.hide) {
        that.valFraction = true;
    }
    that.valMultiplier = (isNaN(parseFloat(that.localMeta.indicators[that.valToShow].value.multiplier))) ? 1 : parseFloat(that.localMeta.indicators[that.valToShow].value.multiplier);
    that.fracMultiplier = (isNaN(parseFloat(that.localMeta.indicators[that.valToShow].fraction.multiplier))) ? 1 : parseFloat(that.localMeta.indicators[that.valToShow].fraction.multiplier);

    const tweenDuration = (drill.duration === undefined) ? global.getAnimDuration(-1, that.panelId) : drill.duration;

    that.currentLevel = (global.baseLevels[that.panelSide])[this.dimToShow].length + 1;

    const preparedData = that.prepareData(that.data.rows);

    // Ha van megjeleníthető adat, megjelenítjük.
    if (preparedData) {
        that.panic(false);

        // A színskála beállítása.
        const dataExtent = d3.extent(preparedData.data, function (d) {
            return d.value;
        });
        const dataMed = (dataExtent[0] * dataExtent[1] < 0) ? 0 : (dataExtent[0] + dataExtent[1]) / 2;
        that.setColorRange(dataExtent[0], dataMed, dataExtent[1]);

        // A kirajzoló animáció.
        const trans = d3.transition().duration(tweenDuration);

        if (that.alternate) {
            that.drawAlternateMap(preparedData, drill, trans);
            that.drawBubbles(preparedData, drill, trans);
            that.drawMapLabels(preparedData.bubbleData, trans);
        } else {
            // A rajzoló függvények meghívása.
            that.drawMap(preparedData, drill, trans);
            that.drawMapLabels(preparedData.data, trans);
            that.drawLegend(trans);
        }
        that.drawWaters(preparedData, drill, trans);
        that.drawDimensionLabel(trans);

        // A szükséges ki-bezoomolás az összes rétegen.
        if (drill.direction !== 0 || drill.dim < 0) {
            that.svg.selectAll(".mapHolder").transition(trans)
                .attr("transform", "translate(" + that.projection.translate() + ")" + "scale(" + preparedData.scale + ")" + "translate(" + preparedData.origin + ")");
        }

        // Különben pánik!	
    } else {
        that.panic(true, _("<html>Az adat térképen nem megjeleníthető.</html>"));
    }

    // Fejléc felfrissítése.
    const titleMeta = that.localMeta.indicators[that.valToShow];
    that.titleBox.update(that.valToShow, titleMeta.caption, titleMeta.value.unitPlural, titleMeta.fraction.unitPlural, that.valFraction, tweenDuration);
};

/**
 * Kirajzolja a színezett területeket.
 *
 * @param {Object} currentFeatures A kirajzolandó térképi adatok.
 * @param {Object} drill Az épp végrehajtott fúrás.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_map.prototype.drawMap = function (currentFeatures, drill, trans) {
    const that = this;

    let terrains = that.gMapHolder.selectAll(".subunit").data(currentFeatures.data, function (d) {
        return d.uniqueId;
    });

    // Kilépő területek eltüntetése.
    terrains.exit()
        .on("click", null)
        .classed("darkenable", false)
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    // Új területek kirajzolása.
    terrains = terrains.enter().append("svg:path")
        .attr("class", "subunit")
        .attr("d", that.path)
        .attr("fill", function (d) {
            return that.colorLinear(d.value);
        })
        .attr("opacity", 0)
        .merge(terrains);

    // Maradó területek animálása.
    terrains.on("click", function (d) {
        that.drill(d);
    })
        .attr("stroke-width", global.mapBorder / currentFeatures.scale)
        .classed("listener", true)
        .transition(trans)
        .attr("fill", function (d) {
            return that.colorLinear(d.value);
        })
        .attr("opacity", 1)
        .on('end', function () {
            d3.select(this).classed("darkenable", true);
        });

};

/**
 * Kirajzolja a térkép feliratait.
 *
 * @param {Object} labelData A kirajzolandó felirat adatok.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_map.prototype.drawMapLabels = function (labelData, trans) {
    const that = this;

    const textColor = global.readableColor(global.colorValue(0, that.panelSide));

    const labelArray = [];
    const anchorArray = [];

    labelData.forEach(d => {
        labelArray.push({x: d.centerX, y: d.centerY, value: d.value, name: d.name, id: d.id, isVisible: true});
        anchorArray.push({x: d.centerX, y: d.centerY, r: 10 / labelData.scale});
    });

    let labels = that.gLabelHolder.selectAll(".mapLabel").data(labelArray, d => d.id + d.name)

    labels.exit()
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    const labelsNew = labels.enter().append("svg:text")
        .attr("class", "mapLabel legend noEvents")
        .style("font-size", (that.mapLabelSize / labelData.scale) + "px")
        .attr("text-anchor", "middle")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("dy", "0.35em")
        .attr("opacity", -1);

    labels = labelsNew.merge(labels);

    labels.text(d => d.name)

    const currentScale = parseFloat(that.gLabelHolder.attr("transform").match(/scale\(([^)]+)\)/)[1]);

    for (let i = 0; i < labelArray.length; i++) {
        const label = labelArray[i];
        const labelNode = labels.filter(d => d.id === label.id);
        const sizeMultiplier = 1.1 * (that.mapLabelSize / labelData.scale) / parseFloat(labelNode.style('font-size'));
        labelNode.attr("transform", "scale(" + (labelData.scale / currentScale) + ")");
        const textBox = labelNode.nodes()[0].getBBox();
        labelNode.attr("transform", null);
        label.width = textBox.width * sizeMultiplier;
        label.height = textBox.height * sizeMultiplier;
    }

    d3.labeler()
        .move((labelArray.length > 0) ? labelArray[0].height / 5 : 0)
        .label(labelArray)
        .anchor(anchorArray)
        .width(0)
        .height(0)
        .start(500);

    labelArray.sort((a, b) => a.value - b.value);

    for (let i = labelArray.length - 1; i >= 0; i--) {
        const li = labelArray[i];
        for (let j = labelArray.length - 1; j > i; j--) {
            const lj = labelArray[j];
            const isIntersects = global.isRectanglesIntersect(li.x, li.y, li.width, li.height, lj.x, lj.y, lj.width, lj.height)
            if (lj.isVisible && isIntersects) {
                li.isVisible = false;
            }
        }
    }

    labelsNew
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);

    labels
        .each(function () {
            this.parentNode.appendChild(this)
        })
        .attr("fill", d => (that.alternate) ? textColor : global.readableColor(that.colorLinear(d.value)))
        .transition(trans)
        .style("font-size", (labelData.isLastLevel ? 2.5 : 1) * (that.mapLabelSize / labelData.scale) + "px")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("opacity", d => (d.isVisible) ? that.mapLabelOpacity : 0)
};

/**
 * Kirajzolja a színezett területeket.
 *
 * @param {Object} currentFeatures A kirajzolandó térképi adatok.
 * @param {Object} drill Az épp végrehajtott fúrás.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_map.prototype.drawAlternateMap = function (currentFeatures, drill, trans) {
    const that = this;

    const borderWidth = 2 * (1 - currentFeatures.level / that.topology.levelsInMap) * Math.max(that.alternateBorderSize, global.mapBorder) * that.magLevel / currentFeatures.scale;


    let terrains = that.gMapHolder.selectAll(".subunit").data(currentFeatures.data, function (d) {
        return d.properties.shapeid + "|" + d.properties.parentid;
    });

    // Delete the ones that are not in the new data.
    terrains.exit()
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    // Új területek kirajzolása.
    terrains = terrains.enter().append("svg:path")
        .attr("class", "subunit noEvents")
        .attr("d", that.path)
        .attr("fill", global.colorValue(that.valToShow, that.panelSide))
        .attr("opacity", 0)
        .merge(terrains);

    // Maradó területek animálása.
    terrains
        .attr("stroke-opacity", 0.85)
        .style("stroke", global.panelBackgroundColor)
        .transition(trans)
        .attr("stroke-width", borderWidth)
        .attr("fill", global.colorValue(that.valToShow, that.panelSide))
        .attr("opacity", 0.45);
};

panel_map.prototype.drawWaters = function (currentFeatures, drill, trans) {
    const that = this;

    // Fel vagy lefúrás esetén, vagy üresből rajzoláskor felfrissítjük a vízréteg maszkját.
    if (drill.direction !== 0 || drill.dim < 0) {
        const mask = that.mask.selectAll("path").data(currentFeatures.data, function (d) {
            return d.uniqueId;
        });

        mask.exit().transition()
            .delay((drill.direction === 1) ? trans.duration() : 0)
            .duration((drill.direction === 1) ? 0 : trans.duration())
            .attr("opacity", 0)
            .remove();

        mask.enter().append("svg:path")
            .attr("d", that.path)
            .attr("opacity", (drill.direction === -1) ? 1 : 0)
            .transition().duration((drill.direction === 1) ? trans.duration() : 0)
            .attr("opacity", 1);
    }
}

panel_map.prototype.drawBubbles = function (preparedData, drill, trans) {
    const that = this;

    let bubbleHolder = that.gBubbles.selectAll(".bubbleHolder").data(preparedData.bubbleData, d => d.id + d.name);

    that.gBubbles
        .classed("hoverBlock", true)
        .transition(trans)
        .on('end', function () {
            d3.select(this).classed("hoverBlock", false)
        })

    bubbleHolder.exit()
        .select(".bubble.bordered")
        .style("opacity", 0.7)
        .classed("darkenable", false);

    bubbleHolder.exit()
        .on("click", null)
        .transition(trans)
        .style("opacity", 0)
        .remove();

    const bubbleHolder_new = bubbleHolder.enter().append("svg:g")
        .attr("class", "bubbleHolder listener")
        .on("click", function (d) {
            that.drill(d);
        })

    bubbleHolder_new.append("svg:circle")
        .attr("class", "bubble shadow")
        .attr("cx", d => that.actionCenterX || ((that.actionCenterR > 0) ? 20 * (d.centerX - that.width / 2) + that.width / 2 : d.centerX))
        .attr("cy", d => that.actionCenterY || ((that.actionCenterR > 0) ? 20 * (d.centerY - that.height / 2) + that.height / 2 : d.centerY))
        .attr("r", d => that.radiusScale(d.value) / preparedData.scale)
        .attr("opacity", 0)

    bubbleHolder_new.append("svg:circle")
        .attr("class", "bubble bordered")
        .attr("cx", d => that.actionCenterX || ((that.actionCenterR > 0) ? 20 * (d.centerX - that.width / 2) + that.width / 2 : d.centerX))
        .attr("cy", d => that.actionCenterY || ((that.actionCenterR > 0) ? 20 * (d.centerY - that.height / 2) + that.height / 2 : d.centerY))
        .attr("r", d => that.radiusScale(d.value) / preparedData.scale)
        .attr("opacity", (that.actionCenterR === 0) ? 1 : 0)

    bubbleHolder = bubbleHolder_new.merge(bubbleHolder);

    bubbleHolder.sort(function (a, b) {
        return b.value - a.value;
    })
        .order();

    bubbleHolder.select(".bubble.shadow")
        .style("stroke-width", 0)
        .style("opacity", 0)
        .transition(trans)
        .attr("cx", d => d.centerX)
        .attr("cy", d => d.centerY)
        .attr("r", d => (preparedData.isLastLevel ? 2 : 1) * that.radiusScale(d.value) / preparedData.scale)
        .attr("opacity", 0)
        .style("opacity", null)

    bubbleHolder.select(".bubble.bordered")
        .style("stroke-width", global.mapBorder * that.magLevel / preparedData.scale)
        .transition(trans)
        .attr("cx", d => d.centerX)
        .attr("cy", d => d.centerY)
        .attr("r", d => (preparedData.isLastLevel ? 2 : 1) * that.radiusScale(d.value) / preparedData.scale)
        .attr("fill", d => global.color(d.id))
        .attr("opacity", 1)
        .on('end', function () {
            d3.select(this).classed("darkenable", true)
        })

};

/**
 * Jelkulcs felrajzolása a térkép alá.
 *
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_map.prototype.drawLegend = function (trans) {
    const that = this;

    // A jelkulcsban megjelenő értékek.
    let domain = that.colorScale.ticks(that.legendTicks);
    if (domain.length === 0) {
        domain = [that.colorScale.domain()[0]];
    }

    const elementWidth = that.legendWidth / domain.length;
    const elementHeight = global.legendHeight;

    // A régi jelkulcs téglalapjainak és szövegének leszedése, de csak ha az új már föléje került.
    that.gLegend.selectAll("path, text")
        .transition().delay(trans.duration()).duration(0)
        .remove();

    // Új jelkulcs felrajzolása.
    that.gLegend.selectAll().data(domain)
        .enter().append("svg:path")
        .attr("class", "bordered")
        .attr("d", function (d, i) {
            return global.rectanglePath(i * elementWidth + global.legendOffsetX, // x
                that.h - elementHeight - global.legendOffsetY, // y
                (i === domain.length - 1) ? elementWidth : elementWidth + 1, // width
                elementHeight, // height
                (i === 0) ? global.rectRounding : 0, // balfelső roundsága
                (i === domain.length - 1) ? global.rectRounding : 0, // jobbfelső
                (i === domain.length - 1) ? global.rectRounding : 0, // jobbalsó
                (i === 0) ? global.rectRounding : 0); // balalsó
        })
        .attr("fill", that.colorScale)
        .attr("opacity", 0)
        .transition(trans)
        .attr("opacity", 1);

    // A jelkulcs szövegének kiírása.
    that.gLegend.selectAll().data(domain)
        .enter().append("svg:text")
        .attr("text-anchor", "middle")
        .attr("x", function (d, i) {
            return (i * elementWidth + elementWidth / 2 + global.legendOffsetX);
        })
        .attr("y", that.h - elementHeight / 2 - global.legendOffsetY)
        .attr("dy", ".35em")
        .attr("fill", function (d) {
            return global.readableColor(that.colorScale(d));
        })
        .attr("opacity", 0)
        .text(function (d, i) {
            return global.cleverRound3(domain[i]);
        })
        .transition(trans)
        .attr("opacity", 1);

};

panel_map.prototype.drawDimensionLabel = function (trans) {
    const that = this;

    // A panel dimenziójának beállítása
    that.axisXCaption
        .text(that.localMeta.dimensions[that.dimToShow].caption)
        .attr("text-anchor", "end")
        .transition(trans).attrs({
        x: that.width, y: 0
    });
}

//////////////////////////////////////////////////
// Irányítást végző függvények
//////////////////////////////////////////////////

/**
 * Az aktuális dimenzióban történő le vagy felfúrást kezdeményező függvény.
 *
 * @param {Object} d Lefúrás esetén a lefúrás céleleme. Ha undefined, akkor felfúrásról van szó.
 * @returns {undefined}
 */
panel_map.prototype.drill = function (d = undefined) {
    global.tooltip.kill();
    const drill = {
        dim: this.dimToShow,
        direction: (d === undefined) ? 1 : -1,
        toId: (d === undefined) ? undefined : d.id,
        toName: (d === undefined) ? undefined : d.name
    };
    this.mediator.publish("drill", drill);
};

/**
 * A mutató- és hányadosválasztást végrehajtó függvény.
 *
 * @param {String} panelId A váltást végrehajtó panel azonosítója. Akkor vált, ha az övé, vagy ha undefined.
 * @param {int} value Az érték, amire váltani kell. Ha -1 akkor a következőre vált, ha undefined, nem vált.
 * @param {boolean} ratio Hányadost mutasson-e. Ha -1 akkor a másikra ugrik, ha undefined, nem vált.
 * @returns {undefined}
 */
panel_map.prototype.doChangeValue = function (panelId, value, ratio) {
    const that = this;
    if (panelId === undefined || panelId === that.panelId) {
        if (value !== undefined) {
            that.valToShow = (value === -1) ? (that.valToShow + 1) % that.localMeta.indicators.length : value;
            while (!that.localMeta.indicators[that.valToShow].isShown) {
                that.valToShow = (that.valToShow + 1) % that.localMeta.indicators.length;
            }
            that.actualInit.val = that.valToShow;
        }
        if (ratio !== undefined) {
            that.valFraction = (ratio === -1) ? !that.valFraction : ratio;
            that.actualInit.ratio = that.valFraction;
        }
        if (!that.isColorsLocked) {
            that.colorRange = [that.defaultColorMin, global.colorValue(that.valToShow, that.panelSide), that.defaultColorMax];
        }
        that.update();
        global.getConfig2();
    }
};

/**
 * A dimenzióváltást végrehajtó függvény.
 *
 * @param {String} panelId A dimenzióváltást kapó panel ID-ja.
 * @param {int} newDimId A helyére bejövő dimenzió ID-ja.
 * @returns {undefined}
 */
panel_map.prototype.doChangeDimension = function (panelId, newDimId) {
    const that = this;
    if (panelId === that.panelId) {
        if (that.localMeta.dimensions[newDimId].is_territorial === 1) {
            that.dimToShow = newDimId;
            that.actualInit.dim = that.dimToShow;
            that.mediator.publish("register", that, that.panelId, [that.dimToShow], that.preUpdate, that.update, that.getConfig);
            global.tooltip.kill();
            that.currentLevel = undefined;
            that.maxDepth = that.localMeta.dimensions[that.dimToShow].levels - 1;
            that.mediator.publish("drill", {dim: -2, direction: 0, toId: undefined});
        }
    }
};

panel_map.prototype.isAlternateSwitchEnabled = function () {
    return !(this.data === undefined || this.data.rows.length === 0 || this.data.rows[0].dims[0].lat !== undefined);
}

/**
 * Alternate - normal view switch function.
 */
panel_map.prototype.alternateSwitch = function (stateToSet = undefined) {
    if (this.isAlternateSwitchEnabled() || (stateToSet !== undefined && stateToSet !== this.alternate)) {
        const that = this;
        global.tooltip.kill();
        that.alternate = !that.alternate;
        that.gMapHolder.selectAll("path")
            .on("click", null)
            .remove();
        that.gBubbles.selectAll(".bubbleHolder")
            .on("click", null)
            .remove();
        that.gBubbles.selectAll(".bubble_label")
            .remove();
        that.gLabelHolder.selectAll(".mapLabel")
            .remove();
        that.gLegend.selectAll("path, text")
            .remove();
        that.gWater.selectAll("path")
            .style("opacity", 0)
            .transition(global.selfDuration)
            .style("opacity", 1)
        that.update();
        that.actualInit.alternate = that.alternate;
        global.getConfig2();
    }
};