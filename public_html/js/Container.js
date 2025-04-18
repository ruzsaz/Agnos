/* global d3, version, LZString, URL, global, changelog */

'use strict';

/**
 * Az adatlekérdezőt tartalmazó konténer konstruktora
 * A sikeres belépés után kell példányosítani.
 * 
 * @returns {Container}
 */
function Container() {
    global.mapStore = new MapStore();
    global.dictionaries = [new Dictionaries(), new Dictionaries()];
    
    this.dataDirector = [];
    var that = this;
    var topdiv = d3.select("body").append("html:div")
            .attr("id", "topdiv");    
    
    // Toolbar div-je.
    this.mainToolbar = topdiv.append("html:div")
            .attr("class", "mainToolbar")
            .attr("id", "mainToolbar");

    var browserLocale = (navigator.language || navigator.userLanguage || "en").replace(/[_-].*/ig, "");
    var langFromCookie = global.getCookie("language");
    $("#mainToolbar").load("mainToolbar.html?ver=2025.4.13", undefined, function() {
        if (global.i18nRequired) {
            d3.select(".languageSwitch").style("display", "block");
            browserLocale = langFromCookie || browserLocale;
        } else {
            browserLocale = "hu";
        }
    });

    // Progress-réteg.
    topdiv.append("html:div")
            .attr("id", "progressDiv");

    for (var i = 0; i < 2; i++) {
        var container = topdiv.append("html:div")
                .attr("id", "scrollPaneP" + i)
                .append("html:div")
                .attr("id", "cutter" + i)
                .append("html:div");

        container
                .attr("id", "container" + i)
                .attr("class", "container")
                .style(global.getStyleForScale(1, 0, 0));

        container.append("html:div").attr("id", "headPanelP" + i)
                .attr("class", "panel double");

    }
    d3.select("#container0").classed("activeSide", true);

    this.isSideInUse = [];	// True, ha a panel használatban van, false ha alapállapotban.
    this.counter = 0;       // Számláló, a betöltődésre váro reportok betöltését követi.

    // Az átméretezéskor lefutó függvény eseménykezelője.
    $(window).resize(function() {
        that.onResize();
    });

    var bodyWidth = parseInt(d3.select("#topdiv").style("width"));
    global.panelNumberOnScreen = parseInt((bodyWidth / global.panelWidth) + 0.5);
    
    this.panelState = 0; // 0: baloldal, 1: mindkettő, 2: jobboldal, 3: mindkettő látszik.
    this.resizeInProgress = false; // Hogy ne induljon egyszerre 2 resize event.

    // Reportmeták betöltése, és a böngésző inicializálása.
    global.initGlobals(function() {
        that.initSide(0);
        that.initSide(1);

        // A riportokat tartalmazó táblázat magasságának kiszámolásához...
        that.tableBaseOffset =
                parseInt(d3.select("#headPanelP0").style("margin-top")) +
                parseInt(d3.select("#headPanelP0").style("margin-bottom")) +
                parseInt(d3.select("#greetingBadge").style("padding-top")) +
                parseInt(d3.select("#greetingBadge").style("padding-bottom")) +
                parseInt(d3.select("#greetingBadge").style("height")) +
                parseInt(d3.select(".divTableBase").style("margin-bottom")) +
                parseInt(d3.select(".tableScrollPane").style("margin-top")) +
                parseInt(d3.select(".tableScrollPane").style("margin-bottom"));

        // Ha a bookmarkba van kódolva valami, annak megfelelően indítunk.
        var startString = location.href.split("#")[1];
        if (startString) {
            var startObject = undefined;
            try {
                that.counter = 2;   // 2 report betöltésére várunk, bal, jobbpanel.
                startObject = JSON.parse(LZString.decompressFromEncodedURIComponent(startString));
            } catch (e) {
                startObject = null;
            }
            
            if(startObject === null) {
                location.replace(location.origin + location.pathname);                
                return;
            } 

            try {
                that.navigateTo(startObject);                
            } catch (e) {
                if (global.preferredUsername === undefined) {
                    global.showNotAuthenticated();             
                } else {
                    global.showNotAuthorized(global.preferredUsername);
                }                             
            }            
        } else {
            that.resizeContainers(0, 1, global.panelNumberOnScreen);
        }
        global.setLanguage(browserLocale);
    });

    that.initChangelog();
    global.tagForLocalization();

}

/**
 * Oldalváltást végrehajtó függvény.
 * 
 * @returns {undefined}
 */
Container.prototype.switchPanels = function() {
    this.panelState = (this.panelState + 1) % 4;
    var newSize = Math.abs((this.panelState / 2) - 1);
    this.resizeContainers(global.selfDuration, newSize, global.panelNumberOnScreen, true);
    d3.select("#container0").classed("activeSide", (this.panelState !== 2));
    d3.select("#container1").classed("activeSide", (this.panelState !== 0));
    global.mainToolbar_refreshState();
};

/**
 * Nagyítást végrehajtó függvény.
 * 
 * @param {Integer} direction 1: Egyel több panelt akarunk látni; -1: egyel kevesebbet.
 * @returns {undefined}
 */
