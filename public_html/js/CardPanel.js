/* global d3 */

'use strict';

/**
 * A report-böngésző konstruktora.
 * 
 * @param {Object} init Inicializáló objektum. (Valójában csak a panel oldalát tartalmazza.)
 * @param {Object} superMeta A reportokat leíró meta.
 * @param {Number} startScale A méretszorzó, amivel meg kell jeleníteni.
 * @param {Number} duration Az előtűnisi animáció időtartama.
 * @returns {CardPanel} A fejlécpanel.
 */
function CardPanel(init, superMeta, startScale, duration) {
    var that = this;

    this.panelSide = init.group || 0;
    this.superMeta = superMeta;
    this.mediator = global.mediators[init.group];
    this.mediatorIds = [];		// A mediátorok id-jeit tartalmazó tömb.
    this.panelDiv = d3.select("#headPanelP" + this.panelSide);
    that.panelDiv.style("width", (((parseInt(d3.select("#topdiv").style("width"))) / startScale) - global.panelMargin * 2) + "px");
    if (global.isEmbedded) {
        // that.panelDiv.style("height", "0px");
    }
    this.panelId = "#panel" + that.panelSide + "P-1";
    this.divTableBase = undefined;
    this.init("cardPanel", duration);
    
    this.keywordFilters = [];
    this.textFilter = "";
    this.maxCards = 12;
    
    var med;
    med = this.mediator.subscribe("killPanel", function(panelId) {
        that.killPanel(panelId);
    });
    that.mediatorIds.push({"channel": "killPanel", "id": med.id});

    med = this.mediator.subscribe("killListeners", function() {
        that.killListeners();
    });
    that.mediatorIds.push({"channel": "killListeners", "id": med.id});

    med = this.mediator.subscribe("resize", function(duration, panelNumberPerRow, scaleRatio, immediate) {
        that.resize(immediate ? 0 : duration, panelNumberPerRow);        
    });
    that.mediatorIds.push({"channel": "resize", "id": med.id});

    med = this.mediator.subscribe("langSwitch", function() {
        that.initPanel(duration);
    });
    that.mediatorIds.push({"channel": "langSwitch", "id": med.id});
    
    med = this.mediator.subscribe("magnify", function(direction) {
        that.addKeyword();
    });
    that.mediatorIds.push({"channel": "magnify", "id": med.id});

    this.panelDiv.classed("cardPanelHolder", true);
    
    this.top = that.divTableBase.append("html:div")
            .attr("id", "greetingBadge")
            .attr("class", "greetingBadge")
            .classed("loggedin", global.preferredUsername);

    // A keresés mező.
    this.top.append("html:input")
            .attr("type", "text")
            .attr("id", "searchP" + that.panelSide)
            .attr("class", "search")
            .attr("placeholder", "???")
            .on("keyup", that.searchFilter.bind(this));
            
    this.greeting = this.top.append("html:div")
            .attr("class", "greeting");            
    
    this.greeting.append("html:span")
            .attr("class", "loc")
            .text((global.preferredUsername) ? "Felhasználó:" : "Nincs belépve. Csak a publikus jelentések láthatóak.");
    
    this.greeting.append("html:span")
            .attr("class", "username")
            .text((global.preferredUsername) ? " " + global.preferredUsername : "");
        
    // Logout link.
    this.top.append("html:span")
            .attr("id", "logoutLink")
            .attr("class", "loc")
            .text((global.preferredUsername) ? "Kilépés" : "Belépés")
            .on("click", (global.preferredUsername) ? global.logout : global.login);            

    const tableScrollPane = that.divTableBase.append("html:div")
            .attr("class", "tableScrollPane");

    tableScrollPane.append("html:div")
            .attr("class", "backClickCaptureDiv listener")
            .on("click", function() {that.popKeyword();});

    // Táblázat létrehozása.
    this.table = tableScrollPane.append("html:div")
            .attr("class", "cardHolder reportsTable")
            .attr("id", "reportsTableP" + that.panelSide);

    that.initPanel();    
           
}

//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    CardPanel.prototype.panelMargin = global.panelMargin;
}

//////////////////////////////////////////////////
// Működést végrehajtó függvények
//////////////////////////////////////////////////

