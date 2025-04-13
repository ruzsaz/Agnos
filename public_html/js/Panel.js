/* global d3, global */

'use strict';

/**
 * Az összes panel (kivéve a fejléc) közös őse.
 * 
 * @param {Object} panelInitString A panelt inicializáló objektum.
 * @param {Object} mediator A panel számára rendelkezésre álló mediátor.
 * @param {Boolean} isShortingByValueEnabled Engedélyezett-e a sorbarendezés-váltó?
 * @param {Boolean} isLegendRequired Kell-e alul helyet kihagyni a jelkulcsnak?
 * @param {Number} leftOffset Bal oldali üresen hagyandó terület (margó) pixelben.
 * @param {Number} rightOffset Jobb oldali üresen hagyandó terület (margó) pixelben.
 * @param {Number} topOffset Felső üresen hagyandó terület (margó) pixelben.
 * @param {Number} bottomOffset Alsó üresen hagyandó terület (margó) pixelben.
 * @returns {Panel} Az elkészült panel.
 */
function Panel(panelInitString, mediator, isShortingByValueEnabled, isLegendRequired, leftOffset, rightOffset, topOffset, bottomOffset) {
    const that = this;
    leftOffset = leftOffset || 0;
    rightOffset = rightOffset || 0;
    topOffset = topOffset || 0;
    bottomOffset = bottomOffset || 0;    

    this.panelInitString = panelInitString;

    this.panelSide = panelInitString.group || 0;
    this.isLegendRequired = isLegendRequired;
    this.alternateSwitchEnabled = true;
    this.meta = global.facts[that.panelSide].reportMeta;
    this.localMeta = global.facts[that.panelSide].getLocalMeta();
    this.containerId = "#container" + that.panelSide;
    this.divPosition = (panelInitString.position !== undefined) ? panelInitString.position : d3.selectAll(that.containerId + " .panel.single").nodes().length;
    this.panelId = "#panel" + that.panelSide + "P" + that.divPosition;

    this.mediator = mediator;
    this.isShortingByValueEnabled = isShortingByValueEnabled;
    this.data = undefined;	// Data for the panel
    this.dimsToShow = [];
    this.sortByValue = panelInitString.sortbyvalue || false;
    this.htmlTagStarter = "<html lang=" + String.locale + ">";

    this.valMultiplier = 1;		// Ennyiszeresét
    this.fracMultiplier = 1;		// Ennyiszeresét
    this.valFraction = false;           // Hányadost mutasson?
    this.inPanic = false;		// Hibaüzemmódban van a panel?
    this.mediatorIds = [];		// A mediátorok id-jeit tartalmazó tömb.
    this.replaceFunction;
    this.magLevel = panelInitString.mag || 1;          // Nagyítottsági szint.
    this.fromMagLevel = panelInitString.frommg || 1;          // Ahonnan érkezik a nagyítás.
    if (global.panelNumberOnScreen === 1) {
        this.magLevel = 1;
        this.panelInitString.mag = 1;
        this.fromMagLevel = 1;
    }
    this.w = that.w * that.magLevel;
    this.legendWidth = that.w - 2 * global.legendOffsetX;
    this.h = that.h * that.magLevel;
    this.legendOffsetX = global.legendOffsetX;// * that.magLevel;
    if (this.magLevel !== 1) {
        this.h = this.h * this.doubleHeightModifier;
    }

    this.margin = {
        top: global.panelTitleHeight + 3 * global.legendOffsetY + topOffset,
        right: global.legendOffsetX + rightOffset,
        bottom: bottomOffset + ((isLegendRequired) ? global.legendHeight + 2 * global.legendOffsetY : global.legendOffsetY + global.legendHeight / 2),
        left: global.legendOffsetX + leftOffset
    };

    this.width = that.w - that.margin.left - that.margin.right;
    this.height = that.h - that.margin.top - that.margin.bottom;

    this.container = d3.select(this.containerId);

    this.panelDiv = that.container.append("html:div")
            .attr("id", that.panelId.substring(1))
            .attr("class", "panel single")
            .classed("magnified", that.magLevel !== 1)
            .styles(global.getStyleForScale(that.fromMagLevel / that.magLevel, 0, 0))
            .style("width", that.w * that.fromMagLevel / that.magLevel + "px")
            .style("height", that.h * that.fromMagLevel / that.magLevel + "px");

    // Kezdő méretező és helyrevivő animáció, ha nagyítani kell, vagy nagyításból visszakicsinyíteni.
    if (that.magLevel !== 1 || that.fromMagLevel !== 1) {
        that.panelDiv.transition().duration(global.selfDuration)
                .styles(global.getStyleForScale(1, 0, 0))
                .style("width", that.w + "px")
                .style("height", that.h + "px")
                .style("left", "0px")
                .style("top", "0px")
                .on("end", function() {
                    that.actualInit.frommg = 1;
                    d3.select(this)
                            .style("z-index", null);
                });
    }

    this.svg = that.panelDiv.append("svg:svg")
            .attr("width", that.w)
            .attr("height", that.h);

    that.svg.append("svg:rect")
            .attr("class", "backgroundForSave")
            .attr("width", that.w)
            .attr("height", that.h)
            .attr("rx", global.rectRounding);

    this.gLegend = that.svg;

    // Feliratkozás a panelt megölő mediátorra.
    var med = that.mediator.subscribe("killPanel", function(panelId) {
        that.killPanel(panelId);
    });
    that.mediatorIds.push({"channel": "killPanel", "id": med.id});

    // Feliratkozás a nyelvváltó mediátorra.
    med = this.mediator.subscribe("langSwitch", function() {
        that.localMeta = global.facts[that.panelSide].getLocalMeta();
        Panel.prototype.defaultPanicText = _(that.htmlTagStarter + "Nincs megjeleníthető adat.</html>");
        that.langSwitch(global.selfDuration);
    });
    that.mediatorIds.push({"channel": "langSwitch", "id": med.id});

    // Feliratkozás a nagyító mediátorra.
    var med = that.mediator.subscribe("magnifyPanel", function(panelId) {
        that.magnifyPanel(panelId);
    });
    that.mediatorIds.push({"channel": "magnifyPanel", "id": med.id});

    const scaleString = (global.hasTouchScreen) ? " scale(1.4)" : "";

    // Diagram type switch
    if (!global.isEmbedded) {
        const alternateSwitch = that.svg.insert("svg:g")
            .attr("class", "listener visibleInPanic panelControlButton alternateSwitch")
            .attr("transform", "translate(0, 0)" + scaleString)
            .attr("transform-origin", "4 4")
            .on('click', function () {
                that.alternateSwitch();
            })
            .style("display", "none");

        alternateSwitch.append("svg:g")
            .html('<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#alternate_switch_button"></use>');
    }

    // Sorbarendezés váltó
    if (that.isShortingByValueEnabled && !global.isEmbedded) {
        const sortSwitcher = that.svg.insert("svg:g")
            .attr("class", "listener visibleInPanic panelControlButton")
            .attr("transform", "translate(0, " + (that.h - 30) + ")" + scaleString)
            .attr("transform-origin", "4 24")
            .on('click', function () {
                that.sortSwitch();
            });

        sortSwitcher.append("svg:g")
                .html('<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#sort_panel_button"></use>');
    }

    // A nagyító fül
    if (!global.isEmbedded) {
        const duplicator = that.svg.append("svg:g")
            .attr("class", "listener visibleInPanic panelControlButton magnifyPanelButton")
            .attr("transform", "translate(" + (that.w - 30) + ", " + (that.h - 30) + ")" + scaleString)
            .attr("transform-origin", "24 24")
            .on('click', function () {
                if (global.panelNumberOnScreen !== 1) {
                    that.mediator.publish("magnifyPanel", that.panelId);
                }
            });

        duplicator.append("svg:g")
            .html('<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#magnify_panel_button"></use>');
    }

    // CLose panel button
    if (!global.isEmbedded) {
        const closeButton = that.svg.append("svg:g")
            .attr("class", "listener visibleInPanic panelControlButton")
            .attr("transform", "translate(" + (that.w - 30) + ", 0)" + scaleString)
            .attr("transform-origin", "24 4")
            .on('click', function () {
                if (global.panelNumberOnScreen !== 0) {
                    that.mediator.publish("killPanel", that.panelId);
                }
            });

        closeButton.append("svg:g")
                .html('<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#close_panel_button"></use>');
    }
    
    // Placeholder, hogy embedded módban is legyen mihez igazítani a többi réteget
    if (global.isEmbedded) {
        that.svg.append("svg:g").attr("class", "listener visibleInPanic panelControlButton");
    }

    // Fejléc.
    this.titleBox = new TitleBox(that.svg, that.panelId, that.mediator, that.magLevel);
    that.titleBox.gContainer
            .classed('listener', true)
            .on('mouseover', function() {
                that.hoverOn(this);
            })
            .on('mouseout', function() {
                that.hoverOff();
            })
    ;

    // Panel áthúzásához a segédobjektumok.
    this.dragging = false;
    this.dragStartX;
    this.dragStartY;

    /**
     * Az egérgomb lenyomásakor elkezdi a drag-műveletet.
     *
     * @returns {undefined}
     */
    const dragStarted = function () {

        if (!global.isEmbedded) {
            const coords = d3.mouse(that.container.nodes()[0]);
            that.dragStartX = coords[0];
            that.dragStartY = coords[1];
            that.panelDiv.classed("dragging", true)
                .style("z-index", 10000);
        }
    };

    /**
     * Megnézi, hogy húzáskor eleget mozgott-e az egér, ha igen, indítja a mozgatást, átpozícionálást.
     *
     * @returns {undefined}
     */
    const dragging = function() {
        const coords = d3.mouse(that.container.nodes()[0]);
        if (!that.dragging && (coords[0] - that.dragStartX) * (coords[0] - that.dragStartX) + (coords[1] - that.dragStartY) * (coords[1] - that.dragStartY) > that.dragTreshold * that.dragTreshold) {
            that.dragging = true;
        }
        if (that.dragging) {
            that.panelDiv
                    .style("left", ((coords[0] - that.dragStartX) / global.scaleRatio) + "px")
                    .style("top", ((coords[1] - that.dragStartY) / global.scaleRatio) + "px");
            rearrangePanels();
        }
    };

    /**
     * Megnézi, hogy át kell-e helyezni a panelt, és ha igen, megcsinálja.
     *
     * @returns {undefined}
     */
    const rearrangePanels = function() {
        const panels = d3.selectAll("#container" + that.panelSide + " .panel.single").nodes();
        const selfIndex = global.positionInArrayByProperty(panels, "id", that.panelId.substring(1)); // A húzott panel sorszáma a képernyőn megjelenés sorrendjében.
        const x = $(that.panelId)[0].getBoundingClientRect().left;
        const y = $(that.panelId)[0].getBoundingClientRect().top;
        let flipIndex = -1; // Aminek a helyére húzzuk.
        for (let i = 0, iMax = panels.length; i < iMax; i++) {
            if (i !== selfIndex) {
                const ix = $(panels[i])[0].getBoundingClientRect().left;
                const iy = $(panels[i])[0].getBoundingClientRect().top;
                const dx = Math.abs(x - ix) / global.scaleRatio;
                const dy = Math.abs(y - iy) / global.scaleRatio;
                if (dx < global.panelWidth / 2 && dy < global.panelHeight / 2) {
                    flipIndex = i;
                    break;
                }
            }
        }

        let selfIndexModified = selfIndex;
        let flipIndexModified = flipIndex;
        const isMagnified = !d3.selectAll("#container" + that.panelSide + " .panel.single.magnified").empty();

        // Ha nagyított a 0. panel, akkor módosítjuk az indexeket, mert a nagyított panel 4-et foglal.
        if (isMagnified) {
            selfIndexModified = (selfIndexModified + 1 < global.panelNumberOnScreen) ? selfIndexModified + 1 : selfIndexModified + 3;
            flipIndexModified = (flipIndexModified + 1 < global.panelNumberOnScreen) ? flipIndexModified + 1 : flipIndexModified + 3;
        }

        // Ha van mit cserélni, és egyik érintett se nagyított, akkor cserélünk.
        if (flipIndex > -1 && (!isMagnified || (selfIndex > 0 && flipIndex > 0))) {
            const rowDist = Math.floor(selfIndexModified / global.panelNumberOnScreen) - Math.floor(flipIndexModified / global.panelNumberOnScreen);
            const colDist = (selfIndexModified % global.panelNumberOnScreen) - (flipIndexModified % global.panelNumberOnScreen);
            if (selfIndex > flipIndex) {
                $(that.panelId).insertBefore($(panels[flipIndex]));
            } else {
                $(that.panelId).insertAfter($(panels[flipIndex]));
            }
            that.dragStartX = that.dragStartX - global.panelWidth * global.scaleRatio * colDist;
            that.dragStartY = that.dragStartY - global.panelHeight * global.scaleRatio * rowDist;
            const coords = d3.mouse(that.container.nodes()[0]);
            that.panelDiv
                    .style("left", ((coords[0] - that.dragStartX) / global.scaleRatio) + "px")
                    .style("top", ((coords[1] - that.dragStartY) / global.scaleRatio) + "px");
        }
    };

    /**
     * Az egérgomb felengedésekor mindent visszaállít.
     *
     * @returns {undefined}
     */
    const dragEnd = function () {
        that.panelDiv.classed("dragging", false)
            .style("z-index", null)
            .style("left", null)
            .style("top", null);
        that.dragging = false;
        global.getConfig2();
    };

    // Az áthelyezhetőség engedélyezése.
    this.drag = d3.drag()
            .on("start", dragStarted)
            .on("drag", dragging)
            .on("end", dragEnd)
            .clickDistance(that.dragTreshold);

    if (!global.hasTouchScreen) {
        this.svg.call(this.drag);
    }
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    Panel.prototype.w = global.panelWidth;
    Panel.prototype.h = global.panelHeight;
    Panel.prototype.legendOffsetX = global.legendOffsetX;
    Panel.prototype.dragTreshold = 25;      // A paneláthúzáshoz szükséges minimális pixelnyi elhúzás.    
    Panel.prototype.defaultPanicText = _("<html>Nincs megjeleníthető adat.</html>");
    Panel.prototype.doubleMultiplier = 2 + 2 * (global.panelMargin / global.panelWidth); // Nagyítás esetén ennyiszeresére kell nagyítania.
    Panel.prototype.doubleHeightModifier = (2 + 2 * (global.panelMargin / global.panelHeight)) / Panel.prototype.doubleMultiplier; // A függőleges irányú multiplikatív korrekció nagyításkor.
}

