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
    this.rzscale = 1.5;


    
    if (this.actualInit.dim.length <= 3) {
        Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], true, false, global.legendOffsetX, global.legendOffsetX); // A Panel konstruktorának meghívása.
    } else {        
        Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], true, false, 4, 4); // A Panel konstruktorának meghívása.
        this.nodeWidthInPixels = 60;
        this.rzscale = 3;
    }

    
    this.nodeWidth = this.nodeWidthInPixels * this.rzscale;
    this.rzdescale = "scale(" + (1 / this.rzscale) + " , 1)";
    
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
        
    // A sankey-elemeket létrehozó függvény
    this.sankey = d3.sankey()
            .iterations(0)
            .nodeWidth(that.nodeWidth * that.actualInit.mag)
            .nodePadding(0)
            .nodeId(function (d) {        
                        return d.uniqueId;
                    })
            .nodeAlign(function(n) {
                        return n.columnIndex;
                    })
            .size([that.width*this.rzscale, that.height]);

    // Az oszlopok árnyékához létrehozandó kamu-gráf
    const nodes = [];
    const links = [];
    for (var j = 0, jMax = that.numberOfDims; j < jMax; j++) {
        nodes.push({"uniqueId": j, "columnIndex": j});        
        if (j > 0) {
            links.push({"source": (j-1), "target": j, "value": 1});
        }
        
    }    
    this.shadowGraph = that.sankey({"nodes": nodes, "links": links});
    
    // Alaprétegek. Annyi, ahány dimenziós a sankey.
    for (let i = 0, iMax = this.numberOfDims; i < iMax; i++) {
        that.svg.insert("svg:g", ".panelControlButton")
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
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ") " + this.rzdescale);
    this.gNodes = that.svg;

    // Feliratok rétege.
    this.gLabels = that.svg.insert("svg:g", ".title_group")
            .attr("class", "axisX axis noEvents")
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");
    
    // Oszlopok alá a dimenzió ráírása.
    this.axisCaptions = that.svg.insert("svg:g", ".title_group")
            .attr("class", "dimensionLabel noEvents")
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ") ");    


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
    
//    this.drawNodeShadows();
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    panel_sankey.prototype = global.subclassOf(Panel); // A Panel metódusainak átvétele.    
    panel_sankey.prototype.nodeWidthInPixels = 80;
    panel_sankey.prototype.linkOpacity = 0.35;
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
panel_sankey.prototype.getNodeSortingComparator = function() {
    var that = this;            
    if (that.sortByValue) {        
        return function(a, b) {
            if (a.columnIndex !== b.columnIndex) return global.realCompare(a.columnIndex.toString(), b.columnIndex.toString());
            const aValue = a.value;
            const bValue = b.value;
            if (aValue < bValue) return 1;
            if (aValue > bValue) return -1;
            return 0;
        };
    } else {
        return function(a, b) {
            return global.realCompare2d(a.columnIndex.toString(), a.name, b.columnIndex.toString(), b.name);                                    
        };
    }        
};

panel_sankey.prototype.getLinkSortingComparator = function(nodeSortingComparator) {
    return function(a, b) {
        if (a.source.index === b.source.index) {
            return nodeSortingComparator(a.target, b.target);
        }
        if (a.target.index === b.target.index) {
            return nodeSortingComparator(a.source, b.source);
        }
        return 0;
    };        
};

/**
 * Egy elemhez tartozó tooltipet legyártó függvény;
 * 
 * @param {Object} node Az elem.
 * @returns {String} A megjelenítendő tooltip.
 */