/**
 * Inicializálja a fejlécpanelt. A konstruktornak kell meghívnia.
 * 
 * @param {String} additionalClass A html objektumhoz adandó további class-nevek.
 * @param {Number} duration Az előtűnési animáció időtartama.
 * @returns {undefined}
 */
CardPanel.prototype.init = function(additionalClass, duration) {
    var that = this;

    if (that.panelDiv.selectAll(".baseDiv").empty()) {

        // Alap Div, rajta van a táblázat
        that.divBase = that.panelDiv.append("html:div")
                .attr("class", "baseDiv");

    } else {
        that.divBase = that.panelDiv.select(".baseDiv");
    }
    
    

    that.reset(additionalClass, duration);
};

/**
 * Átméretezi a panelt.
 * 
 * @param {Number} duration Az átméretezés ideje, millisec.
 * @param {Integer} panelNumberPerRow Egy sorban elférő normál méretű panelek száma.
 * @returns {undefined}
 */
CardPanel.prototype.resize = function(duration, panelNumberPerRow) {
    var width = panelNumberPerRow * (global.panelWidth + 2 * this.panelMargin);
    this.panelDiv.style("width", width + "px");
};

/**
 * Felfrissíti a panelt méretváltozás után.
 * A származtatott osztályok majd felülírják.
 * 
 * @returns {undefined}
 */
CardPanel.prototype.refresh = function () {
};

/**
 * Letörli, és alaphelyzetbe hozza a fejlécpanelt.
 * 
 * @param {String} additionalClass A html objektumhoz adandó további class-nevek.
 * @param {Number} duration Az előtűnési animáció időtartama.
 * @returns {undefined}
 */
CardPanel.prototype.reset = function(additionalClass, duration) {
    var that = this;
    if (duration === undefined) {
        duration = global.selfDuration;
    }
    that.panelDiv.selectAll(".divTableBase")
            .attr("class", null)
            .style("width", function() {
                return d3.select(this).style("width");
            })
            .style("position", "absolute")
            .style("opacity", "0")
            .remove();

    that.divTableBase = that.divBase.append("html:div")
            .attr("class", "divTableBase " + additionalClass)
            .style("opacity", 0);

    that.divTableBase.transition().duration(duration)
            .style("opacity", 1);

    if (global.isEmbedded) {
        d3.select("body").transition().duration(duration)
                .style("opacity", 1);
    }
   
};


/**
 * Megöli a panel 'listener' osztályú elmeihez rendelt eseményfigyelőket.
 * 
 * @returns {undefined}
 */
CardPanel.prototype.killListeners = function() {
    this.panelDiv.selectAll(".listener")
            .on("click", null)
            .on("mouseover", null)
            .on("mouseout", null);
};

/**
 * Megöli a panelt.
 * 
 * @param {Integer} panelId A megölendő panel id-je. (Ha a panelen belülről hívjuk, elhagyható.)
 * @returns {undefined}
 */
CardPanel.prototype.killPanel = function(panelId) {
    if (panelId === undefined || panelId === this.panelId) {
        this.killListeners();

        // A panel mediátor-leiratkozásai.
        for (var i = 0, iMax = this.mediatorIds.length; i < iMax; i++) {
            this.mediator.remove(this.mediatorIds[i].channel, this.mediatorIds[i].id);
        }
        this.mediatorIds = [];
        this.mediator = undefined;
    }
};


//////////////////////////////////////////////////
// Kirajzolást segítő függvények
//////////////////////////////////////////////////

/**
 * Szűrőfunkció. Csak azokat a sorokat mutatja, amik illeszkednek a szűrőkifejezésre.
 * Meghívandó amikor a szűrőmező tartalma változik.
 * 
 * @returns {undefined}
 */
CardPanel.prototype.searchFilter = function() {
    var that = this;
    var val = d3.select("#searchP" + that.panelSide).property("value").replace(/ +/g, ' ').toLowerCase().trim();    
    that.textFilter = val;
    that.table.selectAll(".card").remove();
    that.initPanel();
};