Container.prototype.magnify = function(direction) {
    global.oldPanelNumberOnScreen = global.panelNumberOnScreen;
    global.panelNumberOnScreen = Math.min(global.maxPanelCount, Math.max(1, global.panelNumberOnScreen + direction));
    global.mainToolbar_refreshState();
    if (global.panelNumberOnScreen === 1) {
        global.mediators[0].publish("magnifyPanel", undefined);
        global.mediators[1].publish("magnifyPanel", undefined);        
    }    
    this.onResize(global.panelNumberOnScreen);
};

/**
 * A böngészőablak átméretezése után átméretez mindent, hogy épp egész számú
 * panel férjen ki a képernyőre.
 * 
 * @param {Integer} panelsPerScreen A képernyőre vízszintesen kirakandó panelek száma.
 * @returns {undefined}
 */
Container.prototype.onResize = function(panelsPerScreen) {
    if (panelsPerScreen === undefined || panelsPerScreen < 0) {
        panelsPerScreen = global.panelNumberOnScreen;
    }
    var newSize = Math.abs((this.panelState / 2) - 1);
                d3.select("#topdiv").classed("singleWidth", (global.panelNumberOnScreen === 1));

    this.resizeContainers(global.selfDuration, newSize, panelsPerScreen);
};

/**
 * Mindkét oldalt animálva átméretezi.
 * 
 * @param {Number} duration Az átméretezés ideje (ms).
 * @param {Number} container0SizePercentage A bal oldali konténer relatív mérete: 0, 0.5 vagy 1.
 * @param {Integer} panelsPerRow Ennyi panelnek kell egy sorba kiférnie.
 * @param {Boolean} isViewSwitch Nézetváltás miatt (1-2 panel) van szükség átméretezésre?
 * @returns {undefined}
 */
Container.prototype.resizeContainers = function(duration, container0SizePercentage, panelsPerRow, isViewSwitch) {
    var that = this;
    const currentPanelsPerRow = 
    that.resizeContainer(0, duration, container0SizePercentage, panelsPerRow, undefined, isViewSwitch);
    that.resizeContainer(1, duration, 1 - container0SizePercentage, panelsPerRow, undefined, isViewSwitch);
};

/**
 * Az egyik oldalt animálva átméretezi.
 * 
 * @param {Integer} side A kérdéses oldal.
 * @param {Number} duration Az átméretezés ideje (ms).
 * @param {Number} sizePercentage Az oldal a képernyő mennyied részét tölti ki? (0, 0.5, 1)
 * @param {Integer} panelsPerRow Ennyi panelnek kell egy sorba kiférnie.
 * @param {Number} scaleRatio A kért nagyítási arány a nyers pixel számokhoz képest. Ha undefined, megpróbáljuk kiszámolni.
 * @param {Boolean} isViewSwitch Nézetváltás miatt (1-2 panel) van szükség átméretezésre?
 * @returns {undefined}
 */
Container.prototype.resizeContainer = function(side, duration, sizePercentage, panelsPerRow, scaleRatio, isViewSwitch) {
    var that = this;
    var bodyWidth = parseInt(d3.select("#topdiv").style("width"));
    var bodyHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);    
    var panelMargin = parseInt($(".panel").css("margin-top")) + parseInt($(".panel").css("border-top-width"));
    var panelRealWidth = global.panelWidth + 2 * panelMargin; // Egy panel ténylegesen ennyi pixelt folgalna el nagyítás nélkül.

    var panelNumberPerRow = Math.max(parseInt(bodyWidth * sizePercentage / panelRealWidth), 1); // A vízszintesen elférő panelek száma.
    if (panelsPerRow > 0) {
        panelNumberPerRow = panelsPerRow;
    } else {
        if (sizePercentage > 0) {
            global.panelNumberOnScreen = panelNumberPerRow / sizePercentage;
        }
    }
    
    // Az 1 -> 2 illetve 2 -> 1 ázméretezás helyes kezeléséhez
    const immediate = (global.oldPanelNumberOnScreen === 1 && panelNumberPerRow === 2);
    d3.selectAll(".reportHeadPanel .halfHead").classed("vertical", (panelNumberPerRow === 1));
    d3.selectAll(".HeadPanel_Browser .greetingBadge").classed("vertical", (panelNumberPerRow === 1));
    
    scaleRatio = (scaleRatio === undefined) ? that.getScaleRatio(side, sizePercentage, panelNumberPerRow) : scaleRatio;
    
    if (isViewSwitch) {
        // Azért kell így animálni, mert ha scrollbar is van, akkor a d3 hibásan számolja ki a "from" értéket. (Scrollbar nélkül veszi, míg a "to"-t scrollbarrral.)
        d3.select("#scrollPaneP" + side).style("overflow-y", "hidden");
        var startSize = d3.select("#scrollPaneP" + side).style("width");
        d3.select("#scrollPaneP" + side).style("overflow-y", null);
        d3.select("#scrollPaneP" + side).transition().duration(duration)
                .styleTween("width", function() {
                    return d3.interpolate(startSize, (bodyWidth * sizePercentage) + "px");
                });
    } else {
        d3.select("#scrollPaneP" + side)
                .style("width", parseInt(bodyWidth * sizePercentage) + "px");
    }

    // A headpanel mostani, és a számára elérendő magasság meghatározása.	
    d3.select("#scrollPaneP" + side + " .HeadPanel_Browser .tableScrollPane")
            .style("max-height", Math.max(100, parseInt(((bodyHeight - global.mainToolbarHeight) / scaleRatio) - this.tableBaseOffset)) + "px");

    d3.select("body").style("width", null);

    // A panelek (főleg a fejlécpanel) számára kiadandó resize üzenet.
    if (global.mediators[side]) {
        global.mediators[side].publish("resize", duration, panelNumberPerRow, scaleRatio, immediate);
    }

    // Animálva átméretezi a tartó konténert.
    d3.select("#container" + side).transition().duration(duration)
            .style("width", parseInt((bodyWidth * sizePercentage / scaleRatio) + 20) + "px")
            .styles(global.getStyleForScale(scaleRatio, 0, 0))
            .on("end", function() {                
                var cutterHeight = (1 + parseInt(d3.select("#container" + side).style("height"))) * scaleRatio;
                if ((cutterHeight < window.visualViewport.height - global.mainToolbarHeight) || global.isEmbedded) {
                    d3.select("#cutter" + side).style("height", "100%");
                } else {
                    d3.select("#cutter" + side).style("height", cutterHeight + "px");                    
                }
            });
    
    // A draglayer megfelelő méretezéséhez beállítjuk globálisra.
    if (scaleRatio > 0) {
        global.scaleRatio = scaleRatio;
    }    
};

