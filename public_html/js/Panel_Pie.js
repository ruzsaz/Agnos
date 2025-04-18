/* global Panel, d3, global */

'use strict';

const piechartpanel = panel_pie;

/**
 * A tortadiagram konstruktora.
 *
 * @param {Object} init Inicializáló objektum.
 * @returns {panel_pie} A megkonstruált panel.
 */
function panel_pie(init) {
    const that = this;

    this.constructorName = "panel_pie";

    // Reading the initializer object, populating it with default values.
    this.defaultInit = {
        group: 0,
        position: undefined,
        dim: 0,
        val: 0,
        ratio: false,
        mag: 1,
        frommg: 1,
        sortbyvalue: false
    };
    this.actualInit = global.combineObjects(that.defaultInit, init);

    Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], true, false, 0, 0); // A Panel konstruktorának meghívása.

    this.valMultiplier = 1;						// The multiplier of the displayed value.
    this.fracMultiplier = 1;					// The multiplier of the fraction.ű
    this.dimToShow = that.actualInit.dim;		// A mutatott dimenzió.
    this.valToShow = that.actualInit.val;		// Az ennyiedik mutatót mutatja.
    this.valFraction = that.actualInit.ratio;	// Hányadost mutasson, vagy abszolútértéket?
    this.preparedData = [];						// Az ábrázolásra kerülő, feldolgozott adat.
    this.maxEntries = global.maxEntriesIn1D;    // A panel által maximálisan megjeleníthető adatok száma.

    this.radius = 0.465 * (global.panelHeight * that.magLevel - global.panelTitleHeight - 4 * global.legendOffsetY - global.legendHeight / 2); // A torta külső átmérője.
    this.innerRadius = that.radius / 3; // A torta belső átmérője.
    this.textRadius = that.radius + 14; // A szövegek körének átmérője.
    this.labelMinValue = 0.3 / that.magLevel; // Ekkora részesedés alatt semmiképp sincs kiírva a label. Százalék.

    // A tortaelmeket létrehozó függvény
    this.arc = d3.arc()
        .startAngle(function (d) {
            return d.startAngle;
        })
        .endAngle(function (d) {
            return d.endAngle;
        })
        .outerRadius(that.radius)
        .innerRadius(that.innerRadius);

    // Alapréteg.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget0")
        .on('mouseover', function () {
            that.hoverOn(this);
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .on("click", function () {
            that.drill();
        })
        .append("svg:rect")
        .attr("width", that.w)
        .attr("height", that.h);

    // A tortaszeleteket tartalmazó réteg.
    this.arc_group = that.svg.insert("svg:g", ".title_group")
        .attr("class", "arc")
        .attr("transform", "translate(" + (that.margin.left + that.width / 2) + "," + (that.margin.top + that.height / 2) + ")");

    // A szövegeket tartalmazó réteg.
    this.label_group = that.svg.insert("svg:g", ".title_group")
        .attr("class", "label_group noEvents")
        .attr("transform", "translate(" + (that.margin.left + that.width / 2) + "," + (that.margin.top + that.height / 2) + ")");

    // A panel dimenziójának ráírása.
    this.axisXCaption = that.svg.insert("svg:text", ".title_group")
        .attr("class", "dimensionLabel noEvents")
        .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");

    // Feliratkozás a mediátorokra.
    let med;
    med = that.mediator.subscribe("changeValue", function (id, val, ratio) {
        that.doChangeValue(id, val, ratio);
    });
    that.mediatorIds.push({"channel": "changeValue", "id": med.id});

    // Feliratkozás a dimenzióváltó mediátorra.
    med = that.mediator.subscribe("changeDimension", function (panelId, newDimId) {
        that.doChangeDimension(panelId, newDimId);
    });
    that.mediatorIds.push({"channel": "changeDimension", "id": med.id});

    // Registering the panel into the registry.
    that.mediator.publish("register", that, that.panelId, [that.dimToShow], that.preUpdate, that.update, that.getConfig);
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    panel_pie.prototype = global.subclassOf(Panel); // A Panel metódusainak átvétele.
    panel_pie.prototype.requiredDifferenceForX = 20; // A szövegek közötti minimális függőleges távolság.
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
panel_pie.prototype.valueToShow = function (d) {
    const that = this;
    if (d !== undefined && d.vals !== undefined) {
        var val = (that.valFraction) ? that.fracMultiplier * d.vals[that.valToShow].sz / d.vals[that.valToShow].n : that.valMultiplier * d.vals[that.valToShow].sz;
        var origVal = val;
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
 * Meghatározza a kért sorbarendezéshez szükséges comparator-függvényt.
 *
 * @returns {Function} Az adatelemek sorbarendezéséhez szükséges comparator.
 */
panel_pie.prototype.getSortingComparator = function () {
    const that = this;
    if (that.sortByValue) {
        return function (a, b) {
            const aValue = that.valueToShow(a).value;
            const bValue = that.valueToShow(b).value;
            if (aValue < bValue) return 1;
            if (aValue > bValue) return -1;
            return 0;
        };
    }
    return that.cmp;
};

/**
 * Egy elemhez tartozó tooltipet legyártó függvény;
 *
 * @param {Object} d Az elem.
 * @returns {String} A megjelenítendő tooltip.
 */
panel_pie.prototype.getTooltip = function (d) {
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
 * A tortaszelet animációját leíró függvényt meghatározó függvény.
 *
 * @param {Object} d A kérdéses tortadarab.
 * @returns {Function} A tortadarab animációját leíró függvény.
 */
panel_pie.prototype.pieTween = function (d) {
    const that = this;
    const int = d3.interpolate({
        startAngle: d.oldStartAngle - 0.0001,
        endAngle: d.oldEndAngle + 0.0001
    }, {startAngle: d.startAngle - 0.0001, endAngle: d.endAngle + 0.0001});
    return function (t) {
        const b = int(t);
        return that.arc(b);
    };
};

/**
 * A magyarázószöveg animációját leíró függvényt meghatározó függvény.
 *
 * @param {Object} d A tortadarab, amihez a szöveg tartozik.
 * @returns {Function} A szöveg animációját leíró függvény.
 */
panel_pie.prototype.textTween = function (d) {
    const that = this;
    const a = (d.oldStartAngle + d.oldEndAngle - Math.PI) / 2;
    const b = (d.startAngle + d.endAngle - Math.PI) / 2;
    const int = d3.interpolateNumber(a, b);
    return function (t) {
        const val = int(t);
        return "translate(" + (Math.cos(val) * that.textRadius) + "," + (Math.sin(val) * that.textRadius) + ")";
    };
};

/**
 * A mutató pöcök animációját leíró függvényt meghatározó függvény.
 *
 * @param {Object} d A tortadarab, amihez a pöcök tartozik.
 * @returns {Function} A pöcök animációját leíró függvény.
 */
panel_pie.prototype.tickTween = function (d) {
    const a = (d.oldStartAngle + d.oldEndAngle) / 2;
    const b = (d.startAngle + d.endAngle) / 2;
    const int = d3.interpolateNumber(a, b);
    return function (t) {
        const val = int(t);
        return "rotate(" + val * (180 / Math.PI) + ")";
    };
};

//////////////////////////////////////////////////
// Rajzolási folyamat függvényei
//////////////////////////////////////////////////

/**
 * A klikkeléskor azonnal végrehajtandó animáció.
 *
 * @param {Object} drill A lefúrást leíró objektum: {dim: a fúrás dimenziója, direction: iránya [+1 fel, -1 le], fromId: az előzőleg kijelzett elem azonosítója, toId: az új elem azonosítója}
 * @returns {undefined}
 */
panel_pie.prototype.preUpdate = function (drill) {
    const that = this;

    // If it shows a control when clicked on, produce a blinking
    if (drill.dim >= global.baseLevels[that.panelSide].length) {
        if (drill.initiator === that.panelId) {
            that.arc_group.selectAll("path").filter(function (d) {
                return (d.id === drill.toId);
            }).call(that.applyBlinking);
        }
    } else {
        if (drill.direction === -1) { // Lefúrás esetén.

            // Mindent, kivéve amibe fúrunk, letörlünk.
            that.arc_group.selectAll("path").filter(function (d) {
                return (d.id !== drill.toId);
            })
                .on("click", null)
                .remove();

            that.label_group.selectAll("line, .gPieTick").filter(function (d) {
                return (d.id !== drill.toId);
            }).remove();

        } else if (drill.direction === 1) { // Felfúrás esetén

            // Mindent letörlünk.
            that.arc_group.selectAll("path")
                .on("click", null)
                .remove();

            that.label_group.selectAll("line, .gPieTick").remove();

            // Kirajzolunk egy teljes kört a szülő színével.
            that.arc_group.selectAll("path").data([1], false)
                .enter().append("svg:path")
                .attr("class", "bar bordered darkenable")
                .attr("fill", global.color(drill.fromId))
                .attr("d", that.arc({startAngle: 0, endAngle: 2 * Math.PI}));
        }
    }
};

/**
 * Az új adat előkészítése. Meghatározza hogy mit, honnan kinyílva kell kirajzolni.
 *
 * @param {Array} oldPieData Az adat megkapása előtti adatok.
 * @param {Array} newDataRows Az új adatsorokat tartalmazó tömb.
 * @param {Object} drill Az épp végrehajtandó fúrás.
 * @returns {Array} Az új megjelenési tortaadatok.
 */
panel_pie.prototype.prepareData = function (oldPieData, newDataRows, drill) {
    const that = this;
    const level = (that.dimToShow < global.baseLevels[that.panelSide].length) ? (global.baseLevels[that.panelSide])[this.dimToShow].length : 0; // A szint, amire fúrunk.

    const comparator = that.getSortingComparator();
    const newPieData = d3.pie()
        .sort(comparator)    // Használjuk a sorbarendezést [null: nincs rendezés, egész kihagyása: érték szerinti]
        .value(function (d) {
            return that.valueToShow(d).value;
        })(newDataRows);

    let total = 0; // A mutatott összérték meghatározása.
    for (let i = 0, iMax = newDataRows.length; i < iMax; i++) {
        total += that.valueToShow(newDataRows[i]).value;
    }

    // Kidobjuk a nempozitív elemeket.
    newPieData.filter(function (d) {
        return d.value > 0;
    });

    let prevX = 0, prevY = -9999; // Az előző címke koordinátái; annak eldöntéséhez kell, hogy kifér-e az új címke.

    const openFromElement = (drill.direction === -1 && oldPieData !== undefined) ? global.getFromArrayByProperty(oldPieData, 'id', drill.toId) : null; // Ebből a régi elemből kell kinyitni mindent.
    const oldElementArc = (openFromElement) ? openFromElement.endAngle - openFromElement.startAngle : 0;

    // Bezoomolás esetén előkészülünk a rányíló animáció kezdőszögeinek meghatározására.
    let oldStartAngle = (openFromElement) ? openFromElement.startAngle : 0;
    let oldEndAngle = 0;

    let parentFound = false;

    for (let i = 0, iMax = newPieData.length; i < iMax; i++) {
        const element = newPieData[i];
        const dataRow = element.data;
        const val = that.valueToShow(dataRow);
        element.id = dataRow.dims[0].id;
        element.uniqueId = level + "L" + element.id;
        element.name = dataRow.dims[0].name.trim();
        element.value = val.value;
        element.originalValue = val.originalValue;
        element.percentage = ((element.value / total) * 100).toFixed(1);
        element.tooltip = that.getTooltip(element);

        // Eldöntjük, hogy ki kell-e írni a címkét.
        const b = (element.startAngle + element.endAngle - Math.PI) / 2;
        const x = Math.cos(b) * (that.textRadius);
        const y = Math.sin(b) * (that.textRadius);
        if ((((prevX < 0) !== (x < 0)) || Math.abs(prevY - y) > that.requiredDifferenceForX) && element.percentage > that.labelMinValue) {
            prevX = x;
            prevY = y;
            element.isTickRequired = true;
        } else {
            element.isTickRequired = false;
        }

        if (drill.direction === -1) { // Ha bezoomolás van
            element.oldStartAngle = oldStartAngle;
            element.oldEndAngle = oldStartAngle + oldElementArc * element.value / total;
            oldStartAngle = element.oldEndAngle;
        } else if (drill.direction === 1) { // Ha kizoomolás van
            if (!parentFound) {
                element.oldStartAngle = 0;
                element.oldEndAngle = 0;
            } else {
                element.oldStartAngle = 2 * Math.PI;
                element.oldEndAngle = 2 * Math.PI;
            }
            if (element.id === drill.fromId) {
                element.oldEndAngle = 2 * Math.PI;
                parentFound = true;
            }
        } else { // Ha azonos szintű változtatás van
            const oldElement = (oldPieData !== undefined) ? global.getFromArrayByProperty(oldPieData, 'id', element.id) : undefined;
            if (oldElement) {
                oldStartAngle = oldElement.startAngle;
                oldEndAngle = oldElement.endAngle;
            } else {
                oldStartAngle = oldEndAngle;
            }
            element.oldStartAngle = oldStartAngle;
            element.oldEndAngle = oldEndAngle;
        }
    }

    return newPieData;
};

/**
 * Új adat megérkeztekor levezényli a panel frissítését.
 *
 * @param {Object} data Az új adat.
 * @param {Object} drill Az épp végrehajzásra kerülő fúrás.
 * @returns {undefined}
 */
panel_pie.prototype.update = function (data, drill) {
    const that = this;
    that.data = data || that.data;
    drill = drill || {dim: -1, direction: 0};

    if (that.valFraction && that.localMeta.indicators[that.valToShow].fraction.hide) {
        that.valFraction = false;
    }
    if (!that.valFraction && that.localMeta.indicators[that.valToShow].value.hide) {
        that.valFraction = true;
    }
    that.valMultiplier = (isNaN(parseFloat(that.localMeta.indicators[that.valToShow].value.multiplier))) ? 1 : parseFloat(that.localMeta.indicators[that.valToShow].value.multiplier);
    that.fracMultiplier = (isNaN(parseFloat(that.localMeta.indicators[that.valToShow].fraction.multiplier))) ? 1 : parseFloat(that.localMeta.indicators[that.valToShow].fraction.multiplier);
    const tweenDuration = (drill.duration === undefined) ? global.getAnimDuration(-1, that.panelId) : drill.duration;

    // Ha túl sok értéket kéne megjeleníteni, pánik
    if (that.data.rows.length > that.maxEntries) {
        that.panic(true, _(that.htmlTagStarter + "A panel nem képes ") + that.data.rows.length + _(" értéket megjeleníteni.<br />A maximálisan megjeleníthető értékek száma ") + that.maxEntries + _(".</html>"));
        that.preparedData = undefined;
    } else {
        that.preparedData = that.prepareData(that.preparedData, that.data.rows, drill);
        if (that.preparedData.length > 0 && !isNaN(that.preparedData[0].percentage)) {
            that.panic(false);
            const trans = d3.transition().duration(tweenDuration);
            that.drawPie(that.preparedData, trans);
            that.drawLabels(that.preparedData, trans);
        } else {
            that.panic(true, _(that.htmlTagStarter + "A változó értéke<br />minden dimenzióban 0.</html>"));
            that.preparedData = [];
        }
    }
    var titleMeta = that.localMeta.indicators[that.valToShow];
    that.titleBox.update(that.valToShow, titleMeta.caption, titleMeta.value.unitPlural, titleMeta.fraction.unitPlural, that.valFraction, tweenDuration);
};

/**
 * A körcikkek kirajzolása, animálása.
 *
 * @param {Array} preparedData A kirajzolandó körcikkekekt tartalmazó adattömb.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_pie.prototype.drawPie = function (preparedData, trans) {
    const that = this;

    // A körcikkek adathoz társítása. 
    const paths = that.arc_group.selectAll("path").data(preparedData, function (d) {
        return d.uniqueId;
    });

    // Kilépő körcikkek törlése.
    paths.exit()
        .on("click", null)
        .remove();

    // Új körcikkek kirajzolása.
    paths.enter().append("svg:path")
        .attr("class", "bar bordered darkenable listener")
        .on("click", function (d) {
            that.drill(d);
        })
        .merge(paths)
        .attr("fill", function (d) {
            return global.color(d.id);
        })
        .transition(trans)
        .attrTween("d", that.pieTween.bind(that));
};

/**
 * A vonások és feliratok kirajzolása, animálása.
 *
 * @param {Array} preparedData A körcikkek adatait tartalmazó adattömb.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_pie.prototype.drawLabels = function (preparedData, trans) {
    const that = this;

    // A panel dimenziójának beállítása
    that.axisXCaption
        .text(that.localMeta.dimensions[that.dimToShow].caption)
        .attr("text-anchor", "end")
        .transition(trans).attrs({
        x: that.width, y: 0
    });

    // A vonások kirajzolása, animálása.
    const lines = that.label_group.selectAll("line").data(preparedData, function (d) {
        return d.uniqueId;
    });

    lines.exit().remove();

    lines.enter().append("svg:line")
        .attr("class", "pieTicks")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", -that.radius - 3)
        .attr("y2", -that.radius - 8)
        .attr("transform", function (d) {
            return "rotate(" + (d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + ")";
        })
        .merge(lines)
        .transition(trans)
        .attrTween("transform", that.tickTween)
        .style("opacity", function (d) {
            return (d.isTickRequired) ? 1 : 0;
        });

    // A szövegelemek tartója.
    let gLabelHolder = that.label_group.selectAll("g").data(that.preparedData, function (d) {
        return d.uniqueId;
    });

    // Kilépők levevése.
    gLabelHolder.exit().remove();

    const newGLabelHolder = gLabelHolder.enter().append("svg:g")
        .attr("class", "gPieTick")
        .attr("transform", function (d) {
            return "translate(" + Math.cos(((d.startAngle + d.endAngle - Math.PI) / 2)) * that.textRadius + "," + Math.sin((d.startAngle + d.endAngle - Math.PI) / 2) * that.textRadius + ")";
        });

    // Újonnan belépő százalék-értékek.
    newGLabelHolder.append("svg:text")
        .attr("class", "value pieTickValue");

    // Újonnan belépő dimenziócímkék.
    newGLabelHolder.append("svg:text")
        .attr("class", "units pieTickUnit");

    // Maradók és új elemek összeöntése.
    gLabelHolder = newGLabelHolder.merge(gLabelHolder);

    // Százalékok kitöltése.
    gLabelHolder.select("text.pieTickValue")
        .attr("dy", function (d) {
            return (global.valueInRange((d.startAngle + d.endAngle) / 2, Math.PI / 2, Math.PI * 1.5)) ? 5 : -7;
        })
        .attr("text-anchor", function (d) {
            return ((d.startAngle + d.endAngle) / 2.001 < Math.PI) ? "beginning" : "end";
        })
        .text(function (d) {
            return d.percentage + "%";
        });

    // Dimenziónevek kitöltése.
    gLabelHolder.select("text.pieTickUnit")
        .attr("dy", function (d) {
            return (global.valueInRange((d.startAngle + d.endAngle) / 2, Math.PI / 2, Math.PI * 1.5)) ? 17 : 5;
        })
        .attr("text-anchor", function (d) {
            return ((d.startAngle + d.endAngle) / 2.001 < Math.PI) ? "beginning" : "end";
        })
        .text(function (d) {
            return d.name;
        });


    // Maradók helyre animálása.
    gLabelHolder.transition(trans)
        .attrTween("transform", that.textTween.bind(that))
        .style("opacity", function (d) {
            return (d.isTickRequired) ? 1 : 0;
        });

    // Max. 145 pixel hosszú lehet egy szövegdoboz.
    global.cleverCompress(that.label_group.selectAll(".pieTickUnit"), 140, 1, 1.5, false);

};

//////////////////////////////////////////////////
// Control functions
//////////////////////////////////////////////////
