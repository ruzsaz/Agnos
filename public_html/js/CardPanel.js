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
    this.superMeta = that.fillMissingLabels(superMeta);
    this.mediator = global.mediators[init.group];
    this.mediatorIds = [];		// A mediátorok id-jeit tartalmazó tömb.
    this.panelDiv = d3.select("#headPanelP" + this.panelSide);
    that.panelDiv.style("width", (((parseInt(d3.select("#topdiv").style("width"))) / startScale) - global.panelMargin * 2) + "px");
    this.panelId = "#panel" + that.panelSide + "P-1";
    this.divTableBase = undefined;
    
    this.init("cardPanel", duration);
                
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
            .attr("value", global.textFilter[that.panelSide])
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
            .attr("class", "loc logoutLink")
            .text((global.preferredUsername) ? "Kilépés" : "Belépés")
            .on("click", (global.preferredUsername) ? global.logout : global.login);            

    this.tableScrollPane = that.divTableBase.append("html:div")
            .attr("class", "tableScrollPane");

    this.tableScrollPane.append("html:div")
            .attr("class", "backClickCaptureDiv listener")
            .on("click", function() {that.popKeyword(d3.event);});

    // Táblázat létrehozása.
    this.table = this.tableScrollPane.append("html:div")
            .attr("class", "cardHolder reportsTable")
            .attr("id", "reportsTableP" + that.panelSide);

    that.initPanel();    
           
};

/**
 * Feltölti a hiányzó neveket, labeleket, ha van mi alapján.
 * (nyelvek, egyes-többeszám, rövid-hosszú alapján)
 * 
 * @param {Array} superMeta A reportok adatait tartalmazó tömb.
 * @returns {Array} A módosított reportok adatait tartalmazó tömb.
 */
CardPanel.prototype.fillMissingLabels = function(superMeta) {
    for (var i = 0, iMax = superMeta.length; i < iMax; i++) {
        const reportMeta = superMeta[i];
        if (reportMeta.labels.length > 0) {
            const defaultLabel = reportMeta.labels[0];
            defaultLabel.caption = global.getFirstValidString(defaultLabel.caption, defaultLabel.description);
            defaultLabel.description = global.getFirstValidString(defaultLabel.description, defaultLabel.caption);
            for (var l = 1, lMax = reportMeta.labels.length; l < lMax; l++) {
                const actualLabel = reportMeta.labels[l];
                actualLabel.caption = global.getFirstValidString(actualLabel.caption, actualLabel.description, defaultLabel.caption, defaultLabel.description);
                actualLabel.description = global.getFirstValidString(actualLabel.description, actualLabel.caption, defaultLabel.description, defaultLabel.caption);
                actualLabel.datasource = global.getFirstValidString(defaultLabel.datasource, defaultLabel.datasource);
            }
        }
        
        if (reportMeta.kpi.labels.length > 0) {
            const defaultKpiLabel = reportMeta.kpi.labels[0];
            defaultKpiLabel.caption = global.getFirstValidString(defaultKpiLabel.caption, defaultKpiLabel.description);
            defaultKpiLabel.description = global.getFirstValidString(defaultKpiLabel.description, defaultKpiLabel.caption);
            for (var l = 1, lMax = reportMeta.kpi.labels.length; l < lMax; l++) {
                const actualKpiLabel = reportMeta.kpi.labels[l];
                actualKpiLabel.caption = global.getFirstValidString(actualKpiLabel.caption, actualKpiLabel.description, defaultKpiLabel.caption, defaultKpiLabel.description);
                actualKpiLabel.description = global.getFirstValidString(actualKpiLabel.description, actualKpiLabel.caption, defaultKpiLabel.description, defaultKpiLabel.caption);
            }
        }
    }
    return superMeta;
};


//////////////////////////////////////////////////
// Osztály-konstansok inicializálása.
//////////////////////////////////////////////////

{
    CardPanel.prototype.panelMargin = global.panelMargin;
    CardPanel.prototype.maxCards = 12;
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
    global.textFilter[that.panelSide] = val;
    that.table.selectAll(".card").remove();
    that.initPanel();
};

/**
 * Mappákat alakít ki a kulcsszavakból.
 * 
 * @param {Array} data A reportok adatait tartalmazó tömb.
 * @param {Number} maxEntries A megcélzandó maximális kupac-szám.
 * @returns {Array} A mappákat, és a maradék reportokat tartalmazó tömb.
 */
