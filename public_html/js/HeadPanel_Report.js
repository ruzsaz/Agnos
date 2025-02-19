/* global HeadPanel, d3 */

'use strict';

/**
 * A report fejlécpanel konstruktora.
 *  
 * @param {Object} init Inicializáló objektum.
 * @param {Object} reportMeta A megjelenített report metaadatai.
 * @param {Number} startScale A méretszorzó, amivel meg kell jeleníteni.
 * @returns {HeadPanel_Report} A fejlécpanel.
 */
function HeadPanel_Report(init, reportMeta, startScale) {
    var that = this;

    HeadPanel.call(this, init, global.mediators[init.group], "reportHeadPanel", startScale);

    this.meta = reportMeta; // A report metája.
    this.localMeta; // A report metájának lefordított változata.
    var trans = d3.transition().duration(global.selfDuration);
    this.dimLevelsSeparator = " ➜ "; // A dimenzióelemek összefűzésére szolgáló sztring lefúráskor.
    this.dimLevelPlaceholder = "..."; // A túl hosszú dimenzióelemeket erre cseréljük megjelenítéskor.
    this.controlElements = [];

    // Panel regisztrálása a nyilvántartóba.
    that.mediator.publish("register", that, that.panelId, [], that.preUpdate, that.update);

    that.panelDiv.classed("cardPanelHolder", false);

    that.divTableBase.append("html:div")
            .attr("class", "mainTitle")
            .append("html:text");

    // Dimenziók táblázata
    var dimTableHolder = that.divTableBase.append("html:div")
            .attr("id", "dimHolderP" + that.panelSide)
            .attr("class", "halfHeadDim halfHead");

    this.dimTable = dimTableHolder.append("html:div")
            .attr("class", "tableScrollPane")
            .append("html:div")
            .attr("class", "table dimTable")
            .attr("id", "dimsTableP" + that.panelSide);

    var dimHeading = that.dimTable.append("html:div")
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

    // Kontrollok táblázata
    var controlTableHolder = dimTableHolder;

    this.controlTable = controlTableHolder.select(".tableScrollPane").append("html:div")
            .attr("class", "table dimTable controlTable")
            .attr("id", "controlTableP" + that.panelSide);

    controlTableHolder.transition(trans)
            .style("opacity", "1");

    // Értékek táblázata
    var valTableHolder = that.divTableBase.append("html:div")
            .attr("id", "tableHolderP" + that.panelSide)
            .attr("class", "halfHeadValue halfHead");

    this.valTable = valTableHolder.append("html:div")
            .attr("class", "tableScrollPane")
            .append("html:div")
            .attr("class", "table valTable")
            .attr("id", "reportsTableP" + that.panelSide);

    var valHeading = that.valTable.append("html:div")
            .attr("class", "heading");

    var nameRow = valHeading.append("html:div")
            .attr("class", "cell");

    nameRow.append("html:text")
            .attr("class", "realText loc")
            .text("Mutató neve");

    nameRow.append("html:text")
            .attr("class", "dummyText")
            .text("Arányosított érték k k k k k k k k k k k k k k k k k k k k k");

    var valueRow = valHeading.append("html:div")
            .attr("class", "cell");

    valueRow.append("html:text")
            .attr("class", "realText loc")
            .text("Érték");

    valueRow.append("html:text")
            .attr("class", "dummyText")
            .text("Arányosított érték");

    var ratioRow = valHeading.append("html:div")
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

    // Dimenzió tábla feltöltése a meta alapján
    var dimRow = that.dimTable.selectAll(".row").data(that.meta.dimensions);

    var newDimRow = dimRow.enter().append("html:div")
            .on("click", function (d, i) {
                that.drillUp(i);
            })
            .attr("class", "row alterColored")
            .attr("parity", function (d, i) {
                return i % 2;
            });

    var tempRowCell;

    // Első cella: a dimenzió neve.
    {
        tempRowCell = newDimRow.append("html:div")
                .attr("class", "cell");

        tempRowCell.append("html:text")
                .attr("class", "tableText0");

        tempRowCell.append("html:text")
                .attr("class", "tableText0 spacer");

        tempRowCell.append("html:span")
                .html("&nbsp;");
    }

    // Második cella: a pillanatnyi lefúrási szint.
    {
        tempRowCell = newDimRow.append("html:div")
                .attr("class", "cell");

        tempRowCell.append("html:text")
                .attr("class", "tableText1");

        tempRowCell.append("html:text")
                .attr("class", "tableText1 spacer");

        tempRowCell.append("html:span")
                .html("&nbsp;");
    }

    // A táblázatsor háttere.
    {
        newDimRow.append("html:div")
                .attr("class", "cell backgroundCell listener dragable");
    }

    
    // Kontroll tábla feltöltése a meta alapján
    const controls = global.facts[that.panelSide].localMeta.controls;

    var controlRow = that.controlTable.selectAll(".row").data(controls);

    var newControlRow = controlRow.enter().append("html:div")
            .attr("class", "row alterColored")
            .attr("parity", function (d, i) {
                return (that.meta.dimensions.length + i) % 2;
            });

    // Első cella: a kontroll neve.
    {
        tempRowCell = newControlRow.append("html:div")
                .attr("class", "cell");

        tempRowCell.append("html:text")
                .attr("class", "tableText0");

        tempRowCell.append("html:text")
                .attr("class", "tableText0 spacer");

        tempRowCell.append("html:span")
                .html("&nbsp;");
    }

    // Második cella: a konroll maga.
    {
        tempRowCell = newControlRow.append("html:div")
                .attr("class", "cell");

        tempRowCell.append("html:text")
                .attr("class", "tableText1 spacer");
        
        tempRowCell.each(function(d, i) {
            switch(d.type) {
                case "slider":
                    that.controlElements.push(
                            new ControlSlider(
                                    d3.select(this),
                                    "control_P" + that.panelSide + "_" + i,
                                    controls[i],
                                    global.facts[that.panelSide].controlValues[i],
                                    function(v) {
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
                                    function(v) {
                                            global.facts[that.panelSide].controlValues[i] = v;
                                            that.mediator.publish("controlChange", undefined);
                                    })
                    );        
                    break;
                default:
                    console.error("Unknow control type: " + d.type);
            }
    
            
        });
        
    }
    
    // A táblázatsor háttere.
    {
        newControlRow.append("html:div")
                .attr("class", "cell backgroundCell listener");
    }
    

    // Érték tábla feltöltése a meta alapján
    var newValRow = that.valTable.selectAll(".row").data(that.meta.indicators)
            .enter().append("html:div")
            .attr("class", function (d) {
                    return (d.denominatorIsHidden && d.valueIsHidden) ? "row novalue" : "row";
            });

    // Első cella: a mutató neve.
    {
        tempRowCell = newValRow.append("html:div")
                .attr("class", "cell hoverable listener dragable")
                .on("click", function (d) {
                    that.mediator.publish("changeValue", undefined, d.id, false);
                });

        tempRowCell.append("html:text")
                .attr("class", "tableText0");

        tempRowCell.append("html:text")
                .attr("class", "tableText0 spacer");

        tempRowCell.append("html:span")
                .html("&nbsp;");
    }

    // Második cella: a mutató abszolút értéke.	
    {
        tempRowCell = newValRow.append("html:div")
                .attr("class", "cell hoverable listener dragable")
                .on("click", function (d) {
                    that.mediator.publish("changeValue", undefined, d.id, false);
                });

        tempRowCell.append("html:text")
                .attr("class", "tableText1");

        tempRowCell.append("html:text")
                .attr("class", "tableText1 spacer");

        tempRowCell.append("html:span")
                .html("&nbsp;");
    }

    // Harmadik cella: a mutató arányosított értéke.
    {
        tempRowCell = newValRow.append("html:div")
                .attr("class", "cell hoverable listener dragable")
                .on("click", function (d) {
                    that.mediator.publish("changeValue", undefined, d.id, true);
                });

        tempRowCell.append("html:text")
                .attr("class", "tableText2");

        tempRowCell.append("html:text")
                .attr("class", "tableText2 spacer");

        tempRowCell.append("html:span")
                .html("&nbsp;");
    }

    // A sor háttere.
    {
        newValRow.append("html:div")
                .attr("class", "cell backgroundCell");
    }

    that.initPanel(trans);

    that.mediator.publish("magnify", 0);
    that.mediator.publish("addDrag", that.divTableBase.selectAll(".dragable"));
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    HeadPanel_Report.prototype = global.subclassOf(HeadPanel);
}


//////////////////////////////////////////////////
// Kirajzolást segítő függvények
//////////////////////////////////////////////////


/**
 * A megjelenítendő abszolút értéket előállító függvény.
 * 
 * @param {Object} data Az aktuális adatokat tartalmazó objektum.
 * @param {Object} valueMeta A mutató leírását tartalmazó meta.
 * @param {Integer} i Az adat sorszáma.
 * @returns {String} A megjelenítendő felirat.
 */
HeadPanel_Report.prototype.valToShow = function (data, valueMeta, i) {
    var val = "";
    if (data !== undefined && data.rows[0] !== undefined && data.rows[0].vals[i] !== undefined) {
        val = (valueMeta.hide) ? _("nem értelmezett") : global.cleverRound3(valueMeta.multiplier * data.rows[0].vals[i].sz) + " " + ((data.rows[0].vals[i].sz === 1) ? valueMeta.unit : valueMeta.unitPlural);
    } else {
        val = "??? " + valueMeta.unitPlurar;
    }
    return val;
};

/**
 * A megjelenítendő hányados értéket előállító függvény.
 * 
 * @param {Object} data Az aktuális adatokat tartalmazó objektum.
 * @param {Object} ratioMeta A mutató leírását tartalmazó meta.
 * @param {Integer} i Az adat sorszáma.
 * @returns {String} A megjelenítendő felirat.
 */
HeadPanel_Report.prototype.ratioToShow = function (data, ratioMeta, i) {
    var val = "";
    if (data !== undefined && data.rows[0] !== undefined && data.rows[0].vals[i] !== undefined) {
        val = (ratioMeta.hide) ? _("nem értelmezett") : (data.rows[0].vals[i].n === 0) ? _("0 a nevező") : global.cleverRound3(ratioMeta.multiplier * data.rows[0].vals[i].sz / data.rows[0].vals[i].n) + " " + ((ratioMeta.multiplier * data.rows[0].vals[i].sz / data.rows[0].vals[i].n === 1) ? ratioMeta.unit : ratioMeta.unitPlural);
    } else {
        val = "??? " + ratioMeta.unitPlurar;
    }
    return val;
};

//////////////////////////////////////////////////
// Rajzolási folyamat függvényei
//////////////////////////////////////////////////

/**
 * Feltölti a panelt a supermetában megkapott dinamikus tartalommal.
 * Nyelvváltás vagy színváltás esetén elég ezt lefuttatni.
 * 
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog. Ha undefined, csinál magának.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.initPanel = function (trans) {
    var that = this;
    that.localMeta = global.facts[that.panelSide].getLocalMeta();    
    trans = trans || d3.transition().duration(global.selfDuration);

    // A fejléc-szöveg frissítése
    that.divTableBase.select(".mainTitle text")
            .style("opacity", function (d) {
                return (that.localMeta.description === d3.select(this).text()) ? 1 : 0;
            })
            .text(that.localMeta.description)
            .transition(trans)
            .style("opacity", 1);

    // Dimenziókat tartalmazó sorokhoz az adatok társítása.
    var dimRow = that.dimTable.selectAll(".row").data(that.localMeta.dimensions);

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
        .text(function (d) {
            return "&nbsp;";
        });


    // Kontrol sorok
    var controlRow = that.controlTable.selectAll(".row").data(that.localMeta.controls);

    // Updateljük a dobóréteghez tartozó feliratot.
    // controlRow.select(".dragable");

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
        .text(function (d) {
            return "&nbsp;";
        });                                                
    
    // Érték tábla: az adatok társítása.
    var valRow = that.valTable.selectAll(".row").data(that.localMeta.indicators);

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
 * Az új adat előkészítése, és a tooltip elkészítése.
 * 
 * @param {Object} data Az új adatsort tartalmazó objektum.
 * @returns {Object} A megjelenítendő adatok.
 */
HeadPanel_Report.prototype.prepareData = function (data) {
    var that = this;
    var dimData = [];
    var controlData = that.localMeta.controls;
    var valData = [];

    // Dimenziók aktuális értékeinek elkészítése.
    for (var i = 0, iMax = (global.baseLevels[that.panelSide]).length; i < iMax; i++) {
        var baseDim = (global.baseLevels[that.panelSide])[i];        
        var pathString = that.localMeta.dimensions[i].top_level_caption;
        for (var d = 0, dMax = baseDim.length; d < dMax; d++) {
            pathString = pathString + that.dimLevelsSeparator + baseDim[d].name.trim();
        }
        
        dimData.push({
            text: pathString
        });
    }

    // Tooltip hozzáadása a dimenzió tábla soraihoz.
    that.dimTable.selectAll(".row").data(dimData)
            .attr("tooltip", function (d, i) {
                return "<html><h4>" + that.localMeta.dimensions[i].description + ": <em>" + d.text.replace(/[^➜]*➜ /, "") + "</em></h4></html>";
            });

    // Tooltip hozzáadása a kontroll tábla soraihoz.
    that.controlTable.selectAll(".row").data(controlData)
            .attr("tooltip", function (d, i) {                
                return "<html><h4>" + d.description + "</h4></html>";
            });

    // Értékek aktuális értékeinek elkészítése.
    for (var i = 0, iMax = that.localMeta.indicators.length; i < iMax; i++) {
        var meta = that.localMeta.indicators[i];
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
 * Új adat megérkeztekor elvégzi a panel frissítését.
 * 
 * @param {Object} data Az új adat.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.update = function (data) {
    var that = this;
    var preparedData = that.prepareData(data);
    var trans = d3.transition().duration(global.selfDuration);

    // Dimenzió értékek upgradelése
    var dimRow = that.dimTable.selectAll(".row").data(preparedData.dimData);

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

    // Kontrol értékek upgradelése
    for (var i = 0, iMax = that.controlElements.length; i < iMax; i++) {
        that.controlElements[i].updateLabels(this.controlTable, preparedData.controlData[i].labels, trans);
    }

    // Értékek értékeinek upgradelése.
    var valRow = that.valTable.selectAll(".row")
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
 * Lerövidít egy "Magyarország > Pest > Fót" jellegű szöveget, hogy
 * beleférjen egy maximalizált méretű html element-be. A szöveg első
 * részét ... -al helyettesíti.
 * 
 * @param {String} string A lerövítendő szöveg.
 * @param {Object} element A szöveget tartalmazó html element.
 * @returns {String} A lerövídített szöveg, pl: "... > ... > Fót".
 */
HeadPanel_Report.prototype.shortenDimensionPath = function (string, element) {
    element.innerText = string;
    const elementWidth = element.offsetWidth;
    element.innerText = string + ".";
    const elementWidth2 = element.offsetWidth;
    
    if (elementWidth === elementWidth2) {
        const subStrings = string.split(this.dimLevelsSeparator);
        var isChanged = false;
        for (var i = 0, iMax = subStrings.length - 1; i < iMax; i++) {
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

HeadPanel_Report.prototype.refresh = function () {
    var that = this;
    that.dimTable.selectAll(".row").select(".tableText1:not(.spacer)")
            .text(function (d) {
                return that.shortenDimensionPath(d.text, this);
            });
};

//////////////////////////////////////////////////
// // Irányítást végző függvények
//////////////////////////////////////////////////

/**
 * Az aktuális dimenzióban történő felfúrást kezdeményező függvény.
 * 
 * @param {Integer} d A dimenzió sorszáma.
 * @returns {undefined}
 */
HeadPanel_Report.prototype.drillUp = function (d) {
    var that = this;
    global.tooltip.kill();
    var drill = {
        dim: d,
        direction: 1,
        toId: undefined,
        toName: undefined
    };
    that.mediator.publish("drill", drill);
};