/**
 * Beállítja, hogy egy adott elem kurzor hatására elsötétedhessen.
 * 
 * @returns {undefined}
 */
Panel.prototype.classedDarkenable = function() {
    d3.select(this).classed("darkenable", true);
};

/**
 * Az adatsorok névsor szerinti sorbarendezéséhez szükséges névsor-összehasonlító.
 * 
 * @param {Object} a Egy adatelem.
 * @param {Object} b Egy másik adatelem.
 * @returns {int} Az összehasonlítás eredménye.
 */
Panel.prototype.cmp = function(a, b) {
    return global.realCompare(a.dims[0].name, b.dims[0].name);       
};

/**
 * Megformázza a megadott dimenziókat és értékeket tooltipként.
 * 
 * @param {Array} dims A dimenziók nevét és aktuális értékét tartalmazó tömb.
 * @param {Array} vals A mutatók nevét, értékét, mértékegységét, átlagát tartalmazó tömb.
 * @returns {String} A formázott html.
 */
Panel.prototype.createTooltip = function(dims, vals) {
    let separator = "";
    let html = "<html><h4>";
    for (let d = 0, dMax = dims.length; d < dMax; d++) {
        html = html + separator + dims[d].name;
        if (dims[d].value !== undefined) {
            html += ": <em>" + dims[d].value + "</em>";
        }
        separator = "<br />";
    }
    html = html + "</h4>";
    for (let v = 0, vMax = vals.length; v < vMax; v++) {
        html = html + vals[v].name + ": <em>" + global.cleverRound5(vals[v].value) + "</em> (" + vals[v].dimension + ")";
        if (vals[v].avgValue !== undefined) {
            html = html + _("<em> átlag: ") + global.cleverRound5(vals[v].avgValue) + "</em>";
        }
        html = html + "<br />";
    }
    html = html + "</html>";
    return html;
};

