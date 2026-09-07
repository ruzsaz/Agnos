/* global d3 */

'use strict';

/**
 * Constructor for the report header panel.
 *
 * @param {Object} init Initialization object.
 * @param {Object} reportMeta The report metadata.
 * @param {Number} startScale The initial scale of the panel.
 * @returns {HeadPanel_Report} The created HeadPanel_Report object.
 */
function HeadPanel_Report(init, reportMeta, startScale) {
    const that = this;

    this.panelSide = init.group || 0;
    this.mediator = global.mediators[init.group];
    this.mediatorIds = [];
    this.panelDiv = d3.select("#headPanelP" + this.panelSide);
    that.panelDiv.style("width", (((parseInt(d3.select("#topdiv").style("width"))) / startScale) - global.panelMargin * 2) + "px");

    this.panelId = "#panel" + that.panelSide + "P-1";
    this.divTableBase = undefined;

    const med0 = this.mediator.subscribe("killPanel", function (panelId) {
        that.killPanel(panelId);
    });
    that.mediatorIds.push({"channel": "killPanel", "id": med0.id});

    const med1 = this.mediator.subscribe("killListeners", function () {
        that.killListeners();
    });
    that.mediatorIds.push({"channel": "killListeners", "id": med1.id});

    const med2 = this.mediator.subscribe("resize", function (duration, panelNumberPerRow, scaleRatio, immediate) {
        that.resize(immediate ? 0 : duration, panelNumberPerRow);
    });
    that.mediatorIds.push({"channel": "resize", "id": med2.id});

    const med3 = this.mediator.subscribe("langSwitch", function () {
        that.refreshPanelContent();
    });
    that.mediatorIds.push({"channel": "langSwitch", "id": med3.id});

    // Register the panel to the panel roster.
    that.mediator.publish("register", that, that.panelId, [], that.preUpdate, that.update);

    this.meta = reportMeta;
    this.localMeta = undefined;

    const trans = d3.transition().duration(global.selfDuration);
    this.controlElements = [];
    this.kaplanMeierSliders = [];

    // Create the main container.
    that.divBase = that.panelDiv.append("html:div")
        .attr("class", "baseDiv");

    that.reset("reportHeadPanel", 0);

    that.initDimensions(trans);
    that.initControls(trans);
    that.initValues(trans);

    that.refreshPanelContent(trans);

    that.mediator.publish("magnify", 0);
    that.mediator.publish("addDrag", that.divTableBase.selectAll(".dragable"));
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    HeadPanel_Report.prototype.panelMargin = global.panelMargin;
    HeadPanel_Report.prototype.dimLevelsSeparator = " ➜ ";
    HeadPanel_Report.prototype.dimLevelPlaceholder = "...";
}

//////////////////////////////////////////////////
// Kirajzolást segítő függvények
//////////////////////////////////////////////////

/**
 * Az új adat előkészítése, és a tooltip elkészítése.
 *
 * @param {Object} data Az új adatsort tartalmazó objektum.
 * @returns {Object} A megjelenítendő adatok.
 */