panel_sankey.prototype.getTooltip = function (node) {
    var that = this;
    var unitProperty = (node.value === 1) ? "unit" : "unitPlural";
    return that.createTooltip(
            [{
                    name: that.localMeta.dimensions[that.dimsToShow[node.columnIndex]].description,
                    value: (node.name) ? node.name : _("Nincs adat")
                }],
            [{
                    name: that.localMeta.indicators[that.valToShow].description,
                    value: node.value,
                    dimension: ((that.valFraction) ? that.localMeta.indicators[that.valToShow].fraction[unitProperty] : that.localMeta.indicators[that.valToShow].value[unitProperty])
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

    if (drill.direction === -1) { // Lefúrás esetén.
        
        // Minden, azonos oszlopbeli node törlése, kivéve, amibe fúrunk (a szövegük is törlődik)
        that.gNodes.selectAll(".node")
                .filter(function(d) {
                    return (that.dimsToShow[d.columnIndex] === drill.dim && d.id !== drill.toId);
                })
                .on("click", null)
                .on("mouseover", null)
                .on("mouseout", null)
                .remove();
        
        // Minden nem érintett link törlése
        that.gLinks.selectAll(".link")
                .filter(function(d) {
                    return ((that.dimsToShow[d.source.columnIndex] === drill.dim || that.dimsToShow[d.target.columnIndex] === drill.dim)
                            && d.source.id !== drill.toId
                            && d.target.id !== drill.toId);
                })
                .remove();
                   
    } else if (drill.direction === 1) { // Felfúrás esetén
        
        // Mindent a szülő színére színezünk a kifúrás oszlopában.        
        that.gNodes.selectAll(".node")
                .filter(function(d) {
                    return (that.dimsToShow[d.columnIndex] === drill.dim);
                })
                .on("click", null)                
                .on("mouseover", null)
                .on("mouseout", null)
                .attr("fill", global.color(drill.fromId));       
    }
    
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
    const nodeSortingComparator = that.getNodeSortingComparator();
    const linkSortingComparator = that.getLinkSortingComparator(nodeSortingComparator);
    that.sankey.nodeSort(nodeSortingComparator).linkSort(linkSortingComparator);
        
    const sankeyGraph = that.sankey(that.sankey(that.graphFromDataRows(oldData, newDataRows, drill)));    
    sankeyGraph.nodes.sort(nodeSortingComparator);
    that.addGapsToGraph(sankeyGraph);
    that.setStartPositions(oldData, sankeyGraph, drill);
    that.addTooltips(sankeyGraph);

    return sankeyGraph;
};


panel_sankey.prototype.setStartPositions = function (oldGraph, sankeyGraph, drill) {
    const that = this;
    
    const openFromElement = (drill.direction === -1 && oldGraph !== undefined) ? global.getFromArrayByProperty(oldGraph.nodes, 'id', drill.toId) : null; // Ebből a régi elemből kell kinyitni mindent.
    const openFromElementHeightRatio = (openFromElement) ? (openFromElement.y1 - openFromElement.y0) / (that.shadowGraph.nodes[0].y1 - that.shadowGraph.nodes[0].y0) : 1;
    
    var parentFound = [false, false, false, false, false];
    var after = 0;
    const startY0 = that.shadowGraph.nodes[0].y0;
    const startY1 = that.shadowGraph.nodes[0].y1;
    const fullHeight = startY1 - startY0;
    var before = 0;
    
    for (var i = 0, iMax = sankeyGraph.nodes.length; i < iMax; i++) {
        const node = sankeyGraph.nodes[i];
        if (openFromElement && that.dimsToShow[node.columnIndex] === drill.dim) { // Ha az adott dimenzióban befúrás történik            
            node.startY0 = openFromElement.y0 + node.y0 * openFromElementHeightRatio;
            node.startY1 = openFromElement.y0 + node.y1 * openFromElementHeightRatio;
            node.startOpacity = 1;
            node.startTextOpacity = 0;
            for (var j = 0, jMax = node.sourceLinks.length; j < jMax; j++) {
                node.sourceLinks[j].startY0 = node.startY0 + (node.sourceLinks[j].y0 - node.y0) * (node.startY1 - node.startY0) / (node.y1 - node.y0);            
            }
            for (var j = 0, jMax = node.targetLinks.length; j < jMax; j++) {
                node.targetLinks[j].startY1 = node.startY0 + (node.targetLinks[j].y1 - node.y0) * (node.startY1 - node.startY0) / (node.y1 - node.y0);    ;
            }  
        } else if (drill.direction === 1 && that.dimsToShow[node.columnIndex] === drill.dim) { // Ha az adott dimenzióban kifúrás történik
            
            if (!parentFound[node.columnIndex] && node.id === drill.fromId) {                
                node.startY0 = startY0;
                node.startY1 = startY1;
                parentFound[node.columnIndex] = true;
                after = 1;
                node.startOpacity = 1;
                node.startTextOpacity = 1;
                for (var j = 0, jMax = node.sourceLinks.length; j < jMax; j++) {
                    node.sourceLinks[j].startY0 = (node.startY0 + node.startY1)/2;            
                }
                for (var j = 0, jMax = node.targetLinks.length; j < jMax; j++) {
                    node.targetLinks[j].startY1 = (node.startY0 + node.startY1)/2;
                }
                
                for (var b = 1; b < before + 1; b++) {
                    const node = sankeyGraph.nodes[i - b];
                    node.startY0 = -5 - startY1 * b;
                    node.startY1 = node.startY0 + fullHeight;
                    node.startOpacity = 0;
                    node.startTextOpacity = 0;
                    for (var j = 0, jMax = node.sourceLinks.length; j < jMax; j++) {
                        node.sourceLinks[j].startY0 = node.startY0 + (node.sourceLinks[j].y0 - node.y0) * fullHeight / (node.y1 - node.y0);            
                    }
                    for (var j = 0, jMax = node.targetLinks.length; j < jMax; j++) {
                        node.targetLinks[j].startY1 = node.startY0 + (node.targetLinks[j].y1 - node.y0) * fullHeight / (node.y1 - node.y0);    ;
                    }                                        
                }
                before = 0;
            } else if (!parentFound[node.columnIndex]) {
                before++;
            } else {                
                node.startY0 = 5 + startY1 * after;
                node.startY1 = node.startY0 + fullHeight; 
                node.startOpacity = 0;
                node.startTextOpacity = 0;
                for (var j = 0, jMax = node.sourceLinks.length; j < jMax; j++) {
                    node.sourceLinks[j].startY0 = node.startY0 + (node.sourceLinks[j].y0 - node.y0) * fullHeight / (node.y1 - node.y0);           
                }
                for (var j = 0, jMax = node.targetLinks.length; j < jMax; j++) {
                    node.targetLinks[j].startY1 = node.startY0 + (node.targetLinks[j].y1 - node.y0) * fullHeight / (node.y1 - node.y0);
                }
                after++;
            }
        } else { // Ha az adott dimenzióban semmi se történik
            node.startY0 = node.y0;
            node.startY1 = node.y1;
            node.startOpacity = 0;
            node.startTextOpacity = 0;
        }

    }
     
};

panel_sankey.prototype.graphFromDataRows = function (oldGraph, dataRows, drill) {
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
                    tooltip: undefined
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

panel_sankey.prototype.addGapsToGraph = function (graph) {
    const that = this;
    const allGap = that.height / 15;
    const contraction = (that.height - allGap) / that.height;

    const nodes = graph.nodes;
    var idx = -1;
    var lastColIdx = -1;
    var elementsInColumn = -1;
    var nextStart = -1;
    
    
    for (var i = 0, iMax = nodes.length; i < iMax; i++) {
        const node = nodes[i];
        if (node.columnIndex !== lastColIdx) {
            idx = -1;
            lastColIdx = node.columnIndex;
            elementsInColumn = 0;            
            for (var j = i; j < iMax && nodes[j].columnIndex === lastColIdx; j++) {
                elementsInColumn++;
            }
            nextStart = allGap / elementsInColumn / 2;
        }
        idx++;
        const newHeight = (node.y1 - node.y0) * contraction;
        const translation = node.y0 - nextStart;
        const oldStart = node.y0;
        node.y0 = nextStart;
        node.y1 = node.y0 + newHeight;
                
        for (var j = 0, jMax = node.sourceLinks.length; j < jMax; j++) {
            const link = node.sourceLinks[j];
            const height = link.y1 - link.y0;
            link.y0 = (link.y0 - oldStart) * contraction + nextStart;
            link.width = link.width * contraction;                        
        }
        
        for (var j = 0, jMax = node.targetLinks.length; j < jMax; j++) {
            const link = node.targetLinks[j];            
            link.y1 = (link.y1 - oldStart) * contraction + nextStart;            
        }
        
        nextStart = node.y1 + allGap / elementsInColumn;
    }
};

panel_sankey.prototype.addTooltips = function (graph) {
    var that = this;
    for (var i = 0, iMax = graph.nodes.length; i < iMax; i++) {
        const node = graph.nodes[i];
        node.tooltip = that.getTooltip(node);
    }    
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
            that.drawAxes(that.preparedData, trans);
        } else {
            that.panic(true, _("<html>A változó értéke<br />minden dimenzióban 0.</html>"));
            that.preparedData = undefined;
        }
    }
    var titleMeta = that.localMeta.indicators[that.valToShow];
    that.titleBox.update(that.valToShow, titleMeta.caption, titleMeta.value.unitPlural, titleMeta.fraction.unitPlural, that.valFraction, tweenDuration);
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
    
    var gNodes = that.gNodes.selectAll("rect.node")
            .data(graph.nodes, function (d) {
                return d.uniqueId;
            });
    
    gNodes.exit()
            .on("click", null)
            .on("mouseover", null)
            .on("mouseout", null)
            .remove();
    
    gNodes = gNodes.enter().insert("svg:rect", ".sankey_links")            
            .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ") " + this.rzdescale)
            .attr("x", d => d.x0)
            .attr("width", d => (d.x1 - d.x0))
            .attr("y", d => d.startY0)
            .attr("height", d => (d.startY1 - d.startY0))
            .attr("opacity", d => d.startOpacity)
            .merge(gNodes)
            .attr("class", d => "node bar bordered darkenable listener legendControl" + d.index)
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
            })
            .attr("opacity", 1)
            .on("end", function (d) {
                d3.select(this)
                .on("mouseover", function () {
                    d3.select(this).classed("triggered", true);
                })
                .on("mouseout", function () {
                    d3.select(this).classed("triggered", false);
                });
            });


    var gLinks = that.gLinks.selectAll(".link")
            .data(graph.links, function (d) {
                return d.source.uniqueId + "-" + d.target.uniqueId;
            });
    
    gLinks.exit()
            .on("click", null)
            .remove();
    
    gLinks = gLinks.enter().append("svg:path")            
            .attr("d", d3.linkHorizontal()
                    .source(d => [d.source.x1, (d.startY0 === undefined) ? d.y0 : d.startY0])
                    .target(d => [d.target.x0, (d.startY1 === undefined) ? d.y1 : d.startY1]))
            .attr("opacity", 0)
            .attr("stroke-width", function(d) { return d.width; })
            .merge(gLinks)
            .attr("class", d => "link controlled controlled" + d.source.index + " controlled" + d.target.index);

    gLinks.transition(trans)            
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", function(d) { return d.width; })
            .attr("opacity", that.linkOpacity);
    
};