CardPanel.prototype.createGrouping = function(data, maxEntries) {
    
    if (data.length <= maxEntries) {
        return data;
    }
    
    const accessor = function(item) {
        return item.name;
    };
    
    // Kulcsszavak összegyűjtése
    var keywords = [];
    for (var i = 0, iMax = data.length; i < iMax; i++) {
        const reportKeywords = data[i].keywords;
        const score = 1/reportKeywords.length; // 1/kulcsszavak száma
        reportKeywords.forEach(item => this.putArrayWithScore(keywords, item, accessor, score));
    }
    
    // A kulcsszavak hasznossági sorrendje
    keywords.forEach(item => item.usefulness = this.collectorUsefulnessScore(item.multiplicity, data.length, item.score));
    keywords.sort(function(a, b){return b.usefulness - a.usefulness;});
    
    // A leghasznosabb kulcsszavakból mappák kialakítása
    for (var i = 0, iMax = keywords.length; i < iMax; i++) {
        const keyword = keywords[i];
        if (keyword.usefulness > 0) {
            const newData = this.removeFromArray(data, keywords[i].name);
            keywords[i].collector = true;
            keywords[i].keywords = [];
            newData.push(keywords[i]);
            if (newData.length < data.length) {
                data = newData;
            }                
        }
    }
    
    return data;
};

/**
 * Megállapítja egy lehetséges kulcsszó mappaként való hasznosságát.
 * 
 * @param {Number} multiplicity Az adott kulcsszó hágy reportban szerepel?
 * @param {Number} reportNumber A reportok összszáma.
 * @param {Number} score A kulcsszó megkülönböztető ereje.
 * @returns {Number} A hasznosság.
 */
CardPanel.prototype.collectorUsefulnessScore = function (multiplicity, reportNumber, score) {
    if (multiplicity === 1 || multiplicity === reportNumber) {
        return 0;
    }
    return score * (reportNumber - multiplicity);
};

/**
 * Beírja a csoportméretet a kártyák közül a csoport típusúakba. A meglévő
 * tömböt módosítja.
 * 
 * @param {Array} cardsData A kártyák adatait tartalmazó tömb.
 * @param {Array} filteredData A kezelendő reportok adatait tartalmazó tömb.
 * @returns {undefined}
 */