HeadPanel_Report.prototype.prepareData = function (data) {
    const that = this;
    const dimData = [];
    const controlData = that.localMeta.controls;
    const valData = [];

    // Dimenziók aktuális értékeinek elkészítése.
    for (let i = 0, iMax = (global.baseLevels[that.panelSide]).length; i < iMax; i++) {
        const baseDim = (global.baseLevels[that.panelSide])[i];
        let pathString = that.localMeta.dimensions[i].top_level_caption;
        for (let d = 0, dMax = baseDim.length; d < dMax; d++) {
            pathString = pathString + that.dimLevelsSeparator + baseDim[d].name.trim();
        }

        dimData.push({
            text: pathString,
            sliderValue: that.getKaplanMeierSliderValue(i)
        });
    }

    // Tooltip hozzáadása a dimenzió tábla soraihoz.
    that.dimTable.selectAll(".row").data(dimData)
        .attr("tooltip", function (d, i) {
            return "<html><h4>" + that.localMeta.dimensions[i].description + ": <em>" + d.text.replace(/[^➜]*➜ /, "") + "</em></h4></html>";
        });

    // Tooltip hozzáadása a kontroll tábla soraihoz.
    that.controlTable.selectAll(".row").data(controlData)
        .attr("tooltip", function (d) {
            return "<html><h4>" + d.description + "</h4></html>";
        });

    // Értékek aktuális értékeinek elkészítése.
    for (let i = 0, iMax = that.localMeta.indicators.length; i < iMax; i++) {
        const meta = that.localMeta.indicators[i];
        valData.push({
            value: that.valToShow(data, meta.value, i),
            ratio: that.ratioToShow(data, meta.fraction, i)
        });
    }

    // Tooltip hozzáadása az érték tábla soraihoz.
    that.valTable.selectAll(".row").data(valData)
        .attr("tooltip", function (d, i) {
            return "<html><h4>" + that.localMeta.indicators[i].description + "</h4></html>";
        });

    return {"dimData": dimData, "controlData": controlData, "valData": valData};
};

/**
 * A megjelenítendő abszolút értéket előállító függvény.
 *
 * @param {Object} data Az aktuális adatokat tartalmazó objektum.
 * @param {Object} valueMeta A mutató leírását tartalmazó meta.
 * @param {int} i Az adat sorszáma.
 * @returns {String} A megjelenítendő felirat.
 */
HeadPanel_Report.prototype.valToShow = function (data, valueMeta, i) {
    if (data !== undefined && data.rows[0] !== undefined && data.rows[0]["vals"][i] !== undefined) {
        return (valueMeta.hide) ? _("nem értelmezett") : global.cleverRound3(valueMeta.multiplier * data.rows[0]["vals"][i].sz) + " " + ((data.rows[0]["vals"][i].sz === 1) ? valueMeta.unit : valueMeta.unitPlural);
    }
    return "??? " + valueMeta["unitPlurar"];
};

/**
 * A megjelenítendő hányados értéket előállító függvény.
 *
 * @param {Object} data Az aktuális adatokat tartalmazó objektum.
 * @param {Object} ratioMeta A mutató leírását tartalmazó meta.
 * @param {int} i Az adat sorszáma.
 * @returns {String} A megjelenítendő felirat.
 */
HeadPanel_Report.prototype.ratioToShow = function (data, ratioMeta, i) {
    if (data !== undefined && data.rows[0] !== undefined && data.rows[0]["vals"][i] !== undefined) {
        return (ratioMeta.hide) ? _("nem értelmezett") : (data.rows[0]["vals"][i].n === 0) ? _("0 a nevező") : global.cleverRound3(ratioMeta.multiplier * data.rows[0]["vals"][i].sz / data.rows[0]["vals"][i].n) + " " + ((ratioMeta.multiplier * data.rows[0]["vals"][i].sz / data.rows[0]["vals"][i].n === 1) ? ratioMeta.unit : ratioMeta.unitPlural);
    }
    return "??? " + ratioMeta["unitPlurar"];
};

/**
 * Shortens a string like "Hungary > Pest > Fót" to fit into a maximized
 * html element, by shorting the first part of the string with ... .
 *
 * @param {String} string String to be shortened.
 * @param {Object} element Element that will contain the string.
 * @returns {String} The shortened string.
 */