/**
 * Meghatározza egy oldal megjelenítéséhez szükséges nagyítási arányt.
 * Figyel a létrejövő scrollbarokra is.
 * 
 * @param {type} side Oldal (0 vagy 1)
 * @param {type} sizePercentage A képernyő hányadrészét töltse ki? 0, 0.5 vagy 1.
 * @param {type} panelsPerRow Egy sorba kiférő panelek száma.
 * @param {type} panelNumber Megjelenítendő panelek száma. (A fejlécpanelt nem számolva.) Ha nincs megadva, kiszedi a DOM-ból.
 * @returns {Number} A nagyítási arány.
 */
Container.prototype.getScaleRatio = function(side, sizePercentage, panelsPerRow, panelNumber) {
    var bodyWidth = parseInt(d3.select("#topdiv").style("width"));
    var bodyHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    var panelMargin = parseInt($(".panel").css("margin-top")) + parseInt($(".panel").css("border-top-width"));
    var panelRealWidth = global.panelWidth + 2 * panelMargin; // Egy panel ténylegesen ennyi pixelt folgalna el nagyítás nélkül.
    var panelRealHeight = global.panelHeight + 2 * panelMargin; // Egy panel ténylegesen ennyi pixelt folgalna el nagyítás nélkül.

    panelNumber = panelNumber || d3.selectAll("#container" + side + " .panel:not(.dying)").nodes().length - 1; // A pillanatnyilag meglévő normál panelek száma. A magasság megállapításához kell.
    var isMagnified = !d3.selectAll("#container" + side + " .panel.single.magnified:not(.dying)").empty(); // Van nagyított panel?
    if (isMagnified) { // Ha van nagyított, az 4-nek számít.
        panelNumber = panelNumber + 3;
        panelNumber = Math.max(panelNumber, global.panelNumberOnScreen * 2); // Ha van nagyított, akkor legalább 2 sort el kell foglalni.
    }
    var unscaledPageWidth = panelsPerRow * panelRealWidth;    
    var unscaledPageHeight = parseFloat(d3.select("#headPanelP" + side).style("height")) + 3 * panelMargin + panelRealHeight * parseInt(panelNumber / panelsPerRow + 0.99);

    var availableWidth = bodyWidth * sizePercentage;
    var availabelHeight = bodyHeight - ((global.isEmbedded) ? 0 : global.mainToolbarHeight);

    var widthMultiplier = availableWidth / unscaledPageWidth;
    var widthMultiplierWithScrollbar = (availableWidth - global.scrollbarWidth) / unscaledPageWidth;
    
    var heightMultiplier = availabelHeight / unscaledPageHeight;
    
    var scaleRatio = (widthMultiplier < heightMultiplier) ? widthMultiplier : (widthMultiplierWithScrollbar > heightMultiplier) ? widthMultiplierWithScrollbar : heightMultiplier;    
    return scaleRatio;
};

/**
 * Új report kiválasztása.
 * 
 * @param {Integer} side Erre az oldalra.
 * @param {Object} reportSuperMeta A report superMetája.
 * @param {Object} startObject a kezdetben megnyitandó report.
 * @returns {undefined}
 */
Container.prototype.newReport = function(side, reportSuperMeta, startObject) {
    const that = this;
    global.mediators[side].remove("killListeners");
    that.isSideInUse[side] = true;
    that.updateHelp(side, reportSuperMeta);
    
    const promises = [
        that.loadAllMapsAsync(reportSuperMeta),
        that.loadAllDictsAsync(side, reportSuperMeta)
    ];
    
    Promise.all(promises).then(function(result) {
        global.facts[side] = new Fact(reportSuperMeta, side, that.newReportReady, that, startObject);
        that.newReportReady(side, reportSuperMeta);
    });
};

/**
 * Load the maps required for the report, async.
 * 
 * @param {Object} reportSuperMeta Meta of the report.
 * @returns {Promise} Promise that resolves after the maps loaded.
 */