/**
 * Megöli a panel 'listener' osztályú elmeihez rendelt eseményfigyelőket.
 * 
 * @returns {undefined}
 */
Panel.prototype.killListeners = function() {
    this.panelDiv.selectAll(".listener")
            .on("click", null)
            .on("mouseover", null)
            .on("mouseout", null);
};

/**
 * 
 * @param {String} panelId A megölendő panel id-je. (Ha a panelen belülről hívjuk, elhagyható.)
 * @param {Number} duration Az animáció ideje, ms. Ha undefined: a globális animáció idő lesz.
 * @param {Object} fromStyle Az animáció kezdőstílusa. Ha undefined: a pillanatnyi állapot.
 * @param {Object} toStyle Az animáció végzőstílusa. Ha undefined: 0x0-ra kicsinyítés a középpontból.
 * @param {Boolean} dontResize Ha true, akkor nem hívja meg a megöléskor a resize-t.
 * @returns {undefined}
 */
Panel.prototype.killPanel = function(panelId, duration, fromStyle, toStyle, dontResize) {
    if (panelId === undefined || panelId === this.panelId) {
        const centerX = parseInt(this.panelDiv.style("width")) / 2;
        const centerY = parseInt(this.panelDiv.style("height")) / 2;
        fromStyle = fromStyle || global.getStyleForScale(1, centerX, centerY);
        toStyle = toStyle || global.getStyleForScale(0, centerX, centerY);

        const killDuration = (duration === undefined) ? global.selfDuration : duration;

        // A panel kivétele a regiszterből.
        this.mediator.publish("register", undefined, this.panelId);

        // A panel listenerjeinek leállítása.
        this.killListeners();

        // A panel mediátor-leiratkozásai.
        for (let i = 0, iMax = this.mediatorIds.length; i < iMax; i++) {
            this.mediator.remove(this.mediatorIds[i].channel, this.mediatorIds[i].id);
        }
        this.mediatorIds = [];

        // Panel levétele a DOM-ból.

        this.panelDiv.classed("dying", true);     // Beállítjuk megsemmisülőnek, hogy ne számolódjon be a panelszámba.
        this.panelDiv.styles(fromStyle)
                .style("opacity", "1")
                .transition().duration(killDuration)
                .styles(toStyle)
                .style("opacity", "0")
                .remove()
                .on("end", global.mainToolbar_refreshState);
        if (!dontResize) {
            $(window).trigger('resize');
        }
        global.getConfig2();
    }
};