/**
 * A dimenzió feliratok kiírása.
 * 
 * @param {Object} graph A panel által megjelenítendő, feldolgozott adatok.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
panel_sankey.prototype.drawAxes = function (graph, trans) { 
    var that = this;
    
    var dimCaptions = [];    
    for (let i = 0, iMax = this.numberOfDims; i < iMax; i++) {
        dimCaptions.push(that.localMeta.dimensions[that.dimsToShow[i]].caption);
    }
    
    var axisCaptions = that.axisCaptions.selectAll("text")
            .data(dimCaptions);
            
    axisCaptions.exit()            
            .remove();        
            
    axisCaptions = axisCaptions.enter().append("svg:text")
            .attr("class", "noEvents")
            .merge(axisCaptions);
    
    axisCaptions
            .attr("x", (d, i) => this.shadowGraph.nodes[i].x0  / that.rzscale)            
            .attr("y", 0)
            .attr("dy", '-0.4ex')
            .text(d => d);            
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
    
    //const fontSize = 16;

    var gLabels = that.gLabels.selectAll("text")
            .data(graph.nodes, function (d) {
                return d.uniqueId;
            });
    
    gLabels.exit()
            //.transition(trans).attr("opacity", 0)
            .remove();
    
    gLabels = gLabels.enter().append("svg:text")            
            .attr("class", "node legend noEvents")
            .attr("opacity", d => d.startTextOpacity)
            .attr("x", function (d) {                
                return (d.x0 + d.x1) / 2 / that.rzscale;
            })
            .attr("y", function (d) {
                return (d.startY0 + d.startY1) / 2;
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
                return (d.x0 + d.x1) / 2 / that.rzscale;
            })
            .attr("y", function (d) {
                return (d.y0 + d.y1) / 2;
            })
            .attr("opacity", function(d) {                
                return ((d.y1-d.y0) < global.fontSizeSmall * 0.9 ) ? 0 : 1;                
            });

    // A szövegek összenyomása, hogy elférjenek.    
    global.cleverCompress(gLabels, that.sankey.nodeWidth() / that.rzscale, 0.9, undefined, false, false, 80);       
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