Container.prototype.loadAllMapsAsync = async function(reportSuperMeta){
    const mapNames = [];
    for (var i = 0, iMax = reportSuperMeta.dimensions.length; i < iMax; i++) {
        const mapCode = reportSuperMeta.dimensions[i].type;
        if (mapCode && mapCode.length > 0) {
            mapNames.push(reportSuperMeta.dimensions[i].type);
        }
    }
    return global.mapStore.loadAllAsync(mapNames);
};

Container.prototype.loadAllDictsAsync = async function(side, reportSuperMeta) {
    return global.dictionaries[side].loadAllAsync(reportSuperMeta.dictionaries);
};

/**
 * Beállítja a reportra vonatkozó help-et.
 * 
 * @param {Integer} side Erre az oldalra vonatkozó helpről van szó.
 * @param {Object} reportSuperMeta A report supermetája. (üres: törlés)
 * @returns {undefined}
 */
Container.prototype.updateHelp = function(side, reportSuperMeta) {
    var localHelps = d3.selectAll(".localized.helpContent").nodes();
    for (var i = 0, iMax = localHelps.length; i < iMax; i++) {
        var localHelp = d3.select(localHelps[i]);
        var lang = localHelp.attr("lang");        
        var localMeta = (reportSuperMeta !== undefined) ? global.getFromArrayByLang(reportSuperMeta.helps, lang) : undefined;
        var header = (localMeta !== undefined) ? "<h3>" + global.getFromArrayByLang(reportSuperMeta.labels, lang).description + "</h3>" : "";
        var updateTime = (localMeta !== undefined) ? "<em>frissítve: " + reportSuperMeta.updated + "</em><br>" : "";
        var content = "<div class='helpInnerHTML'>" + ((localMeta !== undefined) ?
                ((localMeta.message && localMeta.message.length > 4) ? localMeta.message : "Nincs elérhető információ.") : "") + "</div>";
        var html = header + updateTime + content;

        if (this.isSideInUse[0] && this.isSideInUse[1]) {   // Ha mindkét oldalon van report
            localHelp.selectAll(".helpStart .hideWhenOnlyOne")
                    .style("display", "block");
            localHelp.selectAll(".helpStart .noReport")
                    .style("display", "none");
        } else if (this.isSideInUse[0] || this.isSideInUse[1]) {    // Ha csak az egyik oldalon van report
            localHelp.selectAll(".helpStart .hideWhenOnlyOne")
                    .style("display", "none");
            localHelp.selectAll(".helpStart .noReport")
                    .style("display", "none");
        } else {    // Ha egyiken sincs report
            localHelp.selectAll(".helpStart .noReport")
                    .style("display", "block");
            localHelp.selectAll(".helpStart .hideWhenOnlyOne")
                    .style("display", "none");
        }
        localHelp.select(".helpReport" + side).html(html);
    }
};

/**
 * Előre beállított helyről indítja az előre beállított reportot.
 * 
 * @param {Object} startObject Az indulási helyet leíró objektum.
 * @returns {undefined}
 */
Container.prototype.navigateTo = function(startObject) {
    var that = this;
    that.resizeInProgress = true;
    that.panelState = startObject.d;
    global.panelNumberOnScreen = startObject.n;
    global.isEmbedded = startObject.e;
    if (global.isEmbedded) {
        
        d3.select("body").attr("class", "embedded");                  
        setTimeout(function () {
            global.setLanguage(startObject.l);
        }, 50);

    }
    for (var side = 0; side < 2; side++) {
        var sideInit = startObject.p[side];
        var sizePercentage = 0;
        if ((that.panelState === 0 && side === 0) || (that.panelState === 2 && side === 1)) {
            sizePercentage = 1;
        } else if (that.panelState === 1) {
            sizePercentage = 0.5;
        }
        if (sideInit.v) { // Visualizatzions
            var reportMeta = global.getFromArrayByProperty(global.superMeta, 'name', sideInit.c); // A reporthoz tartozó meta.
            if(reportMeta === undefined) {
                throw new Error("No access to the selected report.");
            }
            sideInit.v = global.minifyInits(sideInit.v, true).split(';'); // A panelek indító konstruktorai.
            for (var i = 0, iMax = sideInit.v.length; i < iMax; i++) {
                sideInit.v[i] = {'initString' : sideInit.v[i]};
            }
            that.newReport(side, reportMeta, sideInit);
            var scaleRatio = Container.prototype.getScaleRatio(side, sizePercentage, global.panelNumberOnScreen, sideInit.v.length);            
            that.resizeContainer(side, 1000, sizePercentage, global.panelNumberOnScreen, scaleRatio); 
            //global.mediators[side].publish("drill", {dim: -1, direction: 0});
        } else {
            that.counter--;
            var scaleRatio = Container.prototype.getScaleRatio(side, sizePercentage, global.panelNumberOnScreen, 0);
            that.resizeContainer(side, 0, sizePercentage, global.panelNumberOnScreen, scaleRatio);
        }
                       
    }

    d3.select("#container0").classed("activeSide", (this.panelState !== 2));
    d3.select("#container1").classed("activeSide", (this.panelState !== 0));
    global.mainToolbar_refreshState();
    this.onResize();
};

