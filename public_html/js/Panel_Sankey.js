/* global Panel, d3, global */

'use strict';

var sankeypanel = panel_sankey;
/**
 * A tortadiagram konstruktora.
 * 
 * @param {Object} init Inicializáló objektum.
 * @returns {panel_sankey} A megkonstruált panel.
 */
function panel_sankey(init) {
    var that = this;

    this.constructorName = "panel_sankey";

    // Inicializáló objektum beolvasása, feltöltése default értékekkel.
    this.defaultInit = {group: 0, position: undefined, dim: [3,2,2], val: 0, ratio: false, mag: 1, frommg: 1, sortbyvalue: false};
    this.actualInit = global.combineObjects(that.defaultInit, init);

    Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], true, false, global.legendOffsetX, global.legendOffsetX); // A Panel konstruktorának meghívása.

    this.valMultiplier = 1;			// A mutatott érték szorzója.
    this.fracMultiplier = 1;			// A mutatott érték szorzója.
    this.dimsToShow = that.actualInit.dim;	// A mutatott dimenziók tömbje.
    this.numberOfDims = that.dimsToShow.length; // A mutatott dimenziók száma.
    this.valToShow = that.actualInit.val;	// Az ennyiedik mutatót mutatja.
    this.valFraction = that.actualInit.ratio;   // Hányadost mutasson, vagy abszolútértéket?
    this.preparedData = [];			// Az ábrázolásra kerülő, feldolgozott adat.
    this.maxEntries = (that.numberOfDims < 3) ? global.maxEntriesIn2D : global.maxEntriesIn3D;    // A panel által maximálisan megjeleníthető adatok száma.
    this.dims = [];     // Az i. helyen megjelenítendő dimenzió sorszáma (a data-n belül).
    
    
    const modDim = global.sort_unique(that.dimsToShow);    
    for (var i = 0, iMax = this.numberOfDims; i < iMax; i++) {        
        that.dims.push(modDim.indexOf(that.dimsToShow[i]));        
    }
    
    this.nodeWidth = 80;
    this.linkOpacity = 0.3;
    
    // A sankey-elemeket létrehozó függvény
    this.sankey = d3.sankey()
            .nodeWidth(that.nodeWidth * that.actualInit.mag)
            .nodePadding(0)
            .nodeId(function (d) {        
                        return d.uniqueId;
                    })
            .nodeAlign(function(n) {
                        return n.columnIndex;
                    })
            .size([that.width, that.height]);

    // Alaprétegek. Annyi, ahány dimenziós a sankey.
    for (let i = 0, iMax = this.numberOfDims; i < iMax; i++) {
        that.svg.insert("svg:g", ".title_group")
                .attr("class", "background listener droptarget droptarget0")
                .on('mouseover', function () {
                    that.hoverOn(this, i);
                })
                .on('mouseout', function () {
                    that.hoverOff();
                })
                .on("click", function () {
                    that.drill(i);
                })
                .append("svg:rect")
                .attr("width", that.w / that.numberOfDims)
                .attr("height", that.h)
                .attr("transform", "translate(" + (i* that.w / that.numberOfDims) + ", 0)");
    }

    // A diagram rétege.
    this.gLinks = that.svg.insert("svg:g", ".title_group")
            .attr("class", "sankey_links")
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");
    this.gNodesShadow = that.svg.insert("svg:g", ".title_group")
            .attr("class", "sankey_nodes_shadow")
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");        
    this.gNodes = that.svg.insert("svg:g", ".title_group")
            .attr("class", "sankey_nodes")
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");


    // Feliratok rétege.
    this.gLabels = that.svg.insert("svg:g", ".title_group")
            .attr("class", "axisX axis noEvents")
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");


    // Feliratkozás a mediátorokra.
    var med;
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
    that.mediator.publish("register", that, that.panelId, that.dimsToShow, that.preUpdate, that.update, that.getConfig);
    
    this.drawNodeShadows();
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    panel_sankey.prototype = global.subclassOf(Panel); // A Panel metódusainak átvétele.    
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
panel_sankey.prototype.valueToShow = function (d) {
    var that = this;
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
panel_sankey.prototype.getSortingComparator = function() {
    var that = this;            
    if (that.sortByValue) {        
        return function(a, b) {            
            const aValue = a.value;
            const bValue = b.value;
            if (aValue < bValue) return 1;
            if (aValue > bValue) return -1;
            return 0;
        };
    } else {
        return function(a, b) {
            return global.realCompare(a.name, b.name);                                    
        };
    }        
};

/**
 * Egy elemhez tartozó tooltipet legyártó függvény;
 * 
 * @param {Object} d Az elem.
 * @returns {String} A megjelenítendő tooltip.
 */
panel_sankey.prototype.getTooltip = function (d) {
    var that = this;
    var unitProperty = (d.value === 1) ? "unit" : "unitPlural";
    return that.createTooltip(
            [{
                    name: "that.localMeta.dimensions[that.dimsToShow].description",
                    value: '(d.name) ? d.name : _("Nincs adat")'
                }],
            [{
                    name: 'that.localMeta.indicators[that.valToShow].description',
                    value: d.originalValue,
                    dimension: '((that.valFraction) ? that.localMeta.indicators[that.valToShow].fraction[unitProperty] : that.localMeta.indicators[that.valToShow].value[unitProperty])'
                }]
            );
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
panel_sankey.prototype.preUpdate = function (drill) {
    var that = this;

/*
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
    */
};

/**
 * Az új adat előkészítése. Meghatározza hogy mit, honnan kinyílva kell kirajzolni.
 * 
 * @param {Array} oldData Az adat megkapása előtti adatok.
 * @param {Array} newDataRows Az új adatsorokat tartalmazó tömb.
 * @param {Object} drill Az épp végrehajtandó fúrás.
 * @returns {Array} Az új megjelenési tortaadatok.
 */
panel_sankey.prototype.prepareData = function (oldData, newDataRows, drill) {
    var that = this;
    
    var inputGraph = that.grapFromDataRows(newDataRows);
    that.sankey.nodeSort(this.getSortingComparator());
               
    return that.sankey(inputGraph);
};

panel_sankey.prototype.grapFromDataRows = function (dataRows) {
    const that = this;
    var nodes = [];
    for (var j = 0, jMax = that.numberOfDims; j < jMax; j++) {
        nodes.push([]);
    }
    var links = [];
    for (var i = 0, iMax = dataRows.length; i < iMax; i++) {
        var d = dataRows[i];        
        var nodeIndexes = [];
        for (var j = 0, jMax = that.numberOfDims; j < jMax; j++) {
            const actualNode = d.dims[that.dims[j]];            
            var nodeIndex = global.positionInArrayByProperty(nodes[j], "id", actualNode.id);
            
            // Dimenzióelem hozzáadása, ha még nem volt benne
            if (nodeIndex === -1) {
                nodeIndex = nodes[j].length;
                var nodeElement = {
                    index: nodeIndex,
                    columnIndex: j,
                    id: actualNode.id,
                    uniqueId: j + "N" + actualNode.id,
                    name: actualNode.name.trim(),
                    tooltip: "<html>" + actualNode.name.trim() + "</html>"
                };
                nodes[j].push(nodeElement);
            }                        
            nodeIndexes.push(nodeIndex);
            
            // Az értékek hozzáadása a linkekhez
            if (j > 0) {
                const sourceUniqueId = nodes[j-1][nodeIndexes[j - 1]].uniqueId;
                const targetUniqueId = nodes[j][nodeIndexes[j]].uniqueId;
                var linkIndex = global.positionInArrayByProperties(links, ["source", "target"], [sourceUniqueId, targetUniqueId]);
                
                if (linkIndex === -1) {
                    const linkElement = {
                        'source': sourceUniqueId,
                        'target': targetUniqueId,
                        'value': that.valueToShow(d).value};
                    links.push(linkElement);
                } else {
                    links[linkIndex].value = links[linkIndex].value + that.valueToShow(d).value;
                }                
            }            
                        
        }
    }
    
    var unitedNodes = [];
    for (var j = 0, jMax = that.numberOfDims; j < jMax; j++) {
        unitedNodes = unitedNodes.concat(nodes[j]);
    }
    return {nodes: unitedNodes, links: links};
};


/**
 * Új adat megérkeztekor levezényli a panel frissítését.
 * 
 * @param {Object} data Az új adat.
 * @param {Object} drill Az épp végrehajzásra kerülő fúrás.
 * @returns {undefined}
 */
panel_sankey.prototype.update = function (data, drill) {
    var that = this;
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
    var tweenDuration = (drill.duration === undefined) ? global.getAnimDuration(-1, that.panelId) : drill.duration;

    // Ha túl sok értéket kéne megjeleníteni, pánik
    if (that.data.rows.length > that.maxEntries) {
        that.panic(true, _("<html>A panel nem képes ") + that.data.rows.length + _(" értéket megjeleníteni.<br />A maximálisan megjeleníthető értékek száma ") + that.maxEntries + _(".</html>"));
        that.preparedData = undefined;
    } else {
        that.preparedData = that.prepareData(that.preparedData, that.data.rows, drill);
        if (that.preparedData.nodes.length > 0) {
            that.panic(false);
            var trans = d3.transition().duration(tweenDuration);
            that.drawSankey(that.preparedData, trans);
            that.drawLabels(that.preparedData, trans);
        } else {
            that.panic(true, _("<html>A változó értéke<br />minden dimenzióban 0.</html>"));
            that.preparedData = undefined;
        }
    }
    var titleMeta = that.localMeta.indicators[that.valToShow];
    that.titleBox.update(that.valToShow, titleMeta.caption, titleMeta.value.unitPlural, titleMeta.fraction.unitPlural, that.valFraction, tweenDuration);
};


/**
 * Kirajzolja az oszlopok helyét háttérszínnel, hogy eltakarja a
 * linkekből odakeveredő szemeteket. Csak 1x kell lefuttatni, nem bántjuk.
 * 
 * @returns {undefined}
 */
panel_sankey.prototype.drawNodeShadows = function () {
    var that = this;
    const nodes = [];
    const links = [];
    for (var j = 0, jMax = that.numberOfDims; j < jMax; j++) {
        nodes.push({"uniqueId": j, "columnIndex": j});
        
        if (j > 0) {
            links.push({"source": (j-1), "target": j, "value": 1});
        }
        
    }
    
    const shadowGraph = that.sankey({"nodes": nodes, "links": links});
                
    var gNodesShadow = this.gNodesShadow.selectAll("rect")
            .data(shadowGraph.nodes, function (d) {
                return d.uniqueId;
            });
            
    gNodesShadow.exit()            
            .remove();        
            
    gNodesShadow = gNodesShadow.enter().append("svg:rect")
            .attr("class", "noEvents")
            .merge(gNodesShadow);
    
    gNodesShadow
            .attr("x", d => d.x0)
            .attr("width", d => (d.x1 - d.x0))
            .attr("y", d => d.y0)
            .attr("height", d => (d.y1 - d.y0));
    
};

/**
 * A körcikkek kirajzolása, animálása.
 * 
 * @param {Array} graph A kirajzolandó körcikkekekt tartalmazó adattömb.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_sankey.prototype.drawSankey = function (graph, trans) {
    var that = this;
    
    var gNodes = that.gNodes.selectAll(".node")
            .data(graph.nodes, function (d) {
                return d.uniqueId;
            });
    
    gNodes.exit()
            .on("click", null)
            .remove();
    
    gNodes = gNodes.enter().append("svg:rect")
            .attr("class", "node bar bordered darkenable listener")
            .attr("x", d => d.x0)
            .attr("width", d => (d.x1 - d.x0))
            .attr("y", d => d.y0)
            .attr("height", d => (d.y1 - d.y0))
            .merge(gNodes)
            .attr("fill", d => global.color(d.id))
            .on("click", function(d) {
                that.drill(d.columnIndex, d);
            });
    
    gNodes.transition(trans)
            .attr("x", function (d) {
                return d.x0;
            })
            .attr("width", function (d) {
                return (d.x1 - d.x0);
            })
            .attr("y", function (d) {
                return d.y0;
            })
            .attr("height", function (d) {
                return (d.y1 - d.y0);
            });



    var gLinks = that.gLinks.selectAll(".link")
            .data(graph.links, function (d) {
                return d.source.uniqueId + "-" + d.target.uniqueId;
            });
    
    gLinks.exit()
            .on("click", null)
            .remove();
    
    gLinks = gLinks.enter().append("svg:path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("opacity", 0)
            //.attr("stroke", "white")
            .attr("stroke-width", function(d) { return d.width; })
            //.attr("fill", "none")
            .merge(gLinks);

    gLinks.transition(trans)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", function(d) { return d.width; })
            .attr("opacity", that.linkOpacity);
    

};

/**
 * A vonások és feliratok kirajzolása, animálása.
 * 
 * @param {Array} graph A körcikkek adatait tartalmazó adattömb.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_sankey.prototype.drawLabels = function (graph, trans) {    
    var that = this;
    
    const fontSize = 16;

    var gLabels = that.gLabels.selectAll("text")
            .data(graph.nodes, function (d) {
                return d.uniqueId;
            });
    
    gLabels.exit()
            .transition(trans).attr("opacity", 0)
            .remove();
    
    gLabels = gLabels.enter().append("svg:text")            
            .attr("class", "node legend noEvents")
            .attr("opacity", 0)
            .attr("x", function (d) {
                return (d.x0 + d.x1) / 2;
            })
            .attr("y", function (d) {
                return (d.y0 + d.y1) / 2;
            })
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .merge(gLabels)
            .text(function(d) {
                return d.name;
            })
            .attr("fill", function (d) {
                return global.readableColor(global.color(d.id));
            });
    
    gLabels.transition(trans)
            .attr("x", function (d) {
                return (d.x0 + d.x1) / 2;
            })
            .attr("y", function (d) {
                return (d.y0 + d.y1) / 2;
            })
            .attr("opacity", function(d) {                
                return ((d.y1-d.y0) < global.fontSizeSmall * 0.9 ) ? 0 : 1;                
            });

    // A szövegek összenyomása, hogy elférjenek.    
    global.cleverCompress(gLabels, that.sankey.nodeWidth(), 0.9, undefined, false, false, 80);
    
   

};

//////////////////////////////////////////////////
// // Irányítást végző függvények
//////////////////////////////////////////////////

/**
 * Az aktuális dimenzióban történő le vagy felfúrást kezdeményező függvény.
 * 
 * @param {Integer} dimIndex A lefúrás dimenziójának sorszáma a panel által
 * megjelenített dimenziókon belül (0, 1, ...).
 * @param {Object} d Lefúrás esetén a lefúrás céleleme. Ha undefined, akkor felfúrásról van szó.
 * @returns {undefined}
 */
panel_sankey.prototype.drill = function (dimIndex, d) {    
    global.tooltip.kill();    
    var drill = {
        dim: this.dimsToShow[dimIndex],
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
 * @param {Integer} value Az érték, amire váltani kell. Ha -1 akkor a következőre vált, ha undefined, nem vált.
 * @param {boolean} ratio Hányadost mutasson-e. Ha -1 akkor a másikra ugrik, ha undefined, nem vált.
 * @returns {undefined}
 */
panel_sankey.prototype.doChangeValue = function (panelId, value, ratio) {
    var that = this;
    if (panelId === undefined || panelId === that.panelId) {
        if (value !== undefined) {
            that.valToShow = (value === -1) ? (that.valToShow + 1) % that.localMeta.indicators.length : value;
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
 * A dimenzióváltást végrehajtó függvény.
 * 
 * @param {String} panelId A dimenzióváltást kapó panel ID-ja.
 * @param {Integer} newDimId A helyére bejövő dimenzió ID-ja.
 * @param {Integer} dimToChangeIndex A megváltoztatandó dimenzió  sorszáma a panel által
 * megjelenített dimenziókon belül (0, 1, ...).
 * @returns {undefined}
 */
panel_sankey.prototype.doChangeDimension = function (panelId, newDimId, dimToChangeIndex) {
    var that = this;
    if (panelId === that.panelId) {                        
        that.dimsToShow[dimToChangeIndex] = newDimId;        
        this.dims = [];
        const modDim = global.sort_unique(that.dimsToShow);    
        for (var i = 0, iMax = this.numberOfDims; i < iMax; i++) {        
           that.dims.push(modDim.indexOf(that.dimsToShow[i]));        
        }
        that.actualInit.dim = that.dimsToShow;
        that.mediator.publish("register", that, that.panelId, that.dimsToShow, that.preUpdate, that.update, that.getConfig);
        global.tooltip.kill();
        this.mediator.publish("drill", {dim: -1, direction: 0, toId: undefined});
    }
};