CardPanel.prototype.createGrouping = function(data, maxEntries, depth) {
    if (depth === undefined) {
        depth = 0;
    }
    if (data.length <= maxEntries) {
        return data;
    }
        
    const accessor = function(item) {
        return item.name;
    };
    
    var keywords = [];
    for (var i = 0, iMax = data.length; i < iMax; i++) {
        const reportKeywords = data[i].keywords;
        reportKeywords.forEach(item => this.putArrayWithScore(keywords, item, accessor, 0));
    }
    
    keywords.sort(function(a,b) {
        return b.multiplicity - a.multiplicity;
    });
    
    var magickeyword = undefined;
    for (var i = 0, iMax = keywords.length; i < iMax; i++) {
        if (keywords[i].multiplicity < data.length - depth && keywords[i].multiplicity > 1) {
            magickeyword = keywords[i];
            break;
        }
    }
                    
    if (magickeyword === undefined) {
        return data;
    }
        
    data = this.removeFromArray(data, magickeyword.name);
    
    magickeyword.keywords = [];
    magickeyword.collector = true;
        
    data.push(magickeyword);
    return this.createGrouping(data, maxEntries, depth + 1);            
};



CardPanel.prototype.createGrouping2 = function(data, maxEntries, depth) {
    
    if (data.length <= maxEntries) {
        return data;
    }
    
    const accessor = function(item) {
        return item.name;
    };
    
    var keywords = [];
    for (var i = 0, iMax = data.length; i < iMax; i++) {
        const reportKeywords = data[i].keywords;
        const score = 1/reportKeywords.length;
        reportKeywords.forEach(item => this.putArrayWithScore(keywords, item, accessor, score));
    }
    
    keywords.forEach(item => item.usefulness = this.collectorUsefulnessScore(item.multiplicity, data.length, item.score));
    keywords.sort(function(a, b){return b.usefulness - a.usefulness;});
    console.log(keywords);
    
    for (var i = 0, iMax = keywords.length; i < iMax; i++) {
        const keyword = keywords[i];
        if (keyword.usefulness > 0) {
            console.log("elotte: " + data.length)
            console.log("remove " + keywords[i].name);
            const newData = this.removeFromArray(data, keywords[i].name);
            keywords[i].collector = true;
            keywords[i].keywords = [];
            newData.push(keywords[i])
            console.log("utana: " + newData.length)
            if (newData.length < data.length) {
                console.log("KIVESZEM")
                data = newData;
            }                
            console.log("")
        }
    }
    
    return data;
};

CardPanel.prototype.collectorUsefulnessScore = function (multiplicity, reportNumber, score) {
    if (multiplicity === 1 || multiplicity === reportNumber) {
        return 0;
    }
    return score * (reportNumber - multiplicity);
};

CardPanel.prototype.determineGroupSizes = function (newData, filteredData) {
    for (var i = 0, iMax = newData.length; i < iMax; i++) {
        const data = newData[i];
        if (data.collector) {
            data.multiplicity = 0;
            for (var j = 0, jMax = filteredData.length; j < jMax; j++) {
                if (filteredData[j].keywords.findIndex((element) => element.name === data.name) > -1) {
                    data.multiplicity ++;                
                }
            }
        }
    }    
};

CardPanel.prototype.putArrayWithScore = function(array, item, accessor, score) {
    for (var i = 0, iMax = array.length; i < iMax; i++) {
        const element = array[i];
        if (accessor(element) === accessor(item)) {
            element.multiplicity = element.multiplicity + 1;
            element.score = element.score + score;
            return array;
        }
    }    
    item.multiplicity = 1;
    item.score = score;
    array.push(item);
    return array;
};

CardPanel.prototype.removeFromArray = function(inputArray, key) {
    var array = [...inputArray];
    for (var i = array.length - 1, iMin = 0; i >= iMin; i--) {
        const keys = array[i].keywords;
        for (var k = 0, kMax = keys.length; k < kMax; k++) {
            if (keys[k].name === key) {
                array.splice(i,1);
                break;
            }
        }
    }
    return array;
};