/**
 * Az új report adatbázisból való betöltése után létrehozza a report elemzőfelületét.
 * Létrehozza a metában kért paneleket is.
 * 
 * @param {Integer} side Erre az oldalra.
 * @param {Object} reportMeta Az új report metája.
 * @returns {undefined}
 */
Container.prototype.newReportReady = function(side, reportMeta) {
    var that = this;

    // Blokkoljuk a resize metódust 50 milisec-re
    that.resizeInProgress = true;

    global.mediators[side].publish("killPanel", "#panel" + side + "P-1");	// Esetleges régi fejlécpanel megölése.
    var sizePercentage = 0;
    if ((this.panelState === 0 && side === 0) || (this.panelState === 2 && side === 1)) {
        sizePercentage = 1;
    } else if (this.panelState === 1) {
        sizePercentage = 0.5;
    }
    const scaleRatio = Container.prototype.getScaleRatio(side, sizePercentage, global.panelNumberOnScreen, reportMeta.visualizations.length);

    new HeadPanel_Report({group: side}, reportMeta, scaleRatio);			// Fejlécpanel létrehozása.

    // Megjelenítés a meta alapján
    for (var i = 0, iMax = reportMeta.visualizations.length; i < iMax; i++) {
        // De előbb a megfelelő oldalra kell hozni...
        var initString = reportMeta.visualizations[i].initString.toLowerCase();
        if (initString.indexOf("})") > -1) {
            initString = initString.replace("})", ", group: " + side + "})");
            initString = initString.replace("({, ", "({");
        } else if (initString.indexOf("()") > -1) {
            initString = initString.replace("()", "({group: " + side + "})");
        } else {
            initString = "";
        }
        eval("new " + initString);
    }


    

    // Ha egy card klikkelés miatt kell megnyitni, akkor belebújási animáció
    const clickedCardNode = d3.select(".card.clicked").node();
    if (clickedCardNode !== null) {
        const offset = clickedCardNode.getClientRects()[0];
        const fakeEvent = {
            clientX: scaleRatio * (offset.x + offset.width/2),
            clientY: scaleRatio * (offset.y + offset.height/2)
        };
        const transition = d3.transition().duration(global.selfDuration);
        global.zoom(fakeEvent, d3.select("#scrollPaneP" + side).node(), transition, (1/15) / scaleRatio);
    }
    

    this.resizeContainer(side, 0, sizePercentage, global.panelNumberOnScreen, scaleRatio);

    that.counter--;        
    if (that.counter <= 0) {
        global.mainToolbar_refreshState();                                      // A toolbar kiszürkültségi állapotának felfrissítése.
        global.setLanguage(String.locale);                                      // Nyelvi beállítások érvényesítése az új paneleken is.
        $(window).trigger('resize');
    }    
};

/**
 * Az egyik, pillanatnyilag nem létező oldalt inicializálja: feliratkozik a mediátorokra,
 * regisztrálja az adatrendezőt, elindítja a report-böngészőt.
 * 
 * @param {Integer} side Az inicializálandó oldal.
 * @param {Number} duration A fejlécpanel letörlésének időtartama. Ha undefined, azonnali.
 * @returns {undefined}
 */
Container.prototype.initSide = function(side, duration) {
    var that = this;

    if (global.mediators === undefined || global.mediators[side] === undefined) {
        global.mediators[side] = new Mediator();
    }

    global.mediators[side].subscribe("newreport", function(side, reportId) {
        that.newReport(side, reportId);
    });
    global.mediators[side].subscribe("changepanels", function(side) {
        that.switchPanels(side);
    });
    global.mediators[side].subscribe("killside", function(side) {
        that.killSide(side);
    });
    global.mediators[side].subscribe("magnify", function(direction) {
        that.magnify(direction);
    });
    global.mediators[side].subscribe("addPanel", function(panelType) {
        that.addPanel(side, panelType);
    });
    global.mediators[side].subscribe("save", function() {
        that.save(side);
    });
    global.mediators[side].subscribe("cssSwitch", function() {
        that.cssChange(side);
    });
    
    that.isSideInUse[side] = false;
    that.updateHelp(side);
    new Draglayer(side, global.mediators[side]);

    var scaleRatio = Container.prototype.getScaleRatio(side, 1, global.panelNumberOnScreen, 0);
    if (duration) {
        d3.select('#headPanelP' + side).transition().duration(duration)
                .style("opacity", 0)
                .on("end", function() {
                    d3.select(this).style("opacity", null);
                    new CardPanel({group: side}, global.superMeta, scaleRatio, 0); // Fejléc.
                    global.setLanguage(undefined, side);
                    that.onResize();
                    global.mainToolbar_refreshState();
                });
    } else {
        new CardPanel({group: side}, global.superMeta, scaleRatio); // Fejléc.        
        that.onResize();
        global.mainToolbar_refreshState();
    }
    this.dataDirector[side] = new DataDirector(side, global.mediators[side]);	// Adatrendező.        
};

/**
 * Megöli, és alaphelyzetbe hozza az egyik böngészőoldalt.
 * 
 * @param {Integer} side A kérdéses oldal.
 * @returns {undefined}
 */