CardPanel.prototype.determineGroupSizes = function (cardsData, filteredData) {
    for (var i = 0, iMax = cardsData.length; i < iMax; i++) {
        const data = cardsData[i];
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

/**
 * Beletesz egy elemet egy gyűjtőtömbbe, ha még nem volt benne azonos.
 * Ha már volt, akkor növeli a meglévő elem előfordulási számát, és pontját.
 * 
 * @param {Array} array A tömb, amibe pakolni kell.
 * @param {Object} item A vizsgálandó elem.
 * @param {Function} accessor Az azonosság ellenőrzéséhez használandó függvény.
 * @param {Number} score Az elem pontszáma: mennyire jól különbözet meg reportokat.
 * @returns {Array} A módosított tömb.
 */
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

/**
 * Kiveszi a reportokat tartalmazó tömbből azokat, amelyek kulcsszavai
 * között egy adott kulcsszó szerepel. Új tömböt ad vissza, az eredetit
 * nem bántja.
 * 
 * @param {Array} inputArray A reportokat tartalmazó tömb.
 * @param {String} key A kivevendő kulcsszó.
 * @returns {Array} A kulcsszavat nem tartalmazó reportok tömbje.
 */
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

/**
 * A reportok metájából meghatározza a megjelenítendó kártyák metáit:
 * csoportokat képez, hozzáadja a kpi-ket.
 * 
 * @param {Object} superMeta Az összes reportot tartalmazó meta.
 * @returns {Object} A megjelenítendő kártyák adatai.
 */
CardPanel.prototype.createData = function(superMeta) {    
    var filteredData = this.applyFilters(superMeta);

    var maxCards = Math.min(global.panelNumberOnScreen * 2 * 3, this.maxCards);    
    maxCards = 6;
        
    var filteredDataForCards = this.createGrouping([...filteredData], maxCards);
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

/**
 * Hozzáadja a kpi-ket az összes report metájához.
 * 
 * @param {type} cardSuperMeta Az összes report metája.
 * @returns {undefined}
 */
CardPanel.prototype.addKpiToReports = function(cardSuperMeta) {
    for (var i = 0, iMax = cardSuperMeta.length; i < iMax; i++) {
        cardSuperMeta[i].kpiToShow = this.kpiToShow(cardSuperMeta[i]);
    }
};

/**
 * Egy adatsorból meghatározza a kpi-ként megmutatandó értéket, labelt,
 * egységet.
 * 
 * @param {Object} reportmeta Nyers reportmenta.
 * @returns {Object} Az értéket, labelt, egységet tartalmazó objetum.
 */
CardPanel.prototype.kpiToShow = function(reportmeta) {
    
    // Ha mappáról van szó, a kpi a benne levő elemek száma
    if (reportmeta.collector) {
        return {value: reportmeta.multiplicity, originalValue: reportmeta.multiplicity, unit: ""};
    }
    
    // Megpróbáljuk a valódi kpi-t meghatározni
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
    
    // Ha nem sikerül, akkor a report nevének rövidítését rakjuk oda.
    } catch(e) {        
        return {value: global.cleverAbbreviate(global.getFromArrayByLang(reportmeta.labels).caption), originalValue: "", unit: "", label: undefined};
    }
};


//////////////////////////////////////////////////
// Rajzolási folyamat függvényei
//////////////////////////////////////////////////

/**
 * Feltölti a panelt a supermetában megkapott dinamikus tartalommal.
 * Nyelvváltás esetén elég ezt lefuttatni.
 * 
 * @returns {undefined}
 */
CardPanel.prototype.initPanel = function() {
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
                if (!d.collector && d.kpiToShow && d.kpiToShow.label) {                    
                    return "<html><h4>" + d.kpiToShow.label + ": <em>" + d.kpiToShow.value + " " + d.kpiToShow.unit + "</em></h4></html>";
                }
            })
            .on("click", function(d) {
                d3.event.stopPropagation();
                if (d.collector) {
                    that.addKeyword(d.name, d3.event);
                } else {
                    d3.select(this).attr("class", "card listener clicked");
                    that.showReport(d, d3.event);
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

/**
 * A mappába belefúrás eseménykezelője. A mappa kulcsszavát hozzáadja a
 * kulcsszavak listájához, és levezényli az animációkat.
 * 
 * @param {type} keyword A hozzáadandó kulcsszó.
 * @param {type} event A kattintás esemény.
 * @returns {undefined}
 */
CardPanel.prototype.addKeyword = function(keyword, event) {
    const transition = d3.transition().duration(global.selfDuration);
    if (keyword) {
        global.tooltip.kill();
        global.keywordFilters[this.panelSide].push(keyword);        
        global.cloneAndZoom(event, this.tableScrollPane.node(), transition, 10);
    }
    this.table.selectAll(".card").remove();
    this.initPanel();
    if (keyword) {
        global.zoom(event, this.tableScrollPane.node(), transition, 0.1); 
    }
};

/**
 * A mappából kifúrás eseménykezelője. A mappa kulcsszavát kiveszi a
 * kulcsszavak listájából, és levezényli az animációkat.
 * 
 * @param {type} event A kattintás esemény.
 * @returns {undefined}
 */
CardPanel.prototype.popKeyword = function(event) {
    if (global.keywordFilters[this.panelSide].length > 0) {
        global.tooltip.kill();
        const transition = d3.transition().duration(global.selfDuration);
        global.cloneAndZoom(event, this.tableScrollPane.node(), transition, 0.1);
        global.keywordFilters[this.panelSide].pop();
        this.table.selectAll(".card").remove();
        this.initPanel();    
        global.zoom(event, this.tableScrollPane.node(), transition, 10);
    }
};

/**
 * Kiválasztja azokat a reportokat, amelyeknek a pillanatnyi keresőkritériumok
 * alapján meg kell jelenniük.
 * 
 * @param {type} meta Az összes report egyesített metája.
 * @returns {Array} A megjelenítendő reportok metáját tartalmazó tömb.
 */
CardPanel.prototype.applyFilters = function(meta) {
    const that = this;
    
    var result = [];
    
    for (var i = 0, iMax = meta.length; i < iMax; i++) {
        const rep = meta[i];
        
        var ok = true;        
        for (var f = 0, fMax = global.keywordFilters[that.panelSide].length; f < fMax; f++) {
            const keyword = global.keywordFilters[that.panelSide][f];
            if (rep.keywords.findIndex((element) => element.name === keyword) === -1) {
                ok = false;
                break;
            }
        }
                                
        if (ok) {
            if (this.getSearchString(rep).indexOf(global.textFilter[that.panelSide].toLowerCase()) > -1) {
                result.push(rep);
            }
        }
    }
            
    return result;
};

/**
 * Összeállítja a reporthoz azt a string-et, amiben a keresőmezőbe beírt
 * részletet keresni kell.
 * 
 * @param {type} reportmeta A jelentés metája.
 * @returns {String} A string, amelyben keresni kell.
 */
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
 * @param {Object} event a klikkelés event, ha van.
 * @returns {undefined}
 */
CardPanel.prototype.showReport = function(reportMeta, event) {
    var that = this;

    // Megöljük az eseménykezelőket.
    that.killListeners();
    global.tooltip.kill();
    that.divTableBase.select("#searchP" + that.panelSide).on("keyup", null);
    const transition = d3.transition().duration(global.selfDuration);
    
    const clickedCardNode = d3.select(".card.clicked").node();
    var fakeEvent;
    
    const scaleRatio = parseFloat(d3.select(".container.activeSide").attr("style").replaceAll(/.*scale\(/g, ""));
        
    if (clickedCardNode !== null) {
        const offset = clickedCardNode.getClientRects()[0];
        fakeEvent = {
            clientX: scaleRatio * (offset.x + offset.width/2),
            clientY: scaleRatio * (offset.y + offset.height/2)
        };
    }
    global.cloneAndZoom(fakeEvent, d3.select("#scrollPaneP" + that.panelSide).node(), transition, 15 / scaleRatio);
    that.mediator.publish("newreport", that.panelSide, reportMeta);
};