/**
 * Nagyítja/kicsinyíti a panelt. (Ha nagyítva volt visszakicsinyíti, ha kicsi volt, nagyítja.)
 * 
 * @param {String} panelId A nagyítandó panel azonosítója. Ha nincs megadva, akkor csak kicsinyít, ha nagy volt.
 * @returns {undefined}
 */
Panel.prototype.magnifyPanel = function(panelId) {
    var that = this;
    if (panelId === that.panelId || that.magLevel !== 1) {
        // Belerakjuk a kezdő és végnagyítottságot a panel init-stringjébe.
        const origMag = that.actualInit.mag;
        if (origMag === 1) {
            that.actualInit.mag = that.doubleMultiplier;
            that.actualInit.frommg = 1;
        } else {
            that.actualInit.mag = 1;
            that.actualInit.frommg = that.doubleMultiplier;
        }

        // Elkészítjük a nagyított panel config-sztringjét, és beleírjuk a pozíciót is.
        const position = that.panelId.slice(-1);
        let config = this.getConfig();
        config = config.substr(0, config.length - 2);
        if (config.slice(-1) !== "{") {
            config = config + ", ";
        }
        config = config + "position: " + position + "})";

        const newPanelId = that.panelId;
        that.panelId = that.panelId + "dying";
        this.panelDiv.attr("id", that.panelId.substring(1));

        // Pici késésel megöljük a régit, létrehozzuk az új nagyítottat. Azért kell a késés,
        // hogy a magnification mediátor-értesítést még az eredeti panelek kapják el.
        setTimeout(function() {
            that.killPanel(that.panelId, global.selfDuration, global.getStyleForScale(that.actualInit.mag / origMag, 0, 0), global.getStyleForScale(that.actualInit.mag / origMag, 0, 0), true);
            eval("new " + config);
            const newPanel = $(newPanelId);
            global.mediators[that.panelSide].publish("drill", {dim: -1, direction: 0, duration: -1, onlyFor: newPanelId});
            that.panelDiv.style("position", "absolute");
            that.panelDiv.style("left", -global.panelMargin + "px");
            that.panelDiv.style("top", -global.panelMargin + "px");
            newPanel.insertBefore($(that.panelId));
            newPanel.prepend($(that.panelId));

            if (that.actualInit.mag !== 1) {
                const panels = d3.selectAll("#container" + that.panelSide + " .panel.single").nodes();

                const startPosition = newPanel.position();
                newPanel.insertBefore($(panels[0]));
                const finishPosition = newPanel.position();
                d3.select(newPanelId)
                        .style("left", ((startPosition.left - finishPosition.left) / global.scaleRatio) + "px")
                        .style("top", ((startPosition.top - finishPosition.top) / global.scaleRatio) + "px")
                        .style("z-index", 5);
            }
            $(window).trigger('resize');
        }, 50/ that.magLevel);

    }
};