CardPanel.prototype.createData = function(superMeta) {    
    var filteredData = this.applyFilters(superMeta);

    var maxCards = Math.min(global.panelNumberOnScreen * 2 * 3, this.maxCards);    
    maxCards = 6;
        
    var filteredDataForCards = this.createGrouping2([...filteredData], maxCards);
    this.determineGroupSizes(filteredDataForCards, filteredData);
    this.addKpiToReports(filteredDataForCards);
    
    // Elemek nyelvfüggő sorbarendezése.
    filteredDataForCards.sort(function(a, b) {
        if ((a.collector && b.collector) || (!a.collector && !b.collector)) {
            return global.getFromArrayByLang(a.labels).caption.localeCompare(global.getFromArrayByLang(b.labels).caption, {sensitivity: 'variant', caseFirst: 'upper'});
        }
        return (a.collector) ? -1 : 1;
    }); 
    
    // Kamu adatok hozzáadása, hogy automatikusan csinos legyen a flex.
    for (var i = 0, iMax = 12; i < iMax; i++) {
        filteredDataForCards.push({});
    }
    
    return filteredDataForCards;
};

CardPanel.prototype.addKpiToReports = function(cardSuperMeta) {
    for (var i = 0, iMax = cardSuperMeta.length; i < iMax; i++) {
        cardSuperMeta[i].kpiToShow = this.kpiToShow(cardSuperMeta[i]);
    }
};

/**
 * Egy adatsorból meghatározza a megmutatandó értéket.
 * 
 * @param {Object} d Nyers adatsor.
 * @returns {Number} Az értékek.
 */
CardPanel.prototype.kpiToShow = function(reportmeta) {
    if (reportmeta.collector) {
        return {value: reportmeta.multiplicity, originalValue: reportmeta.multiplicity, unit: ""};
    }
    try {
        const kpi = reportmeta.kpi;
        const indicator = reportmeta.indicators[kpi.indicatorIndex];
        const value = reportmeta.topLevelValues.answer[0].response.rows[0].vals[kpi.indicatorIndex];        
        const language = String.locale;         
        const unitLabel = global.getFromArrayByLang(indicator.multilingualization, language);        
        var val = (kpi.ratio) ? indicator.denominatorMultiplier * value.sz / value.n : indicator.valueMultiplier * value.sz;
        
        var origVal = val;
        if (!isFinite(parseFloat(val))) {
            val = 0;
        }
        if (isNaN(parseFloat(origVal))) {
            origVal = "???";
        }
        val = global.cleverRound2(val);
        const label = global.getFromArrayByLang(reportmeta.kpi.labels, language);
        const unit = (kpi.ratio) ? ((origVal === 1) ? unitLabel.denominatorUnit : unitLabel.denominatorUnitPlural) : ((origVal === 1) ? unitLabel.valueUnit : unitLabel.valueUnitPlural);
        return {value: val, originalValue: origVal, unit: unit, label: label.description || label.caption};
    } catch(e) {        
        return undefined;
    }
};


//////////////////////////////////////////////////
// Rajzolási folyamat függvényei
//////////////////////////////////////////////////

/**
 * Feltölti a panelt a supermetában megkapott dinamikus tartalommal.
 * Nyelvváltás esetén elég ezt lefuttatni.
 * 
 * @param {Number} duration Animáció ideje.
 * @returns {undefined}
 */
