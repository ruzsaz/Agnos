/* global Panel, d3 */

'use strict';

/**
 * A tábla-diagram konstruktora.
 *
 * @param {Object} init Inicializáló objektum.
 * @returns {panel_table2d} A megkonstruált panel.
 */
function panel_table2d(init) {
    var that = this;

    this.constructorName = "panel_table2d";

    // Inicializáló objektum beolvasása, feltöltése default értékekkel.
    this.defaultInit = {
        group: 0,
        position: undefined,
        dimr: 0,
        dimc: 1,
        val: 0,
        multiplier: 1,
        ratio: false,
        mag: 1,
        frommg: 1,
        sortbyvalue: false
    };
    this.actualInit = global.combineObjects(that.defaultInit, init);

    Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], true, false, 0, 0); // A Panel konstruktorának meghívása.

    this.valMultiplier = 1;							// A mutatott érték szorzója.
    this.fracMultiplier = 1;							// A mutatott érték szorzója.
    this.dimRToShow = that.actualInit.dimr;			// Az X tengely mentén mutatott dimenzió.
    this.dimCToShow = that.actualInit.dimc;			// Az Y tengely mentén mutatott dimenzió.
    this.valToShow = that.actualInit.val;			// Az ennyiedik mutatót mutatja.
    this.valMultiplier = that.actualInit.multiplier;// Ennyiszeresét kell mutatni az értékeknek.	
    this.fracMultiplier = that.actualInit.multiplier;// Ennyiszeresét kell mutatni az értékeknek.	
    this.valFraction = that.actualInit.ratio;		// Hányadost mutasson, vagy abszolútértéket?
    this.dimR = (that.dimRToShow <= that.dimCToShow) ? 0 : 1;// Az x tengelyen megjelenítendő dimenzió sorszáma (a data-n belül).
    this.dimC = (that.dimRToShow < that.dimCToShow) ? 1 : 0;// Az oszloposztásban megjelenítendő dimenzió sorszáma (a data-n belül).

    this.preparedData = [];							// Az ábrázolásra kerülő, feldolgozott adat.
    this.maxEntries = global.maxEntriesIn2D;                // A panel által maximálisan megjeleníthető adatok száma.
    this.maxEntries1D = global.maxEntriesIn1D;              // A panel által 1 dimenzióban maximálisan megjeleníthető adatok száma.

    this.tableWidth = that.w - 2 * (panel_table2d.prototype.tableLeftMargin + panel_table2d.prototype.tableElementGap) - panel_table2d.prototype.tableHeadWidth - panel_table2d.prototype.innerScrollbarWidth; // A táblázat törzsének szélessége.
    this.tableHeight = that.h - panel_table2d.prototype.tableTopMargin - panel_table2d.prototype.tableHeadHeight - panel_table2d.prototype.tableBottomMargin - panel_table2d.prototype.innerScrollbarWidth - 2 * panel_table2d.prototype.tableElementGap; // A táblázat törzsének magassága.

    this.tableSpacingVerical = that.tableHeight / ((that.magLevel === 1) ? 14 : 32);		// Egy táblázatsor magassága.
    this.tableSpacingHorizontal = that.tableWidth / ((that.magLevel === 1) ? 7 : 16);	// Egy táblázatoszlop szélessége.

    // Alapréteg a sorokban való furkáláshoz.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget0")
        .on('mouseover', function () {
            that.hoverOn(this, 0);
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .on("click", function () {
            that.drill(that.dimR);
        })
        .append("svg:rect")
        .attr("width", that.tableLeftMargin + that.tableHeadWidth + that.tableElementGap)
        .attr("height", that.h);

    // Alapréteg az oszlopokban való furkáláshoz.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget0")
        .on('mouseover', function () {
            that.hoverOn(this, 1);
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .on("click", function () {
            that.drill(that.dimC);
        })
        .append("svg:rect")
        .attr("x", that.tableLeftMargin + that.tableHeadWidth + that.tableElementGap)
        .attr("width", that.w - that.tableLeftMargin + that.tableHeadWidth + that.tableElementGap)
        .attr("height", that.h);

    // Táblázat tartója.
    var tableHolder = that.svg.insert("svg:g", ".title_group")
        .attr("class", "svgTableHolder")
        .attr("transform", "translate(" + that.tableLeftMargin + "," + that.tableTopMargin + ")");

    // A sorfejek fölé a dimenzió kiírása
    this.axisRCaption = that.svg.insert("svg:text", ".svgTableHolder")
        .attr("class", "dimensionLabel noEvents")
        .attr("transform", "translate(" + that.tableLeftMargin + ", " + (that.tableTopMargin + that.tableHeadHeight) + ")");

    // Az oszlopfejek fölé a dimenzió kiírása
    this.axisCCaption = that.svg.insert("svg:text", ".svgTableHolder")
        .attr("class", "dimensionLabel noEvents")
        .attr("transform", "translate(" + (that.tableLeftMargin + that.tableHeadWidth + that.tableElementGap) + ", " + (that.tableTopMargin - that.tableElementGap) + ")");

    // A sorfejeket tartó konténer.
    this.gRowHeads = tableHolder.append("svg:svg")
        .attr("x", 0)
        .attr("y", that.tableHeadHeight + that.tableElementGap)
        .attr("width", that.tableHeadWidth)
        .attr("height", that.tableHeight)
        .attr("viewBox", "0 0 " + that.tableHeadWidth + " " + that.tableHeight);

    // Az oszlopfejeket tartó konténer.
    this.gColumnHeads = tableHolder.append("svg:svg")
        .attr("x", that.tableHeadWidth + that.tableElementGap)
        .attr("y", 0)
        .attr("width", that.tableWidth)
        .attr("height", that.tableHeadHeight)
        .attr("viewBox", "0 0 " + that.tableWidth + " " + that.tableHeadHeight);

    // A táblát tartó konténer.
    this.gTable = tableHolder.append("svg:svg")
        .attr("x", that.tableHeadWidth + that.tableElementGap)
        .attr("y", that.tableHeadHeight + that.tableElementGap)
        .attr("width", that.tableWidth)
        .attr("height", that.tableHeight)
        .attr("viewBox", "0 0 " + that.tableWidth + " " + that.tableHeight);

    /**
     * Függőleges scrollozást végrehajtó függvény.
     *
     * @param {Number} top A scrollbar kezdőpontja pixelben.
     * @returns {undefined}
     */
    var verticalScrollFunction = function (top) {

        var currentExtent = that.gTable.attr("viewBox").split(" ");
        that.gRowHeads.attr("viewBox", "0 " + top + " " + that.tableHeadWidth + " " + that.tableHeight);
        that.gTable.attr("viewBox", currentExtent[0] + " " + top + " " + that.tableWidth + " " + that.tableHeight);
    };

    /**
     * Vízszintes scrollozást végrehajtó függvény.
     *
     * @param {Number} left A scrollbar kezdőpontja pixelben.
     * @returns {undefined}
     */
    var horizontalScrollFunction = function (left) {
        var currentExtent = that.gTable.attr("viewBox").split(" ");
        that.gColumnHeads.attr("viewBox", left + " 0 " + that.tableWidth + " " + that.tableHeadHeight);
        that.gTable.attr("viewBox", left + " " + currentExtent[1] + " " + that.tableWidth + " " + that.tableHeight);
    };

    // Vízszintes scrollbar elhelyezése.
    this.horizontalScrollbar = new SVGScrollbar(that.svg, true, that.tableWidth, horizontalScrollFunction, that.tableSpacingHorizontal);
    that.horizontalScrollbar.setPosition(that.tableHeadWidth + that.tableLeftMargin + that.tableElementGap, that.h - that.tableBottomMargin - that.innerScrollbarWidth + that.tableElementGap);

    // Függőleges scrollbar elhelyezése.
    this.verticalScrollbar = new SVGScrollbar(that.svg, false, that.tableHeight, verticalScrollFunction, that.tableSpacingVerical * 2, tableHolder);
    that.verticalScrollbar.setPosition(that.w - that.tableLeftMargin - that.innerScrollbarWidth + that.tableElementGap, that.tableHeadHeight + that.tableTopMargin + that.tableElementGap);


    var med;
    // Feliratkozás az értékváltó mediátorra.
    med = that.mediator.subscribe("changeValue", function (id, val, ratio) {
        that.doChangeValue(id, val, ratio);
    });
    that.mediatorIds.push({"channel": "changeValue", "id": med.id});

    // Feliratkozás a dimenzióváltó mediátorra.
    med = that.mediator.subscribe("changeDimension", function (panelId, newDimId, dimToChange) {
        that.doChangeDimension(panelId, newDimId, dimToChange);
    });
    that.mediatorIds.push({"channel": "changeDimension", "id": med.id});

    // Panel regisztrálása a nyilvántartóba.
    that.mediator.publish("register", that, that.panelId, [that.dimRToShow, that.dimCToShow], that.preUpdate, that.update, that.getConfig);

    // Nyelv-beállítás meghívása. Ez kialakítja az oszlopfejléceket, és a titleBoxot. Frissíti az oszlopadatokat.
//    that.langSwitch(global.getAnimDuration(-1, that.panelId), true);
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    panel_table2d.prototype = global.subclassOf(Panel); // A Panel metódusainak átvétele.

    panel_table2d.prototype.tableHeadWidth = 120;	// A táblázat sorai fejlécének szélessége.
    panel_table2d.prototype.tableHeadHeight = 20;	// A táblázat fejlécének magassága.
    panel_table2d.prototype.tableElementGap = 4;	// A táblázat fejlécei és a törzs közötti rés mérete.

    panel_table2d.prototype.tableLeftMargin = 40;	// Bal oldali margó mérete.
    panel_table2d.prototype.tableTopMargin = 70;	// Felső margó mérete.
    panel_table2d.prototype.tableBottomMargin = 15;	// Alsó margó mérete.
    panel_table2d.prototype.innerScrollbarWidth = 10;// A belső scrollbar vastagsága, pixel.
}

//////////////////////////////////////////////////
// Kirajzolást segítő függvények
//////////////////////////////////////////////////

/**
 * Egy adatsorból meghatározza a megmutatandó értéket.
 *
 * @param {Object} d Nyers adatsor.
 * @returns {Number} Az értékek.
 */
panel_table2d.prototype.valueToShow = function (d) {
    var that = this;
    if (d !== undefined && d.vals !== undefined) {
        var val = (that.valFraction) ? that.fracMultiplier * d.vals[that.valToShow].sz / d.vals[that.valToShow].n : that.valMultiplier * d.vals[that.valToShow].sz;
        if (isNaN(parseFloat(val))) {
            val = 0;
        }
        return val;
    } else {
        return null;
    }
};

/**
 * Egy elemhez tartozó tooltipet legyártó függvény;
 *
 * @param {Object} rElement Az X dimenzió mentén az elemet tartalmazó objektum.
 * @param {type} cElement Az Y dimenzió mentén az érték.
 * @returns {String} A megjelenítendő tooltip.
 */
panel_table2d.prototype.getTooltip = function (rElement, cElement) {
    var that = this;
    var tooltip;
    if (cElement === undefined) {
        tooltip = that.createTooltip([{
            name: that.localMeta.dimensions[that.dimRToShow].description,
            value: (rElement.name) ? rElement.name : _("Nincs adat")
        }], []);
    } else if (rElement === undefined) {
        tooltip = that.createTooltip([{
            name: that.localMeta.dimensions[that.dimCToShow].description,
            value: (cElement.name) ? cElement.name : _("Nincs adat")
        }], []);
    } else {
        var unitProperty = (cElement.value === 1) ? "unit" : "unitPlural";
        tooltip = that.createTooltip([{
            name: that.localMeta.dimensions[that.dimRToShow].description,
            value: (rElement.name) ? rElement.name : _("Nincs adat")
        }, {
            name: that.localMeta.dimensions[that.dimCToShow].description,
            value: (cElement.dimCName) ? cElement.dimCName : _("Nincs adat")

        }], [{
            name: that.localMeta.indicators[that.valToShow].description,
            value: cElement.value,
            dimension: ((that.valFraction) ? that.localMeta.indicators[that.valToShow].fraction[unitProperty] : that.localMeta.indicators[that.valToShow].value[unitProperty])
        }]);
    }

    return tooltip;
};

/**
 * Egy összetett névsor-összehasonlítót generál, amely az elemi adatsorokat
 * előszőr az X dimenzió mentén rendezi sorba, azon belül az Y szerint.
 *
 * @returns {Function} Az összehasonlító-függvény.
 */
panel_table2d.prototype.getCmpFunction = function () {
    var that = this;
    return function (a, b) {
        return global.realCompare2d(a.dims[that.dimR].name, a.dims[that.dimC].name, b.dims[that.dimR].name, b.dims[that.dimC].name);
    };
};

/**
 * Az adatok névsor szerinti sorbarendezéséhez szükséges névsor-összehasonlító.
 *
 * @param {Object} a Egy adatelem.
 * @param {Object} b Egy másik adatelem.
 * @returns {boolean} Az összehasonlítás eredménye.
 */
panel_table2d.prototype.simpleCmp = function (a, b) {
    return global.realCompare(a.name, b.name);
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
panel_table2d.prototype.preUpdate = function (drill) {
    var that = this;

    // If it shows a control when clciked on, produce a blinking
    if (drill.dim >= global.baseLevels[that.panelSide].length) {
        if (drill.initiator === that.panelId) {
            const transition = d3.transition().duration(global.blinkDuration);

            // If it is made along the X dimension
            if (drill.dim === that.dimRToShow) {
                that.gRowHeads.selectAll(".svgRowHead").filter(function(d) {
                    return (d.id === drill.toId);
                }).selectAll("rect").call(that.applyBlinking, transition);
            }

            // If it is made along the Y dimension
            if (drill.dim === that.dimCToShow) {
                that.gColumnHeads.selectAll(".svgColumnHead").filter(function(d) {
                    return (d.id === drill.toId);
                }).selectAll("rect").call(that.applyBlinking, transition);
            }
        }
    } else {

        // Ha az X dimenzió mentén történik valami.
        if (drill.dim === that.dimRToShow) {

            // Ha az lefúrás, mindent, kivéve amibe fúrunk, letörlünk.
            if (drill.direction === -1) {

                // Sorfejek: nem kellőek törlése.
                that.gRowHeads.selectAll(".svgRowHead")
                    .filter(function (d) {
                        return (d.id !== drill.toId);
                    })
                    .remove();

                // Táblázatsorok: nem kellőek törlése.
                that.gTable.selectAll(".svgTableRow")
                    .filter(function (d) {
                        return (d.id !== drill.toId);
                    })
                    .remove();
            }

            // Ha felfúrás történik.
            else if (drill.direction === 1) {

                // Ha nem a legalsó szinten vagyunk, akkor minden sor törlése.
                if ((global.baseLevels[that.panelSide])[that.dimRToShow].length + 2 !== that.localMeta.dimensions[that.dimRToShow].levels) {
                    that.gRowHeads.selectAll(".svgRowHead").remove();
                    that.gTable.selectAll(".svgTableRow").remove();
                }
            }
        }

        // Ha az Y dimenzió mentén történik valami.
        else if (drill.dim === that.dimCToShow) {

            // Ha az lefúrás, mindent, kivéve amibe fúrunk, törlünk.
            if (drill.direction === -1) {
                // Oszlopfejek: nem kellőek törlése.
                that.gColumnHeads.selectAll(".svgColumnHead")
                    .filter(function (d) {
                        return (d.id !== drill.toId);
                    })
                    .remove();

                // Táblázatsorok: nem kellőek törlése.
                that.gTable.selectAll(".svgTableCell")
                    .filter(function (d) {
                        return (d.dimCId !== drill.toId);
                    })
                    .remove();
            }

            // Ha felfúrás.
            else if (drill.direction === 1) {
                if ((global.baseLevels[that.panelSide])[that.dimCToShow].length + 2 !== that.localMeta.dimensions[that.dimCToShow].levels) {

                    // Ha nem a legalsó szinten vagyunk, akkor minden oszlop törlése.
                    that.gColumnHeads.selectAll(".svgColumnHead").remove();
                    that.gTable.selectAll(".svgTableRow").remove();
                }
            }
        }
    }
};

/**
 * Az új adat előkészítése. Meghatározza hogy mit, honnan kinyílva kell kirajzolni.
 *
 * @param {Object} oldPreparedData Az előzőleg kijelzett adatok.
 * @param {Array} newDataRows Az új adatsorokat tartalmazó tömb.
 * @param {Object} drill Az épp végrehajtandó fúrás.
 * @returns {Object} Az új megjelenítendő adatok.
 */
panel_table2d.prototype.prepareData = function (oldPreparedData, newDataRows, drill) {
    const that = this;
    const levelR = (that.dimRToShow < global.baseLevels[that.panelSide].length) ? (global.baseLevels[that.panelSide])[that.dimRToShow].length : 0;
    const levelC = (that.dimCToShow < global.baseLevels[that.panelSide].length) ? (global.baseLevels[that.panelSide])[that.dimCToShow].length : 0;

    newDataRows.sort(that.getCmpFunction());	// Elemi adatok sorbarendezése.
    const dimCArray = [];		// Értékek az Y dimenzió mentén. (Azért kell, mert az adatok az X mentén kerülnek tárolásra.)
    const dataArray = [];		// Az adatok tömbje, az X dimenzió mentén tárolva, azon belül pedig az Y mentén.

    // Maximális oszlophossz meghatározása, oszlop x, y helyének adatbaírása
    let currentRDimId;
    let currentRPosition = -1;

    // Az oszlopdimenzió feltöltése.
    for (var i = 0; i < newDataRows.length; i++) {
        var d = newDataRows[i];

        var dimC = d.dims[that.dimC];
        var index = global.positionInArrayByProperty(dimCArray, "id", dimC.id);

        // Oszlop dimenzió hozzáadása, ha még nem volt benne.
        if (index === -1) {
            index = dimCArray.length;
            const dimCElement = {
                index: index,
                oldColumnIndex: index,
                id: dimC.id,
                uniqueId: levelC + "L" + dimC.id,
                name: dimC.name.trim(),
                parentId: dimC.parentId,
                tooltip: that.getTooltip(undefined, dimC),
                startOpacity: 0,
                sumValues: that.valueToShow(d)
            };
            dimCArray.push(dimCElement);
        } else {
            dimCArray[index].sumValues = dimCArray[index].sumValues + that.valueToShow(d);
        }

    }

    // Az oszlopok névsorba, vagy érték szerinti sorbarendezése
    if (that.sortByValue) {
        dimCArray.sort(function (a, b) {
            if (a.sumValues < b.sumValues) return 1;
            if (a.sumValues > b.sumValues) return -1;
            return 0;
        });
    } else {
        dimCArray.sort(that.simpleCmp);
    }

    for (var i = 0, iMax = dimCArray.length; i < iMax; i++) {
        dimCArray[i].index = i;
        dimCArray[i].oldColumnIndex = i;
    }

    // Alapértékek beállítása.
    for (var i = 0; i < newDataRows.length; i++) {
        var d = newDataRows[i];

        // Ha új sor-dimenzióbeli elemről van szó, létrehozunk egy új üres element.
        if (d.dims[that.dimR].id !== currentRDimId) {
            var dimR = d.dims[that.dimR];
            currentRDimId = dimR.id;
            currentRPosition++;
            var element = {
                index: currentRPosition,
                oldRowIndex: currentRPosition,
                id: currentRDimId,
                uniqueId: levelR + "L" + currentRDimId,
                name: dimR.name.trim(),
                values: [],
                tooltip: that.getTooltip(dimR),
                startOpacity: 0,
                sumValues: that.valueToShow(d)
            };
            dataArray.push(element);
        } else {
            dataArray[dataArray.length - 1].sumValues = dataArray[dataArray.length - 1].sumValues + that.valueToShow(d);
        }

        var dimC = d.dims[that.dimC];
        var index = global.positionInArrayByProperty(dimCArray, "id", dimC.id);

        // Cella értékének hozzáadása a sorhoz.
        var element = dataArray[dataArray.length - 1];
        var val = that.valueToShow(d);
        var cellData = {
            index: index,
            oldColumnIndex: index,
            value: val,
            dimCId: dimC.id,
            dimCUniqueId: levelC + "L" + dimC.id,
            dimCName: dimC.name.trim(),
            startOpacity: 1
        };
        cellData.tooltip = that.getTooltip(dimR, cellData);
        element.values.push(cellData);
    }

    if (that.sortByValue) {
        dataArray.sort(function (a, b) {
            if (a.sumValues < b.sumValues) return 1;
            if (a.sumValues > b.sumValues) return -1;
            return 0;
        });
        for (var i = 0, iMax = dataArray.length; i < iMax; i++) {
            dataArray[i].index = i;
        }
    }
    // Honnan nyíljon ki az animáció?
    if (oldPreparedData && drill.dim === that.dimRToShow && drill.direction === -1) { // Ha sorba való lefúrás történt.
        var oldRowIndex = global.getFromArrayByProperty(oldPreparedData.dataArray, 'id', drill.toId).index;
        for (var r = 0, rMax = dataArray.length; r < rMax; r++) {
            dataArray[r].oldRowIndex = oldRowIndex;
            dataArray[r].startOpacity = (1 / rMax) + 0.2;
        }
    } else if (oldPreparedData && drill.dim === that.dimRToShow && drill.direction === 1) { // Ha sorból való felfúrás történt.
        var offset = (oldPreparedData.dataArray.length - 1) / 2;
        var newRowIndex = global.getFromArrayByProperty(dataArray, 'id', drill.fromId).index;
        for (var r = 0, rMax = dataArray.length; r < rMax; r++) {
            dataArray[r].oldRowIndex = (dataArray[r].index - newRowIndex) * 5 + offset;
            dataArray[r].startOpacity = (dataArray[r].index === newRowIndex) ? 1 : 0;
        }
    } else if (oldPreparedData && drill.dim === that.dimCToShow && drill.direction === -1) { // Oszlopba való lefúráskor.
        var openFromCElement = global.getFromArrayByProperty(oldPreparedData.dimCArray, 'id', drill.toId);
        var oldColumnIndex = (openFromCElement) ? openFromCElement.index : null; // Az új elemek kinyitásának kezdőpozíciója.		
        for (var v = 0, vMax = dimCArray.length; v < vMax; v++) {
            dimCArray[v].oldColumnIndex = oldColumnIndex;
            dimCArray[v].startOpacity = (1 / vMax) + 0.2;
            for (var r = 0, rMax = dataArray.length; r < rMax; r++) {
                var values = dataArray[r].values;
                if (values[v] !== null && values[v] !== undefined) {
                    values[v].oldColumnIndex = oldColumnIndex;
                    values[v].startOpacity = (1 / vMax) + 0.2;
                }
            }
        }
    } else if (oldPreparedData && drill.dim === that.dimCToShow && drill.direction === 1) { // Ha oszlopból való felfúrás történt.
        var offset = (oldPreparedData.dimCArray.length - 1) / 2;
        var newColumnIndex = global.getFromArrayByProperty(dimCArray, 'id', drill.fromId).index;
        for (var r = 0, rMax = dataArray.length; r < rMax; r++) {
            dataArray[r].startOpacity = 1;
        }
        for (var v = 0, vMax = dimCArray.length; v < vMax; v++) {
            dimCArray[v].oldColumnIndex = (dimCArray[v].index - newColumnIndex) * 5 + offset;
            dimCArray[v].startOpacity = (dimCArray[v].index === newColumnIndex) ? 1 : 0;
            for (var r = 0, rMax = dataArray.length; r < rMax; r++) {
                var values = dataArray[r].values;
                if (values[v] !== null && values[v] !== undefined) {
                    values[v].oldColumnIndex = (values[v].index - newColumnIndex) * 5 + offset;
                    values[v].startOpacity = (values[v].index === newColumnIndex) ? 1 : 0;
                }
            }
        }
    }

    return {dataArray: dataArray, dimCArray: dimCArray};
};

/**
 * Új adat megérkeztekor levezényli a panel frissítését.
 *
 * @param {Object} data Az új adat.
 * @param {Object} drill Az épp végrehajzásra kerülő fúrás.
 * @returns {undefined}
 */
panel_table2d.prototype.update = function (data, drill) {
    var that = this;
    that.data = data || that.data;
    drill = drill || {dim: -1, direction: 0};

    // A hányados kijelzés, és a szorzó felfrissítése.
    that.valMultiplier = (isNaN(parseFloat(that.localMeta.indicators[that.valToShow].value.multiplier))) ? 1 : parseFloat(that.localMeta.indicators[that.valToShow].value.multiplier);
    that.fracMultiplier = (isNaN(parseFloat(that.localMeta.indicators[that.valToShow].fraction.multiplier))) ? 1 : parseFloat(that.localMeta.indicators[that.valToShow].fraction.multiplier);
    if (that.valFraction && that.localMeta.indicators[that.valToShow].fraction.hide) {
        that.valFraction = false;
    }
    if (!that.valFraction && that.localMeta.indicators[that.valToShow].value.hide) {
        that.valFraction = true;
    }

    var tweenDuration = (drill.duration === undefined) ? global.getAnimDuration(-1, that.panelId) : drill.duration;
    var trans = d3.transition().duration(tweenDuration);

    if (that.data.rows.length > that.maxEntries) {
        that.panic(true, _("<html>A panel nem képes ") + that.data.rows.length + _(" értéket megjeleníteni.<br />A maximálisan megjeleníthető értékek száma ") + that.maxEntries + _(".</html>"));
        that.preparedData = undefined;
    } else {
        that.preparedData = that.prepareData(that.preparedData, that.data.rows, drill);
        var maxInDim = Math.max(that.preparedData.dimCArray.length, Math.ceil(that.data.rows.length / that.preparedData.dimCArray.length));
        if (maxInDim > that.maxEntries1D) {
            that.horizontalScrollbar.set(0, global.colorValue(that.valToShow, that.panelSide), trans);
            that.verticalScrollbar.set(0, global.colorValue(that.valToShow, that.panelSide), trans);
            that.panic(true, _("<html>A panel nem képes ") + maxInDim + _(" értéket egy dimenzió mentén megjeleníteni.<br />A maximálisan megjeleníthető értékek száma ") + that.maxEntries1D + _(".</html>"));
            that.preparedData = undefined;
        } else {
            that.panic(false);
            // Fejlécek és cellák kirajzolása.
            that.drawRowHeaders(that.preparedData, trans);
            that.drawColumnHeaders(that.preparedData, trans);
            that.drawCells(that.preparedData, trans);

            that.horizontalScrollbar.set(that.preparedData.dimCArray.length * that.tableSpacingHorizontal, global.colorValue(that.valToShow, that.panelSide), trans);
            that.verticalScrollbar.set(that.preparedData.dataArray.length * that.tableSpacingVerical, global.colorValue(that.valToShow, that.panelSide), trans);
        }
    }
    // A panel fejlécének beállítása.
    var titleMeta = that.localMeta.indicators[that.valToShow];
    that.titleBox.update(that.valToShow, titleMeta.caption, titleMeta.value.unitPlural, titleMeta.fraction.unitPlural, that.valFraction, tweenDuration);
};

/**
 * A táblázat celláinak kirajzolása.
 *
 * @param {Object} preparedData A megjelenítendő adatokat tartalmazó előkészített objektum.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_table2d.prototype.drawCells = function (preparedData, trans) {
    var that = this;

    // A sorok adathoz társítása. Kulcs: a táblázatsor dimenziója.
    var row = that.gTable.selectAll(".svgTableRow")
        .data(preparedData.dataArray, function (d) {
            return d.name;
        });

    // Kilépő sorok törlése.
    row.exit().remove();

    // A belépő sorok tartója, és egyesítés a maradókkal.
    row = row.enter().append("svg:g")
        .attr("class", "svgTableRow alterColored")
        .attr("transform", function (d) {
            return "translate(0," + (d.oldRowIndex * that.tableSpacingVerical) + ")";
        })
        .attr("opacity", function (d) {
            return d.startOpacity;
        })
        .merge(row);

    // A sor helyremozgási, színezési animációja.
    row.attr("parity", function (d) {
        return d.index % 2;
    })
        .transition(trans)
        .attr("transform", function (d) {
            return "translate(0, " + d.index * that.tableSpacingVerical + ")";
        })
        .attr("opacity", 1);

    // Cellákhoz való adattársítás.
    var cell = row.selectAll(".svgTableCell")
        .data(function (d) {
            return d.values;
        }, function (d2) {
            return d2.dimCName;
        });

    // Kilépő cellák letörlése.
    cell.exit().remove();

    // Új cella tartójának elkészítése.
    var newCell = cell.enter().append("svg:g")
        .attr("class", "svgTableCell alterColored")
        .attr("transform", function (d) {
            return "translate(" + (d.oldColumnIndex * that.tableSpacingHorizontal) + ",0)";
        })
        .attr("opacity", function (d) {
            return d.startOpacity;
        });

    // Új cella háttértéglalapjának kirajzolása.
    newCell.append("svg:rect")
        .attr("class", "backgroundRect")
        .attr("width", that.tableSpacingHorizontal)
        .attr("height", that.tableSpacingVerical);

    // Új cella szövegdobozának elkészítése.
    newCell.append("svg:text")
        .attr("x", that.tableSpacingHorizontal / 2)
        .attr("y", that.tableSpacingVerical / 2)
        .attr("dy", ".35em");

    // Maradók és új elemek összeöntése.
    cell = newCell.merge(cell);

    // A cellák szövegének beállítása, és megjelnési animációja.
    cell.select("text")
        .attr("opacity", function (d) {
            return (global.cleverRound5(d.value) === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return global.cleverRound5(d.value);
        })
        .transition(trans)
        .attr("opacity", 1);

    // A cellatéglalaphoz tartalmazó adat befrissítése.
    cell.select("rect");

    // A cella helyremozgási, színezési animációja.
    cell.attr("parity", function (d) {
        return d.index % 2;
    })
        .transition(trans)
        .attr("transform", function (d) {
            return "translate(" + (d.index * that.tableSpacingHorizontal) + ",0)";
        })
        .attr("opacity", 1);
};

/**
 * A táblázatsorok fejlécének elkészítése.
 *
 * @param {Object} preparedData A megjelenítendő adatokat tartalmazó előkészített objektum.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_table2d.prototype.drawRowHeaders = function (preparedData, trans) {
    var that = this;

    // A sorok fölé a dimenzió kiírása
    that.axisRCaption
        .text(that.localMeta.dimensions[that.dimRToShow].caption)
        .attr("text-anchor", "start")
        .transition(trans).attrs({
        x: 0, y: 0
    });

    // Sorfejekhez való adattársítás.
    var gRowHead = that.gRowHeads.selectAll(".svgRowHead")
        .data(preparedData.dataArray, function (d) {
            return d.uniqueId + d.name;
        });

    // Kilépő sorfejkonténer törlése.
    gRowHead.exit()
        .on("click", null)
        .remove();

    // Belépő sorfejkonténerek elhelyezése.
    var newGRowHead = gRowHead.enter().append("svg:g")
        .attr("class", "svgRowHead listener alterColored")
        .on("click", function (d) {
            that.drill(that.dimR, d);
        })
        .attr("transform", function (d) {
            return "translate(0," + (d.oldRowIndex * that.tableSpacingVerical) + ")";
        })
        .attr("opacity", function (d) {
            return d.startOpacity;
        });

    // Sorfej háttértéglalapjának elkészítése.
    newGRowHead.append("svg:rect")
        .attr("class", "backgroundRect")
        .attr("width", that.tableHeadWidth)
        .attr("height", that.tableSpacingVerical);

    // A sorfej szövegdobozának elkészítése.
    newGRowHead.append("svg:text")
        .attr("opacity", 1)
        .attr("class", "svgRowHeadLabel svgTableHeadLabel")
        .attr("y", that.tableSpacingVerical / 2)
        .attr("x", 0)
        .attr("dy", "0.35em")
        .attr("dx", ".26em")
        .text(function (d) {
            return d.name;
        });

    // Maradók és új elemek összeöntése.
    gRowHead = newGRowHead.merge(gRowHead);

    // A sorfejlécekhez tartozó adat befrissítése.
    gRowHead.select("rect");
    gRowHead.select("text");

    // Helyremozgási, színezési animáció.
    gRowHead.attr("parity", function (d) {
        return d.index % 2;
    })
        .classed("darkenable", false)
        .transition(trans)
        .attr("opacity", 1)
        .attr("transform", function (d) {
            return "translate(0, " + d.index * that.tableSpacingVerical + ")";
        })
        .on("end", Panel.prototype.classedDarkenable);

    // Felirat összenyomása a kitöltendő területre.
    global.cleverCompress(that.gRowHeads.selectAll("text"), that.tableHeadWidth, 0.94, 1.4);
};

/**
 * Az oszlopok fejlécének elkészítése.
 *
 * @param {Object} preparedData A megjelenítendő adatokat tartalmazó előkészített objektum.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_table2d.prototype.drawColumnHeaders = function (preparedData, trans) {
    var that = this;

    // Az oszlopok fölé a dimenzió kiírása
    that.axisCCaption
        .text(that.localMeta.dimensions[that.dimCToShow].caption)
        .attr("text-anchor", "start")
        .transition(trans).attrs({
        x: 0, y: 0
    });

    // Feliratok az oszlopok elején.
    var gColumnHead = that.gColumnHeads.selectAll(".svgColumnHead")
        .data(preparedData.dimCArray, function (d) {
            return d.uniqueId + d.name;
        });

    // Kilépő oszlopfejlécek törlése.
    gColumnHead.exit()
        .on("click", null)
        .remove();

    // Belépő oszlopfejkonténerek elhelyezése.
    var newGColumnHead = gColumnHead.enter().append("svg:g")
        .attr("class", "svgColumnHead alterColored listener")
        .on("click", function (d) {
            that.drill(that.dimC, d);
        })
        .attr("transform", function (d) {
            return "translate(" + (d.oldColumnIndex * that.tableSpacingHorizontal) + ",0)";
        })
        .attr("opacity", function (d) {
            return d.startOpacity;
        });

    // Oszlopfej háttértéglalapjának elkészítése.
    newGColumnHead.append("svg:rect")
        .attr("class", "backgroundRect")
        .attr("width", that.tableSpacingHorizontal)
        .attr("height", that.tableHeadHeight);

    // Oszlopfej szövegének megírása.
    newGColumnHead.append("svg:text")
        .attr("opacity", 1)
        .attr("class", "svgColumnHeadLabel svgTableHeadLabel")
        .attr("x", that.tableSpacingHorizontal / 2)
        .attr("y", that.tableHeadHeight / 2)
        .attr("dy", "0.35em")
        .text(function (d) {
            return d.name;
        });

    // Maradók és új elemek összeöntése.
    gColumnHead = newGColumnHead.merge(gColumnHead);

    // Az oszlopfejlécekhez tartozó adat befrissítése.
    gColumnHead.select("rect");
    gColumnHead.select("text");

    // Helyremozgási, színezési animáció.
    gColumnHead.attr("parity", function (d) {
        return d.index % 2;
    })
        .classed("darkenable", false)
        .transition(trans)
        .attr("transform", function (d) {
            return "translate(" + (d.index * that.tableSpacingHorizontal) + ",0)";
        })
        .attr("opacity", 1)
        .on("end", Panel.prototype.classedDarkenable);

    // Felirat összenyomása a kitöltendő területre.
    global.cleverCompress(that.gColumnHeads.selectAll("text"), that.tableSpacingHorizontal, .85, 1.4);
};

//////////////////////////////////////////////////
// Irányítást végző függvények
//////////////////////////////////////////////////

/**
 * Valamely dimenzióban történő le vagy felfúrást kezdeményező függvény.
 *
 * @param {int} dim A lefúrás dimenziója (0 vagy 1).
 * @param {Object} d Lefúrás esetén a lefúrás céleleme. Ha undefined, akkor felfúrásról van szó.
 * @returns {undefined}
 */
panel_table2d.prototype.drill = function (dim, d) {
    global.tooltip.kill();
    const drill = {
        initiator: this.panelId,
        dim: (dim === this.dimR) ? this.dimRToShow : this.dimCToShow,
        direction: (d === undefined) ? 1 : -1,
        toId: (d === undefined) ? undefined : d.id,
        toName: (d === undefined) ? undefined : d.name
    };
    this.mediator.publish("drill", drill);
};

/**
 * A dimenzióváltást végrehajtó függvény.
 *
 * @param {String} panelId A dimenzióváltást kapó panel ID-ja.
 * @param {int} newDimId A helyére bejövő dimenzió ID-ja.
 * @param {int} dimToChange A megváltoztatandó dimenzió sorszáma (0 vagy 1).
 * @returns {undefined}
 */
panel_table2d.prototype.doChangeDimension = function (panelId, newDimId, dimToChange) {
    var that = this;
    if (panelId === that.panelId) {
        if (dimToChange === 0) {
            that.dimRToShow = newDimId;
            that.actualInit.dimr = that.dimRToShow;
        } else {
            that.dimCToShow = newDimId;
            that.actualInit.dimc = that.dimCToShow;
        }
        that.dimR = (that.dimRToShow <= that.dimCToShow) ? 0 : 1; // Az x tengelyen megjelenítendő dimenzió sorszáma (a data-n belül).
        that.dimC = (that.dimRToShow < that.dimCToShow) ? 1 : 0; // Az oszloposztásban megjelenítendő dimenzió sorszáma (a data-n belül).

        that.mediator.publish("register", that, that.panelId, [that.dimRToShow, that.dimCToShow], that.preUpdate, that.update, that.getConfig);

        global.tooltip.kill();
        that.mediator.publish("drill", {dim: -1, direction: 0, toId: undefined});
    }
};