/**
 * Pánik-takaró megjelenítése/eltüntetése. Ha az adat nem megjeleníthető,
 * akkor érdemes alkalmazni.
 * 
 * @param {Boolean} panic True: bepánikolás, false: kipánikolás.
 * @param {String} reason Megjelenítendő tooltip.
 * @returns {undefined}
 */
Panel.prototype.panic = function(panic, reason) {
    var that = this;

    // Csak ha megváltozott a panel pánikállapota, vagy új tooltip érkezett.
    if (that.inPanic !== panic) {
        that.inPanic = panic;

        // Ha bepánikolás esete történik.
        if (panic) {

            // Letöröljük az esetlegesen már fennlévő pánikréteget.
            that.svg.selectAll(".panic")
                    .on("click", null)
                    .style("opacity", 0)
                    .remove();

            // Új réteg a többi fölé, de azért a címsor mögé.
            const gPanic = that.svg.insert("svg:g", ".title_group")
                .attr("class", "panic listener")
                .style("opacity", 0)
                .on("click", function () {
                    that.drill();
                });

            // Mindent kitakaró téglalap a rétegre.
            gPanic.append("svg:g")
                    .append("svg:rect")
                    .attr("width", that.w - 20) // Let the close button appear
                    .attr("height", that.h)
                    .attr("rx", 16)
                    .attr("ry", 16);

            // Szöveg a pánikrétegre.
            gPanic.selectAll("text").data([{tooltip: reason || that.defaultPanicText}])
                    .enter().append("svg:text")
                    .attr("x", that.w / 2)
                    .attr("y", that.h / 2)
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.38em")
                    .attr("font-size", that.h * .8)
                    .text("?");

            // A réteg megjelenítése.
            gPanic.transition().duration(global.selfDuration)
                    .style("opacity", 1);

            // Kipánikolás esetén.
        } else {

            // Pánikréteg letörlése.
            that.svg.selectAll(".panic")
                    .on("click", null)
                    .transition().duration(global.selfDuration)
                    .style("opacity", 0)
                    .remove();
        }
    }

    if (reason) {
        that.svg.selectAll(".panic").selectAll("text").data([{tooltip: reason || that.defaultPanicText}]);
    }

};