Container.prototype.killSide = function(side) {
    if (this.isSideInUse[side] && (this.panelState / 2 === side || this.panelState === 1 || this.panelState === 3)) {
        
        
            global.mediators[side].publish("killListeners");
            global.mediators[side].publish("killPanel", undefined);

            global.mediators[side].remove("changeValue");
            global.mediators[side].remove("changeDimension");
            global.mediators[side].remove("changepanels");
            global.mediators[side].remove("drill");
            global.mediators[side].remove("controlChange");
            global.mediators[side].remove("killside");
            global.mediators[side].remove("newreport");
            global.mediators[side].remove("killListeners");
            global.mediators[side].remove("killPanel");
            global.mediators[side].remove("magnifyPanel");
            global.mediators[side].remove("resize");
            global.mediators[side].remove("magnify");
            global.mediators[side].remove("register");
            global.mediators[side].remove("addDrag");
            global.mediators[side].remove("addPanel");
            global.mediators[side].remove("getConfig");
            global.mediators[side].remove("save");
            global.mediators[side].remove("langSwitch");
            global.mediators[side].remove("cssSwitch");

            global.baseLevels[side] = [];

            global.facts[side] = null;
            this.dataDirector[side] = undefined;

            const that = this;
            global.get(global.url.superMeta, "", function (result, status) {
                global.superMeta = result.reports;
                that.initSide(side, global.selfDuration);
                global.mainToolbar_refreshState();
                global.getConfig2();
            });            
    }
};

/**
 * Új panel hozzáadása a felülethez.
 * 
 * @param {int} side A hozzáadást kérő oldal.
 * @param {String} panelType A hozzáadandó panel névkódja.
 * @returns {undefined}
 */
Container.prototype.addPanel = function(side, panelType) {
    if (this.panelState / 2 === side && this.isSideInUse[side]) {
        const firstFreeId = this.dataDirector[side].getFirstFreeIndex();
        const guessedDim = this.dataDirector[side].guessDimension();
        const guessedDim2 = this.dataDirector[side].guessDimension([guessedDim]);
        const guessedDim3 = this.dataDirector[side].guessDimension([guessedDim, guessedDim2]);

        const guessedVal = this.dataDirector[side].guessValue();
        const guessedVal2 = this.dataDirector[side].guessValue([guessedVal]);
        const guessedVal3 = this.dataDirector[side].guessValue([guessedVal, guessedVal2]);
        if (firstFreeId >= 0) {
            switch (panelType) {
                case 'piechartpanel':
                    new panel_pie({group: side, position: firstFreeId, dim: guessedDim, val: guessedVal});
                    break;
                case 'mappanel':
                    new panel_map({group: side, position: firstFreeId, dim: guessedDim, val: guessedVal, poi: false});
                    break;
                case 'poimappanel':
                    new panel_map({group: side, position: firstFreeId, dim: guessedDim, val: guessedVal, poi: true});
                    break;
                case 'barpanel':
                    new panel_barline({group: side, position: firstFreeId, dim: guessedDim, valbars: [guessedVal]});
                    break;
                case 'strechedbarpanel':
                    new panel_barline({group: side, position: firstFreeId, streched: true, valbars: [guessedVal], dim: guessedDim});
                    break;
                case 'linepanel':
                    new panel_barline({group: side, position: firstFreeId, valbars: [], vallines: [guessedVal], dim: guessedDim});
                    break;
                case 'markedlinepanel':
                    new panel_barline({group: side, position: firstFreeId, valbars: [], vallines: [guessedVal], symbols: true, dim: guessedDim});
                    break;
                case 'bar2panel':
                    new panel_bar2d({group: side, position: firstFreeId, dimx: guessedDim, dimy: guessedDim2, val: guessedVal});
                    break;
                case 'strechedbar2panel':
                    new panel_bar2d({group: side, position: firstFreeId, dimx: guessedDim, dimy: guessedDim2, val: guessedVal, streched: true});
                    break;
                case 'horizontalbarpanel':
                    new panel_horizontalbar({group: side, position: firstFreeId, centered: false, dim: guessedDim, valpos: [guessedVal]});
                    break;
                case 'fixedhorizontalbarpanel':
                    new panel_horizontalbar({group: side, position: firstFreeId, centered: true, dim: guessedDim, valpos: [guessedVal]});
                    break;
                case 'Panel_Table1D':
                    new panel_table1d({group: side, position: firstFreeId, dim: guessedDim});
                    break;
                case 'Panel_Table2D':
                    new panel_table2d({group: side, position: firstFreeId, dimr: guessedDim, dimc: guessedDim2, val: guessedVal});
                    break;
                case 'top10Barpanel' :
                    new panel_barline({group: side, position: firstFreeId, dim: guessedDim, valbars: [guessedVal], top10: true});
                    break;
                case 'top10Linepanel' :
                    new panel_barline({group: side, position: firstFreeId, valbars: [], vallines: [guessedVal], dim: guessedDim, symbols: true, top10: true});
                    break;
                case 'line2panel':
                    new panel_line2d({group: side, position: firstFreeId, dimx: guessedDim, dimy: guessedDim2, val: guessedVal, symbols: false});
                    break;                    
                case 'markedline2panel':
                    new panel_line2d({group: side, position: firstFreeId, dimx: guessedDim, dimy: guessedDim2, val: guessedVal, symbols: true});
                    break;
                case 'sankey2panel':
                    new panel_sankey({group: side, position: firstFreeId, dim: [guessedDim, guessedDim2], val: guessedVal});
                    break;
                case 'sankey3panel':
                    new panel_sankey({group: side, position: firstFreeId, dim: [guessedDim, guessedDim2, guessedDim3], val: guessedVal});
                    break;
                case 'bubblepanel':
                    new panel_bubble({group: side, position: firstFreeId, dim: guessedDim, val: [guessedVal, guessedVal2, guessedVal3]});
                    break;
                case 'scatterpanel':
                    new panel_bubble({group: side, position: firstFreeId, dim: guessedDim, val: [guessedVal, guessedVal2]});
                    break;

            }
        }
        global.mainToolbar_refreshState();
        global.mediators[side].publish("drill", {dim: -1, direction: 0});
        this.onResize();
    }
};