HeadPanel_Report.prototype.shortenDimensionPath = function (string, element) {
    element.innerText = string;
    const elementWidth = element.offsetWidth;
    element.innerText = string + ".";
    const elementWidth2 = element.offsetWidth;

    if (elementWidth === elementWidth2) {
        const subStrings = (string === undefined) ? [] : string.split(this.dimLevelsSeparator);
        let isChanged = false;
        for (let i = 0, iMax = subStrings.length - 1; i < iMax; i++) {
            if (subStrings[i] !== this.dimLevelPlaceholder) {
                subStrings[i] = this.dimLevelPlaceholder;
                isChanged = true;
                break;
            }
        }
        if (isChanged) {
            return this.shortenDimensionPath(subStrings.join(this.dimLevelsSeparator), element);
        } else {
            return subStrings.join(this.dimLevelsSeparator);
        }
    }
    return string;
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
HeadPanel_Report.prototype.preUpdate = function (drill) {

    // A lefúrás dimenziójának eltörlése.
    this.dimTable.selectAll(".row:nth-child(" + (drill.dim + 2) + ")").select(".tableText1")
        .style("opacity", 0);

    // Ha valódi fúrás történt, az értékek törlése.
    if (drill.direction !== 0) {
        this.valTable.selectAll(".row").selectAll(".tableText2, .tableText1")
            .style("opacity", 0);
    }
};


/**
 * Új adat megérkeztekor elvégzi a panel frissítését.
 *
 * @param {Object} data Az új adat.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.update = function (data) {
    const that = this;
    const preparedData = that.prepareData(data);
    const trans = d3.transition().duration(global.selfDuration);

    // Dimenzió értékek upgradelése
    const dimRow = that.dimTable.selectAll(".row").data(preparedData.dimData);

    dimRow.select(".tableText1:not(.spacer)")
        .style("opacity", function (d) {
            return (d.text === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.text;
        }).transition(trans)
        .style("opacity", 1);

    dimRow.select(".tableText1:not(.spacer)")
        .text(function (d) {
            return that.shortenDimensionPath(d.text, this);
        });

    dimRow.select(".tableText1.spacer")
        .style("opacity", function (d) {
            return (d.text === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.text;
        });

    dimRow.each(function (d, i) {
        if (that.kaplanMeierSliders[i] !== undefined) {
            that.kaplanMeierSliders[i].setValue(d.sliderValue, false);
        }
    });

    // Kontrol értékek upgradelése
    for (let i = 0, iMax = that.controlElements.length; i < iMax; i++) {
        that.controlElements[i].updateLabels(this.controlTable, preparedData.controlData[i].labels, trans);
    }

    // Értékek értékeinek upgradelése.
    const valRow = that.valTable.selectAll(".row")
        .data(preparedData.valData);

    valRow.select(".tableText1:not(.spacer)")
        .style("opacity", function (d) {
            return (d.value === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.value;
        }).transition(trans)
        .style("opacity", 1);

    valRow.select(".tableText2:not(.spacer)")
        .style("opacity", function (d) {
            return (d.ratio === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.ratio;
        }).transition(trans)
        .style("opacity", 1);

};

/**
 * Feltölti a panelt a supermetában megkapott dinamikus tartalommal.
 * Nyelvváltás vagy színváltás esetén elég ezt lefuttatni.
 *
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog. Ha undefined, csinál magának.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.refreshPanelContent = function (trans = undefined) {
    const that = this;

    that.localMeta = global.facts[that.panelSide].getLocalMeta();
    trans = trans || d3.transition().duration(global.selfDuration);

    // A fejléc-szöveg frissítése
    that.divTableBase.select(".mainTitle text")
        .style("opacity", function () {
            return (that.localMeta.description === d3.select(this).text()) ? 1 : 0;
        })
        .text(that.localMeta.description)
        .transition(trans)
        .style("opacity", 1);

    // Dimenziókat tartalmazó sorokhoz az adatok társítása.
    const dimRow = that.dimTable.selectAll(".row").data(that.localMeta.dimensions);

    // Updateljük a dobóréteghez tartozó feliratot.
    dimRow.select(".dragable");

    // Első dimenzió cella: a dimenzió neve.
    dimRow.select(".tableText0:not(.spacer)")
        .style("opacity", function (d) {
            return (d.caption === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.caption;
        })
        .transition(trans)
        .style("opacity", 1);

    dimRow.select(".tableText0.spacer")
        .text(function (d) {
            return d.caption;
        });

    dimRow.select(".tableText1.spacer")
        .text("&nbsp;");

    // Kontrol sorok
    const controlRow = that.controlTable.selectAll(".row").data(that.localMeta.controls);

    // Első dimenzió cella: a dimenzió neve.
    controlRow.select(".tableText0:not(.spacer)")
        .style("opacity", function (d) {
            return (d.caption === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.caption;
        })
        .transition(trans)
        .style("opacity", 1);

    controlRow.select(".tableText0.spacer")
        .text(function (d) {
            return d.caption;
        });

    controlRow.select(".tableText1.spacer")
        .text("&nbsp;");

    // Érték tábla: az adatok társítása.
    const valRow = that.valTable.selectAll(".row").data(that.localMeta.indicators);

    // Updateljük a dobóréteghez tartozó feliratot.
    valRow.select(".dragable:nth-child(1)");
    valRow.select(".dragable:nth-child(2)");
    valRow.select(".dragable:nth-child(3)");

    // Első cella: a mutató neve.
    valRow.select(".tableText0:not(.spacer)")
        .style("opacity", function (d) {
            return (d.caption === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d.caption;
        })
        .transition(trans)
        .style("opacity", 1);

    valRow.select(".tableText0.spacer")
        .text(function (d) {
            return d.caption;
        });

    // Második cella: a mutató abszolút értéke, helykitöltés.
    valRow.select(".tableText1.spacer")
        .text(function (d) {
            return (d.value.hide) ? _("nem értelmezett") : _("99.9Mrd ") + _(d.value.unitPlural);
        });

    // Harmadik cella: a mutató arányosított értéke.
    valRow.select(".tableText2.spacer")
        .text(function (d) {
            return (d.fraction.hide) ? _("nem értelmezett") : _("99.9Mrd ") + _(d.fraction.unitPlural);
        });

    // Háttérszín.
    valRow.select(".backgroundCell")
        .style("background", function (d, i) {
            return global.colorValue(i, that.panelSide);
        });
};

HeadPanel_Report.prototype.initDimensions = function (trans) {
    const that = this;

    // Create the dimensions table.
    const dimTableHolder = that.divTableBase.append("html:div")
        .attr("id", "dimHolderP" + that.panelSide)
        .attr("class", "halfHeadDim halfHead");

    that.dimTable = dimTableHolder.append("html:div")
        .attr("class", "tableScrollPane")
        .append("html:div")
        .attr("class", "table dimTable")
        .attr("id", "dimsTableP" + that.panelSide);

    const dimHeading = that.dimTable.append("html:div")
        .attr("class", "heading");

    dimHeading.append("html:div")
        .attr("class", "cell loc")
        .text("Dimenzió neve");

    dimHeading.append("html:div")
        .attr("class", "cell loc")
        .text("Lefúrási szint");

    dimHeading.append("html:div")
        .attr("class", "cell");

    dimTableHolder.transition(trans)
        .style("opacity", "1");

    // Fill the table with the meta data.
    const dimRow = that.dimTable.selectAll(".row").data(that.meta.dimensions);

    const newDimRow = dimRow.enter().append("html:div")
        .on("click", function (d, i) {
            that.drillUp(i);
        })
        .attr("class", "row alterColored")
        .attr("parity", function (d, i) {
            return i % 2;
        });

    // First cell: name of the dimension.
    const dimNameCell = newDimRow.append("html:div")
        .attr("class", "cell");

    dimNameCell.append("html:text")
        .attr("class", "tableText0");

    dimNameCell.append("html:text")
        .attr("class", "tableText0 spacer");

    dimNameCell.append("html:span")
        .html("&nbsp;");

    // Second cell: the actual level of the drill.
    const dimDrillCell = newDimRow.append("html:div")
        .attr("class", "cell");

    dimDrillCell.append("html:text")
        .attr("class", "tableText1");

    dimDrillCell.append("html:text")
        .attr("class", "tableText1 spacer");

    dimDrillCell.append("html:span")
        .html("&nbsp;");

    dimDrillCell.each(function (d, i) {
        if (d.kaplanMeier && d.kaplanMeierValues !== undefined && d.kaplanMeierValues.length > 0) {
            d3.select(this).selectAll(".tableText1:not(.spacer), span")
                .style("display", "none");
            that.kaplanMeierSliders[i] = new ControlSlider(
                d3.select(this),
                "kaplanMeierDimension_P" + that.panelSide + "_" + i,
                that.getKaplanMeierSliderInit(d),
                that.getKaplanMeierSliderValue(i),
                function (v) {
                    that.drillKaplanMeierDimension(i, v);
                });
        }
    });

    // Background for the whole row
    newDimRow.append("html:div")
        .attr("class", "cell backgroundCell listener dragable");
}

HeadPanel_Report.prototype.getKaplanMeierSliderInit = function (dimension) {
    return {
        parameters: JSON.stringify({
            values: dimension.kaplanMeierValues.map(value => value.id),
            labels: dimension.kaplanMeierValues.map(value => value.name)
        })
    };
}

HeadPanel_Report.prototype.getKaplanMeierSliderValue = function (dimensionIndex) {
    const dimension = this.meta.dimensions[dimensionIndex];
    const baseDim = (global.baseLevels[this.panelSide])[dimensionIndex];
    if (baseDim.length > 0) {
        return baseDim[baseDim.length - 1].id;
    }
    if (dimension.kaplanMeier && dimension.kaplanMeierValues !== undefined && dimension.kaplanMeierValues.length > 0) {
        return dimension.kaplanMeierValues[dimension.kaplanMeierValues.length - 1].id;
    }
    return undefined;
}

HeadPanel_Report.prototype.drillKaplanMeierDimension = function (dimensionIndex, value) {
    const dimension = this.meta.dimensions[dimensionIndex];
    const selectedValue = global.getFromArrayByProperty(dimension.kaplanMeierValues, "id", value);
    if (selectedValue !== undefined) {
        this.mediator.publish("drill", {
            dim: dimensionIndex,
            direction: -1,
            toId: selectedValue.id,
            toName: selectedValue.name,
            replace: true
        });
    }
}

HeadPanel_Report.prototype.initControls = function (trans = undefined) {
    const that = this;

    const controlTableHolder = that.divTableBase.select("#dimHolderP" + that.panelSide);

    // Create the controls.
    this.controlTable = controlTableHolder.select(".tableScrollPane").append("html:div")
        .attr("class", "table dimTable controlTable")
        .attr("id", "controlTableP" + that.panelSide);

    controlTableHolder.transition(trans)
        .style("opacity", "1");

    // Create the table of controls from the meta data.
    const controls = global.facts[that.panelSide].getLocalMeta().controls;

    const controlRow = that.controlTable.selectAll(".row").data(controls);

    const newControlRow = controlRow.enter().append("html:div")
        .attr("class", "row alterColored")
        .attr("parity", function (d, i) {
            return (that.meta.dimensions.length + i) % 2;
        });

    // First cell: name of the control.
    const controlNameCell = newControlRow.append("html:div")
        .attr("class", "cell");

    controlNameCell.append("html:text")
        .attr("class", "tableText0");

    controlNameCell.append("html:text")
        .attr("class", "tableText0 spacer");

    controlNameCell.append("html:span")
        .html("&nbsp;");

    // Second cell: the actual control.
    const controlElementCell = newControlRow.append("html:div")
        .attr("class", "cell");

    controlElementCell.append("html:text")
        .attr("class", "tableText1 spacer");

    controlElementCell.each(function (d, i) {
        switch (d.type) {
            case "slider":
                that.controlElements.push(
                    new ControlSlider(
                        d3.select(this),
                        "control_P" + that.panelSide + "_" + i,
                        controls[i],
                        global.facts[that.panelSide].controlValues[i],
                        function (v) {
                            global.facts[that.panelSide].controlValues[i] = v;
                            that.mediator.publish("controlChange", undefined);
                        })
                );
                break;
            case "radio":
                that.controlElements.push(
                    new ControlRadio(
                        d3.select(this),
                        "control_P" + that.panelSide + "_" + i,
                        controls[i],
                        global.facts[that.panelSide].controlValues[i],
                        function (v) {
                            global.facts[that.panelSide].controlValues[i] = v;
                            that.mediator.publish("controlChange", undefined);
                        })
                );
                break;
            default:
                console.error("Unknow control type: " + d.type);
        }
    });

    // Background for the whole row.
    newControlRow.append("html:div")
        .attr("class", "cell backgroundCell listener dragable");
}

HeadPanel_Report.prototype.initValues = function (trans) {
    const that = this;

    const valTableHolder = that.divTableBase.append("html:div")
        .attr("id", "tableHolderP" + that.panelSide)
        .attr("class", "halfHeadValue halfHead");

    that.valTable = valTableHolder.append("html:div")
        .attr("class", "tableScrollPane")
        .append("html:div")
        .attr("class", "table valTable")
        .attr("id", "reportsTableP" + that.panelSide);

    const valHeading = that.valTable.append("html:div")
        .attr("class", "heading");

    const nameRow = valHeading.append("html:div")
        .attr("class", "cell");

    nameRow.append("html:text")
        .attr("class", "realText loc")
        .text("Mutató neve");

    nameRow.append("html:text")
        .attr("class", "dummyText")
        .text("Arányosított érték k k k k k k k k k k k k k k k k k k k k k");

    const valueRow = valHeading.append("html:div")
        .attr("class", "cell");

    valueRow.append("html:text")
        .attr("class", "realText loc")
        .text("Érték");

    valueRow.append("html:text")
        .attr("class", "dummyText")
        .text("Arányosított érték");

    const ratioRow = valHeading.append("html:div")
        .attr("class", "cell");

    ratioRow.append("html:text")
        .attr("class", "realText loc")
        .text("Arányosított érték");

    ratioRow.append("html:text")
        .text("Arányosított érték")
        .attr("class", "dummyText");

    valHeading.append("html:div")
        .attr("class", "cell");

    valTableHolder.transition(trans)
        .style("opacity", "1");

    // Filling the value table based on the meta
    const newValRow = that.valTable.selectAll(".row").data(that.meta.indicators)
        .enter().append("html:div")
        .attr("class", function (d) {
            return (d["denominatorIsHidden"] && d["valueIsHidden"]) ? "row novalue" : "row";
        });

    // First cell: the name of the indicator.
    const valNameCell = newValRow.append("html:div")
        .attr("class", "cell hoverable listener dragable")
        .on("click", function (d) {
            that.mediator.publish("changeValue", undefined, d.id, false);
        });

    valNameCell.append("html:text")
        .attr("class", "tableText0");

    valNameCell.append("html:text")
        .attr("class", "tableText0 spacer");

    valNameCell.append("html:span")
        .html("&nbsp;");

    // Second cell: the indicator's absolute value.
    const valValueCell = newValRow.append("html:div")
        .attr("class", "cell hoverable listener dragable")
        .on("click", function (d) {
            that.mediator.publish("changeValue", undefined, d.id, false);
        });

    valValueCell.append("html:text")
        .attr("class", "tableText1");

    valValueCell.append("html:text")
        .attr("class", "tableText1 spacer");

    valValueCell.append("html:span")
        .html("&nbsp;");

    // Third cell: the indicator's ratio value.
    const valRatioCell = newValRow.append("html:div")
        .attr("class", "cell hoverable listener dragable")
        .on("click", function (d) {
            that.mediator.publish("changeValue", undefined, d.id, true);
        });

    valRatioCell.append("html:text")
        .attr("class", "tableText2");

    valRatioCell.append("html:text")
        .attr("class", "tableText2 spacer");

    valRatioCell.append("html:span")
        .html("&nbsp;");

    // Background for the whole row.
    newValRow.append("html:div")
        .attr("class", "cell backgroundCell");
}

/**
 * Átméretezi a panelt.
 *
 * @param {Number} duration Az átméretezés ideje, millisec.
 * @param {int} panelNumberPerRow Egy sorban elférő normál méretű panelek száma.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.resize = function (duration, panelNumberPerRow) {
    const that = this;

    const width = panelNumberPerRow * (global.panelWidth + 2 * this.panelMargin) - 2 * this.panelMargin;
    if (panelNumberPerRow === 1) {
        that.panelDiv.selectAll(".halfHead")
            .classed("vertical", true);
    }
    this.panelDiv.transition().duration(duration)
        .style("width", width + "px")
        .on("end", function () {
            that.panelDiv.selectAll(".halfHead")
                .classed("vertical", (panelNumberPerRow === 1));
            that.refresh();
        });
};

HeadPanel_Report.prototype.refresh = function () {
    const that = this;
    that.dimTable.selectAll(".row").select(".tableText1:not(.spacer)")
        .text(function (d) {
            return that.shortenDimensionPath(d.text, this);
        });
};

/**
 * Letörli, és alaphelyzetbe hozza a fejlécpanelt.
 *
 * @param {String} additionalClass A html objektumhoz adandó további class-nevek.
 * @param {Number} duration Az előtűnési animáció időtartama.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.reset = function (additionalClass, duration) {
    const that = this;
    if (duration === undefined) {
        duration = global.selfDuration;
    }

    that.panelDiv.classed("cardPanelHolder", false);

    that.panelDiv.selectAll(".divTableBase")
        .attr("class", null)
        .style("width", function () {
            return d3.select(this).style("width");
        })
        .style("position", "absolute")
        .style("opacity", "0")
        .remove();

    that.divTableBase = that.divBase.append("html:div")
        .attr("class", "divTableBase " + additionalClass)
        .style("opacity", 0);

    that.divTableBase.append("html:div")
        .attr("class", "mainTitle")
        .append("html:text");

    that.divTableBase.transition().duration(duration)
        .style("opacity", 1);

    if (global.isEmbedded) {
        d3.select("body").transition().duration(duration)
            .style("opacity", 1);
    }

};

//////////////////////////////////////////////////
// // Irányítást végző függvények
//////////////////////////////////////////////////


/**
 * Megöli a panel 'listener' osztályú elmeihez rendelt eseményfigyelőket.
 *
 * @returns {undefined}
 */
HeadPanel_Report.prototype.killListeners = function () {
    this.panelDiv.selectAll(".listener")
        .on("click", null)
        .on("mouseover", null)
        .on("mouseout", null);
};

/**
 * Megöli a panelt.
 *
 * @param {int} panelId A megölendő panel id-je. (Ha a panelen belülről hívjuk, elhagyható.)
 * @returns {undefined}
 */
HeadPanel_Report.prototype.killPanel = function (panelId) {
    if (panelId === undefined || panelId === this.panelId) {
        this.killListeners();

        // A panel mediátor-leiratkozásai.
        for (let i = 0, iMax = this.mediatorIds.length; i < iMax; i++) {
            this.mediator.remove(this.mediatorIds[i].channel, this.mediatorIds[i].id);
        }
        this.mediatorIds = [];
        this.mediator = undefined;
    }
};

/**
 * Az aktuális dimenzióban történő felfúrást kezdeményező függvény.
 *
 * @param {int} d A dimenzió sorszáma.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.drillUp = function (d) {
    const that = this;
    global.tooltip.kill();
    const drill = {
        dim: d,
        direction: 1,
        toId: undefined,
        toName: undefined
    };
    that.mediator.publish("drill", drill);
};