Panel.prototype.isAlternateSwitchEnabled = function() {
    return this.alternateSwitchEnabled;
}

Panel.prototype.setAlternateSwitch = function (isEnable) {
    if (isEnable === undefined) {
        this.alternateSwitchEnabled = this.isAlternateSwitchEnabled();
    } else {
        this.alternateSwitchEnabled = isEnable;
    }

    this.svg.select(".alternateSwitch")
        .style("display", (this.alternateSwitchEnabled) ? "unset" : "none");
}

/**
 * Alternate - normal view switch function. Some panels will overwrite it.
 */
Panel.prototype.alternateSwitch = function() {
    const that = this;
    global.tooltip.kill();
    that.alternate = !that.alternate;
    that.update();
    that.actualInit.alternate = that.alternate;
    global.getConfig2();
};

/**
 * Sorbarendezés váltó függvény; az alosztályok majd felülírják maguknak.
 * 
 * @returns {undefined}
 */
Panel.prototype.sortSwitch = function() {
    const that = this;
    global.tooltip.kill();       
    that.sortByValue = !that.sortByValue;
    that.update();    
    that.actualInit.sortbyvalue = that.sortByValue;
    global.getConfig2();
};

/**
 * Az aktuális dimenzióban történő le vagy felfúrást kezdeményező függvény.
 * It can be overwritten by the subclasses.
 *
 * @param {Object} d Lefúrás esetén a lefúrás céleleme. Ha undefined, akkor felfúrásról van szó.
 * @returns {undefined}
 */