Container.prototype.cssChange = function(side) {
    var that = this;
    if (this.isSideInUse[side]) {
        global.resetValColorsFromReportMeta(global.facts[side].localMeta, side);
    }    
};


/**
 * Adatok csv-be való mentését intézi. Feldob egy párbeszédablakot,
 * amelyben ki lehet választani az alábontandó dimenziókat.
 * 
 * @param {Integer} side A kérést leadó oldal.
 * @returns {undefined}
 */
Container.prototype.save = function(side) {
    var that = this;
    if (this.panelState / 2 === side && this.isSideInUse[side]) {
        var str = "";
        for (var d = 0, dMax = global.facts[side].localMeta.dimensions.length; d < dMax; d++) {
            str = str + "<input class = 'saveCheckBox' type='checkbox'/>" + global.facts[side].localMeta.dimensions[d].caption + "<br>";
        }

        global.setDialog(
                _("Adatok mentése CSV-ként"),
                "<div class='saveStaticText loc'>" + _("Az alábbi dimenziókat alábontva (maximum 3 választható):") + "</div>" +
                "<div class='saveVariableText'>" + str + "</div>",
                _("Mégse"),
                function() {
                    global.setDialog();
                },
                _("Mentés"),
                function() {
                    var requestedDims = [];
                    var checkBoxes = document.getElementsByClassName("saveCheckBox");
                    for (var c = 0, cMax = checkBoxes.length; c < cMax; c++) {
                        requestedDims.push((checkBoxes[c].checked) ? 1 : 0);
                    }
                    that.saveAsCsv(side, requestedDims);
                }
        );
    }
};

/**
 * Kimenti az adatokat csv-be.
 * 
 * @param {Integer} side A kérést leadó oldal.
 * @param {Array} requestedDims Az alábontandó dimenziókat 1-el jelölő tömb.
 * @returns {undefined}
 */