CardPanel.prototype.initPanel = function(duration) {
    const that = this;

    const dataToShow = this.createData(this.superMeta);        
    
    // Adatok újratársítása, sorok letörlése.
    var card = this.table.selectAll(".card").data(dataToShow)
            .html("");

    card = card
            .enter().append("html:div")
            .merge(card)
            .attr("class", function(d) {
                return (d.labels === undefined) ? "card dummy" : (d.collector) ? "card collector" : "card listener";
            })
            .attr("tooltip", function (d) {                
                if (!d.collector && d.kpiToShow) {                    
                    return "<html><h4>" + d.kpiToShow.label + ": <em>" + d.kpiToShow.value + " " + d.kpiToShow.unit + "</em></h4></html>";
                }
            })
            .on("click", function(d) {
                d3.event.stopPropagation();
                if (d.collector) {
                    that.addKeyword(d.name);
                } else {
                    that.showReport(d);
                }
            });

    var tempCardCell;
    
    // Report neve.
    {
        tempCardCell = card.append("html:div")        
                .attr("class", "cardCell name")
                .style("background", function(d) {                    
                        return (d.collector) ? global.color(d.name) : "";
                })
                .append("html:span")
                .text(function(d) {                    
                    return (d.labels === undefined) ? " " : global.getFromArrayByLang(d.labels).caption;
                });
                
    }

    // Kpi.
    {
        tempCardCell = card.append("html:div")
                .attr("class", "cardCell kpi");

        tempCardCell.append("html:span")
                .text(function(d) {
                    return (d.kpiToShow === undefined) ? "" : d.kpiToShow.value;
                })
                .append("html:span")
                    .html(function(d) {                                            
                        return (d.kpiToShow === undefined) ? "&nbsp;" : " " + d.kpiToShow.unit;
                });
    }

    // Ikon
    {
        tempCardCell = card.append("html:div")
                .attr("class", "cardCell icon") 
                .html(function(d) {    
                    return (d.collector) ? d.icon : "";
                });
    }


    // Elválasztó vonal
    {
        tempCardCell = card.append("html:div")
                .attr("class", "cardCell hrule")
                .style("background", function(d) {                    
                        return (d.collector) ? global.color(d.name) : "";
                });
    }


    // A második cella: report leírása.
    {
        tempCardCell = card.append("html:div")
                .attr("class", "cardCell description");

        tempCardCell.append("html:text")
                .text(function(d) {
                    return (d.labels === undefined) ? "" : global.getFromArrayByLang(d.labels).description;
                });

        tempCardCell.append("html:span")
                .html("&nbsp;");
    }

    // A harmadik cella: report adatforrása.
    {
        tempCardCell = card.append("html:div")
                .attr("class", "cardCell source");

        tempCardCell.append("html:text")
                .text(function(d) {
                    return (d.labels === undefined) ? "" : global.getFromArrayByLang(d.labels).datasource;
                });

        tempCardCell.append("html:span")
                .html("&nbsp;");
    }

    // A negyedik cella: utolsó adatfeltöltés ideje.
    {
        tempCardCell = card.append("html:div")
                .attr("class", "cardCell time");

        tempCardCell.append("html:text")
                .text(function(d) {
                    return (d.updated === undefined) ? "" : global.cleverDate(new Date(d.updated.replace(/-/g, "/")));
                });

        tempCardCell.append("html:span")
                .html("&nbsp;");
    }
    
    window.dispatchEvent(new Event('resize'));

};

//////////////////////////////////////////////////
// Irányítást végző függvények
//////////////////////////////////////////////////

CardPanel.prototype.addKeyword = function(keyword) {
    if (keyword) {
        this.keywordFilters.push(keyword);
    }
    this.table.selectAll(".card").remove();
    this.initPanel();    
};

CardPanel.prototype.popKeyword = function() {
    this.keywordFilters.pop();
    this.table.selectAll(".card").remove();
    this.initPanel();    
};

CardPanel.prototype.applyFilters = function(meta) {
    const that = this;
    
    var result = [];
    
    for (var i = 0, iMax = meta.length; i < iMax; i++) {
        const rep = meta[i];
        
        var ok = true;        
        for (var f = 0, fMax = that.keywordFilters.length; f < fMax; f++) {
            const keyword = that.keywordFilters[f];
            if (rep.keywords.findIndex((element) => element.name === keyword) === -1) {
                ok = false;
                break;
            }
        }
                                
        if (ok) {
            if (this.getSearchString(rep).indexOf(that.textFilter.toLowerCase()) > -1) {
                result.push(rep);
            }
        }
    }
            
    return result;
};

CardPanel.prototype.getSearchString = function(reportmeta) {
    var result = global.getFromArrayByLang(reportmeta.labels).caption + ";" +
            global.getFromArrayByLang(reportmeta.labels).datasource + ";" +
            global.getFromArrayByLang(reportmeta.labels).description;
    for (var f = 0, fMax = reportmeta.keywords.length; f < fMax; f++) {
        result = result + ";" + global.getFromArrayByLang(reportmeta.keywords[f].labels).caption;
    }
    return result.toLowerCase();
};


/**
 * Report kiválasztásának kezelése.
 * 
 * @param {Object} reportMeta A kiválasztott report meta-ja.
 * @returns {undefined}
 */
CardPanel.prototype.showReport = function(reportMeta) {
    var that = this;

    // Megöljük az eseménykezelőket.
    that.killListeners();
    that.divTableBase.select("#searchP" + that.panelSide).on("keyup", null);

    that.mediator.publish("newreport", that.panelSide, reportMeta);
};