Panel.prototype.drill = function (d = undefined) {
    global.tooltip.kill();
    const drill = {
        initiator: this.panelId,
        dim: this.dimToShow,
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
 * @returns {undefined}
 */
Panel.prototype.doChangeDimension = function (panelId, newDimId) {
    const that = this;
    if (panelId === that.panelId) {
        that.dimToShow = newDimId;
        that.actualInit.dim = that.dimToShow;
        that.mediator.publish("register", that, that.panelId, [that.dimToShow], that.preUpdate, that.update, that.getConfig);
        global.tooltip.kill();
        that.mediator.publish("drill", {dim: -1, direction: 0, toId: undefined});
    }
};

/**
 * A mutató- és hányadosválasztást végrehajtó függvény.
 *
 * @param {String} panelId A váltást végrehajtó panel azonosítója. Akkor vált, ha az övé, vagy ha undefined.
 * @param {int} value Az érték, amire váltani kell. Ha -1 akkor a következőre vált, ha undefined, nem vált.
 * @param {boolean} ratio Hányadost mutasson-e. Ha -1 akkor a másikra ugrik, ha undefined, nem vált.
 * @returns {undefined}
 */
Panel.prototype.doChangeValue = function (panelId, value, ratio) {
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
        that.update();
        global.getConfig2();
    }
};

/**
 * Nyelvváltást végrehajtó függvény; az alosztályok majd felülírják maguknak.
 * 
 * @returns {undefined}
 */
Panel.prototype.langSwitch = function() {
    this.htmlTagStarter = "<html>";
};

/**
 * A valamilyen elemre való ejtés lehetőségét jelző/kezelő függvény.
 * Valójában az elem fölött levő egérmutatót figyeli megállás nélkül,
 * de csak akkor csinál bármit is, ha épp valami meg van ragadva.
 * 
 * @param {Object} gHovered Az elemet tartó g. Ennek az első téglalapjára lehet ejteni.
 * @param {String} targetId A célpont-elem osztály-azonosítója (classname).
 * @returns {undefined}
 */
Panel.prototype.hoverOn = function(gHovered, targetId = undefined) {
    if (global.dragDropManager.draggedId !== null) {
        const rectObj = d3.select(gHovered).select("rect"); // A g-ben levő ELSŐ téglalap kiválasztása.
        const transform = (rectObj.attr("transform") !== null) ? rectObj.attr("transform") : d3.select(gHovered).attr("transform");
        const that = this;
        global.dragDropManager.targetObject = gHovered;
        global.dragDropManager.targetPanelId = that.panelId;
        global.dragDropManager.targetId = targetId;
        global.dragDropManager.targetSide = parseInt(that.panelId.replace(/(^.+\D)(\d+)(\D.+$)/i, '$2'));

        // Ha ejthető a dolog, akkor bevonalkázza a célpontot.
        if (global.dragDropManager.draggedMatchesTarget()) {
            that.svg.selectAll(".hoveredDropTarget").remove();
            that.svg.append("svg:rect")
                    .attr("class", "hoveredDropTarget")
                    .attr("width", rectObj.attr("width"))
                    .attr("height", rectObj.attr("height"))
                    .attr("transform", transform)
                    .attr("rx", rectObj.attr("rx"))
                    .attr("ry", rectObj.attr("ry"))
                    .attr("x", rectObj.attr("x"))
                    .attr("y", rectObj.attr("y"))
                    .attr("fill", 'url(#diagonal)');
        }
    }
};

/**
 * Egy dobás-célpontként használt elem elhagyását kezelő függvény.
 * Megszünteti a célpont vonalkázását, és alapállapotba hozza a dragodropmanagert.
 * 
 * @returns {undefined}
 */
Panel.prototype.hoverOff = function() {
    if (global.dragDropManager.targetObject !== null) {
        global.dragDropManager.targetObject = null;
        global.dragDropManager.targetPanelId = null;
        global.dragDropManager.targetId = null;
        this.svg.select(".hoveredDropTarget").remove();
    }
};

/**
 * Visszaadja a panel létrehozó sztringjét, végrehajtjató konstruktor formában.
 * 
 * @returns {String} A panel init sztringje.
 */
Panel.prototype.getConfig = function() {
    let panelConfigString = this.constructorName + "({";
    let prefix = "";
    for (let propName in this.actualInit) {
        const propValue = this.actualInit[propName];
        const defaultValue = this.defaultInit[propName];
        if (this.actualInit.hasOwnProperty(propName) && propValue !== undefined && propName !== "position" && JSON.stringify(propValue) !== JSON.stringify(defaultValue)) {
            if (propValue instanceof Array) {
                panelConfigString = panelConfigString + prefix + propName + ": [" + propValue + "]";
                prefix = ", ";
            } else {
                panelConfigString = panelConfigString + prefix + propName + ": " + propValue;
                prefix = ", ";
            }
        }
    }
    panelConfigString = panelConfigString + "})";
    return panelConfigString;
};

Panel.prototype.applyBlinking = function(selection, transition = d3.transition().duration(global.blinkDuration)) {
    selection
        .style("fill", global.writeOnPanelColor)
        .style("opacity", 1)
        .transition(transition)
        .style("fill", null)
        .style("opacity", null);
};