Container.prototype.saveAsCsv = function(side, requestedDims) {
    
    // Ha túl sokat választott, csak az első 3-at vesszük figyelembe
    var numberOfRequestedDims = 0;
    for (var i = 0, iMax = requestedDims.length; i < iMax; i++) {
        if (requestedDims[i] === 1) {
            numberOfRequestedDims++;
            if (numberOfRequestedDims > 3) {
                requestedDims[i] = 0;
            }
        }
    }
    
    var meta = global.facts[side].localMeta;
    var baseLevels = global.baseLevels[side];

    // A csv fejléce: Report neve, dimenziók lefúrási szintje.
    var headerString = "\"" + meta.caption + "\"\n\n";
    headerString += "\"Lefúrási szint:\"";
    for (var i = 0, iMax = baseLevels.length; i < iMax; i++) {
        var baseDim = baseLevels[i];
        headerString += ",\"" + meta.dimensions[i].caption + ":\",\"" + ((baseDim.length === 0) ? meta.dimensions[i].top_level_caption : baseDim[baseDim.length - 1].name) + "\"\n";
    }

    // Assemble the base vector
    var baseVector = [];
    for (var d = 0, dMax = (global.baseLevels[side]).length; d < dMax; d++) {
        var baseVectorCoordinate = {};
        baseVectorCoordinate.name = global.facts[side].reportMeta.dimensions[d].name;
        baseVectorCoordinate.levelValues = [];
        for (var l = 0, lMax = (global.baseLevels[side])[d].length; l < lMax; l++) {
            baseVectorCoordinate.levelValues.push(((global.baseLevels[side])[d])[l].id); 
        }
        baseVector.push(baseVectorCoordinate);
    }
    
    // Assemble the drill vector
    var queries = [];
    var query = [];    
    for (var dts = 0, dtsMax = global.facts[side].reportMeta.dimensions.length; dts < dtsMax; dts++) {
        if (requestedDims[dts] === 1) {
            query.push(global.facts[side].reportMeta.dimensions[dts].name);
        }
    }
    queries.push({"dimsToDrill" : query});

    var requestObject = {
        "reportName" : global.facts[side].reportMeta.name,
        "baseVector": baseVector,
        "drillVectors": queries
    };
    
    const encodedQuery = "queries=" + window.btoa(JSON.stringify(requestObject));

    // Adatok letöltése, és a belőlük származó csv-törzs összerakása.
    global.get(global.url.fact, encodedQuery, function(resultJson) {
        var result = resultJson;

        // Dimenziók fejlécének hozzáadása.
        var resultString = "";
        var separator = "";
        for (var i = 0, iMax = baseLevels.length; i < iMax; i++) {
            if (requestedDims[i] === 1) {
                resultString += separator + "\"" + meta.dimensions[i].caption + "\"";
                separator = ",";
            }
        }
        // Értékek fejlécének hozzáadása.
        for (var v = 0, vMax = meta.indicators.length; v < vMax; v++) {
            var valueHeader = (meta.indicators[v].value.hide) ? "\"Nem értelmezett\"" : "\"" + (meta.indicators[v].caption + " (" + meta.indicators[v].value.unit + ")\"");
            var ratioHeader = (meta.indicators[v].fraction.hide) ? "\"Nem értelmezett\"" : "\"" + (meta.indicators[v].caption + " (" + meta.indicators[v].fraction.unit + ")\"");
            resultString += separator + valueHeader + "," + ratioHeader;
            separator = ",";
        }
        resultString = resultString + "\n";

        // Az értékekhez tartozó szorzó tömbbe kiszedése.
        var valMultipliers = [];
        for (var v = 0, vMax = meta.indicators.length; v < vMax; v++) {
            valMultipliers.push((isNaN(parseFloat(meta.indicators[v].value.multiplier))) ? 1 : parseFloat(meta.indicators[v].value.multiplier));
        }

        // Az értékekhez tartozó hányados-szorzó tömbbe kiszedése.
        var fracMultipliers = [];
        for (var v = 0, vMax = meta.indicators.length; v < vMax; v++) {
            fracMultipliers.push((isNaN(parseFloat(meta.indicators[v].fraction.multiplier))) ? 1 : parseFloat(meta.indicators[v].fraction.multiplier));
        }        

        // Az eredmény feldolgozása soronként.
        for (var r = 0, rMax = result.answer[0].response.rows.length; r < rMax; r++) {
            var row = result.answer[0].response.rows[r];
            var resultline = "";

            // Dimenziók beírása a sorba.
            var separator = "";
            for (var d = 0, dMax = row.dims.length; d < dMax; d++) {
                resultline += separator + '"' + row.dims[d].name + '"';
                separator = ",";
            }

            // Értékek beírása a sorba.
            for (var v = 0, vMax = row.vals.length; v < vMax; v++) {
                var value = (meta.indicators[v].value.hide) ? "" : valMultipliers[v] * row.vals[v].sz;
                var ratio = (meta.indicators[v].fraction.hide) ? "" : fracMultipliers[v] * row.vals[v].sz / row.vals[v].n;
                resultline += separator + value + "," + ratio;
                separator = ",";
            }

            // Sorvége.
            resultString = resultString + resultline + "\n";
        }

        resultString = headerString + "\n" + resultString;

        // A mentéshez használt fájlnév.
        var today = new Date();
        var todayString = today.toISOString().slice(0, 10) + "_" + today.toTimeString().slice(0, 8).split(":").join("-");
        var filename = "Agnos"
                + "_" + global.convertFileFriendly(global.facts[side].localMeta.caption)
                + "_" + todayString
                + ".csv";

        var blob = new Blob([resultString], {type: 'text/csv; charset=utf-8;'});
        var link = document.createElement("a");

        // Internet Explorer esetén...
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
            global.setDialog();

            // Ha a download attributum támogatott...
        } else if (link.download !== undefined) {
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            global.setDialog();

            // Ha minden kötél szakad...
        } else {
            global.setDialog(
                    "A fájl mentése sikertelen",
                    "<div class='saveStaticText'>A manuális mentéshez a szövegdoboz tartalmát COPY+PASTE-el írd ki egy .csv kiterjesztésű fájlba.</div>" +
                    "<textarea id='saveTextArea' wrap='off' cols='80' rows='5'>" + resultString + "</textarea>",
                    "Kijelölés",
                    function() {
                        document.getElementById("saveTextArea").select();
                    },
                    "Tovább",
                    function() {
                        global.setDialog();
                    }
            );
        }
    }, false);
};

/**
 * Changelog hozzáfűzése a help-hez. Nyelvfüggő.
 * 
 * @returns {undefined}
 */
Container.prototype.initChangelog = function() {

    if (changelog && changelog.length > 0) {
        for (var langId = 0, langIdMax = changelog.length; langId < langIdMax; langId++) {
            var lang = changelog[langId].language;
            var history = changelog[langId].history;
            if (history && history.length > 0) {
                history.sort(function(a, b) {
                    return a.date < b.date;
                });

                var changelogAnchorpoint = d3.select(".language_" + lang + " .helpAbout .changelog");
                if (!changelogAnchorpoint.empty()) {
                    changelogAnchorpoint.html("");
                    for (var i = 0, iMax = history.length; i < iMax; i++) {
                        var date = new Date(history[i].date.replace(/-/g, "/")).toLocaleDateString(lang);
                        var html = "<em>" + date + "</em>:<span> " +
                                "&lt;" + history[i].entity + "&gt; </span>" +
                                history[i].change;
                        changelogAnchorpoint.append("html:span")
                                .html(html);
                    }
                }
            }
        }
    }

};