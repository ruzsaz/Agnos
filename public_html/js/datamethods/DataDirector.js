/* global d3 */

'use strict';

/**
 * Egy oldal adatfolyamát intéző osztály.
 *  
 * @param {Integer} side Az oldal (0 vagy 1).
 * @param {Object} mediator Az oldal mediátora.
 * @returns {DataDirector}
 */
function DataDirector(side, mediator) {
    var that = this;

    this.side = side;
    this.mediator = mediator;
    this.panelRoster = [];
    this.drillLock = false; // Ha true, nem lehet fúrni.    

    // Feliratkozás a regisztráló, és a fúró mediátorra.
    that.mediator.subscribe("register", function(context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction) {
        that.register(context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction);
    });
    that.mediator.subscribe("drill", function(drill) {
        if (!that.drillLock || drill.onlyFor !== undefined) {
            that.drillLock = true;
            that.drill(drill);            
        }
    });
    that.mediator.subscribe("controlChange", function(duration) {
        that.controlChange(duration);                    
    });
    
    // Feliratkozás a panel konfigurációját elkérő mediátorra.
    that.mediator.subscribe("getConfig", function(callback) {
        that.getConfigs(callback);
    });
    this.cubePreparationRequired = true;
    
    this.currentData;
}

/**
 * Regisztrál, vagy töröl egy panelt. Ha már regisztrálva van, felülírja az előző regisztrációt.
 * 
 * @param {Object} context A panel objektum. Ha undefined, akkor töröl.
 * @param {Integer} panelId A panel azonosítója.
 * @param {Array} dimsToShow A panel által mutatott dimenziók. (0: nem mutatja, 1: mutatja.)
 * @param {Function} preUpdateFunction A panel klikkeléskor végrehajtandó függvénye.
 * @param {Function} updateFunction Az új adat megérkezésekor meghívandó függvény.
 * @param {Function} getConfigFunction A panel konfigurációját lekérdező függvény.
 * @returns {undefined}
 */
DataDirector.prototype.register = function(context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction) {
    // Ha már regisztrálva van ilyen panelId-jű, akkor azt kell majd kicserélni.
    var oldPosition = global.positionInArrayByProperty(this.panelRoster, "panelId", panelId);

    // Ha nem törölni kell, akkor cseréljük, vagy ha még nem volt ilyen, akkor hozzáadjuk.
    if (context !== undefined) {
        if (oldPosition === -1) {
            oldPosition = this.panelRoster.length;
        }
        var ds = [];
        for (var d = 0, dMax = global.facts[this.side].reportMeta.dimensions.length; d < dMax; d++) {
            ds.push((dimsToShow.indexOf(d) > -1) ? 1 : 0);
        }

        this.panelRoster[oldPosition] = {
            context: context,
            panelId: panelId,
            dimsToShow: ds,
            preUpdateFunction: preUpdateFunction,
            updateFunction: updateFunction,
            getConfigFunction: getConfigFunction,
            data: undefined
        };

        // Ha törölni kell, akkor kiszedjük a tömbből.
    } else {
        if (oldPosition >= 0) {
            this.panelRoster.splice(oldPosition, 1);
        }
    }
};

/**
 * Visszaadja az első szabad panelpozíció indexét.
 * 
 * @returns {Number} Az első szabad index.
 */
DataDirector.prototype.getFirstFreeIndex = function() {
    for (var index = 0; index < global.maxPanelCount; index++) {
        var panelId = "#panel" + this.side + "P" + index;
        if (global.positionInArrayByProperty(this.panelRoster, "panelId", panelId) === -1) {
            return index;
        }
    }
    return -1;
};

/**
 * Megtippeli, hogy egy új panel számára melyik lehet a legalkalmasabb dimenzió.
 * Arra tippel, ami a már meglevő panelekben a legkevesebbszer szerepel.
 * 
 * @param {Number} exceptDim Ha megadjuk, ez a dimenzió az utolsó lesz a lehetségesek között.
 * Ezt 2 dimenziót ábrázoló panelek második dimenziójának megtippelésekor kell használni.
 * @returns {Number} A tippelt dimenzió sorszáma.
 */
DataDirector.prototype.guessDimension = function(exceptDim) {
    var meta = global.facts[this.side].localMeta;
    var bestDim = -1;
    var bestDimScore = 10000;
    for (var d = 0, dMax = meta.dimensions.length; d < dMax; d++) {
        var score = (d === exceptDim) ? 1000 + d / 100 : d / 100;
        for (var p = 0, pMax = this.panelRoster.length; p < pMax; p++) {
            score += this.panelRoster[p].dimsToShow[d];
        }
        if (score < bestDimScore) {
            bestDim = d;
            bestDimScore = score;
        }
    }
    return bestDim;
};

/**
 * Keres egy ábrázolható value-t. (Aminek vagy a val-ja vagy a frac-ja nem hidden.)
 * 
 * @returns {Number} Egy ábrázolható value indexe, vagy 0 ha nincs ilyen.
 */
DataDirector.prototype.guessValue = function() {
    var meta = global.facts[this.side].localMeta;
    for (var i = 0, iMax = meta.indicators.length; i < iMax; i++) {
        if (meta.indicators[i].isShown) {
            return i;
        }
    }
    return 0;
};

/**
 * Visszaadja az épp használatban levő normál panelek számát.
 * 
 * @returns {Number} A haszálatban levő normál panelek száma.
 */
DataDirector.prototype.getNumberOfPanels = function() {
    return this.panelRoster.length;
};

/**
 * Fúrást végző függvény. Beállítja a szűrési-fúrási szűrőket, és ha a fúrás végrehajtjató,
 * meghívja a panelek preupdate függvényeit, majd elindítja az új adat begyűjtését.
 * 
 * @param {Object} drill A fúrás objektum.
 * @returns {undefined}
 */
DataDirector.prototype.drill = function(drill) {    
    var that = this;
    var isSuccessful = false;
    var dim = drill.dim;
    var baseDim = (global.baseLevels[that.side])[dim];
    if (drill.direction === -1) {
        if (drill.toId !== undefined && baseDim.length < global.facts[that.side].localMeta.dimensions[dim].levels - 1) {
            isSuccessful = true;
            drill.fromId = (baseDim.length === 0) ? null : (baseDim[baseDim.length - 1]).id;
            baseDim.push({id: drill.toId, name: drill.toName});
        }
    } else if (drill.direction === 1) {        
        if (baseDim.length > 0) {
            isSuccessful = true;
            drill.fromId = (baseDim[baseDim.length - 1]).id;
            baseDim.pop();
            drill.toId = (baseDim.length === 0) ? null : (baseDim[baseDim.length - 1]).id;
        }
    } else if (drill.direction === 0) {
        isSuccessful = true;
    }
    if (isSuccessful) {
        that.requestNewData(drill);
        that.initiatePreUpdates(drill);                
    } else {
        that.drillLock = false;
    }   
};

/**
 * Makes the changes on the screen after a control's value changed.
 * 
 * @param {Number} duration Duration of the animation in milliseconds.
 * @returns {undefined}
 */
DataDirector.prototype.controlChange = function(duration) {
    this.calculate(this.currentData);        
    const drill = {dim: -1, direction: 0, duration: duration};    
    this.notifyAllPanelsOnChange(this.currentData, drill);
    this.drillLock = false;
};

/**
 * Meghívja az összes panel preupdate-függvényét.
 * 
 * @param {Object} drill A fúrás objektum.
 * @returns {undefined}
 */
DataDirector.prototype.initiatePreUpdates = function(drill) {
    for (var i = 0, iMax = this.panelRoster.length; i < iMax; i++) {
        this.panelRoster[i].preUpdateFunction.call(this.panelRoster[i].context, this.getPanelDrill(i, drill));
    }
};

/**
 * Lefúrás után új adatot szerez be az olap kockából.
 * Az adat megérkeztekor kiosztja a panelek update-függvényének.
 * 
 * @param {Object} drill A lefúrás objektum.
 * @returns {undefined}
 */
DataDirector.prototype.requestNewData = function(drill) {
    var that = this;

    var baseVector = [];
    for (var d = 0, dMax = (global.baseLevels[that.side]).length; d < dMax; d++) {
        var baseVectorCoordinate = {};
        baseVectorCoordinate.name = global.facts[that.side].reportMeta.dimensions[d].name;
        baseVectorCoordinate.levelValues = [];
        for (var l = 0, lMax = (global.baseLevels[that.side])[d].length; l < lMax; l++) {
            baseVectorCoordinate.levelValues.push(((global.baseLevels[that.side])[d])[l].id); 
        }
        baseVector.push(baseVectorCoordinate);
    }

    var queriesStamp = [];
    var queries = [];
    for (var p = 0, pMax = this.panelRoster.length; p < pMax; p++) {
        const elementStamp = this.panelRoster[p].dimsToShow.toString().replace(/,/g, ":");
        queriesStamp.push(elementStamp);
        
        // If it is a new query according to the stamp, put it into the query array,
        // so queries in the array will be unique.
        if (queriesStamp.indexOf(elementStamp) === queriesStamp.length - 1) {
            var query = [];
            for (var dts = 0, dtsMax = global.facts[this.side].reportMeta.dimensions.length; dts < dtsMax; dts++) {
                if (this.panelRoster[p].dimsToShow[dts] === 1) {
                    query.push(global.facts[this.side].reportMeta.dimensions[dts].name);
                }
            }
            queries.push({"dimsToDrill" : query});
        }
    }

    var requestObject = {
        "reportName" : global.facts[that.side].reportMeta.name,
        "baseVector": baseVector,
        "drillVectors": queries,
        "isCubePreparationRequired": that.cubePreparationRequired
    };
    that.cubePreparationRequired = false;
    const encodedQuery = "queries=" + window.btoa(encodeURIComponent((JSON.stringify(requestObject))));
    // A letöltés élesben.
    global.get(global.url.fact, encodedQuery, function(result) {        
        that.processNewData(drill, result);
        that.drillLock = false;
    });
};

/**
 * Szétosztja az új adatot a panelek számára, és meghívja a panelek update függvényét.
 * 
 * @param {Object} drill A fúrás objektum.
 * @param {Object} newDataJson Az új, ömelsztett adat.
 * @returns {undefined}
 */
DataDirector.prototype.processNewData = function(drill, newDataJson) {
    const newData = newDataJson.answer;
    for (var i = 0, iMax = newData.length; i < iMax; i++) {
        newData[i].name = newData[i].richName.replace(/(?<=:|^)[^:][^:]+(?=:|$)/g, '1');
    }    
    this.storeOrigValues(newData);
    this.localizeNewData(newData);    
    this.calculate(newData);
    this.currentData = newData;    
    this.notifyAllPanelsOnChange(newData, drill);
};

/**
 * Calculates the actual value of the calculated indicators. It modifies the
 * data object received on input.
 * 
 * @param {Object} data The data object containing the input values.
 * @returns {undefined}
 */
DataDirector.prototype.calculate = function(data) {
    const meta = global.facts[this.side].localMeta;
    
    // Determine the control values
    const controlValues = global.facts[this.side].controlValues;    
       
    for (var i = 0, iMax = meta.indicators.length; i < iMax; i++) {
        const valueFunction = meta.indicators[i].value.function;
        if (typeof valueFunction === "function") {
            this.applyFunction(data, controlValues, valueFunction, i, "sz");
        }
        const fractionFunction = meta.indicators[i].fraction.function;
        if (typeof fractionFunction === "function") {
            this.applyFunction(data, controlValues, fractionFunction, i, "n");
        }
    }    
};

/**
 * Calls the panels' registered update functions after a data change (drill or
 * calculation from a new input).
 * 
 * @param {Object} newData New data object.
 * @param {Object} drill The drill that started the data change.
 * @returns {undefined}
 */
DataDirector.prototype.notifyAllPanelsOnChange = function(newData, drill) {            
    for (var i = 0, iMax = this.panelRoster.length; i < iMax; i++) {
        var pos = global.positionInArrayByProperty(newData, "name", this.panelRoster[i].dimsToShow.toString().replace(/,/g, ":"));
        var data = newData[pos].response;
        if (drill.onlyFor === undefined || drill.onlyFor === this.panelRoster[i].panelId) {
            this.panelRoster[i].updateFunction.call(this.panelRoster[i].context, data, this.getPanelDrill(i, drill));
        }
    }   
    global.getConfig2();    
};

/**
 * Stores the original (without calculations applied) values of the indicators.
 * Should be called before applying the calculations. It modifies the received
 * data object.
 * 
 * @param {Object} data The data object to process.
 * @returns {undefined}
 */
DataDirector.prototype.storeOrigValues = function(data) {
    for (var a = 0, aMax = data.length; a < aMax; a++) {
        const answer = data[a].response;
        for (var r = 0, rMax = answer.rows.length; r < rMax; r++) {
            const row = answer.rows[r];
            const vals = row.vals;
            row.origVals = [];
            for (var v = 0, vMax = vals.length; v < vMax; v++) {
                const val = vals[v];
                row.origVals.push({"sz": val.sz, "n": val.n});
            }            
        }
    }
};

/**
 * Applies a function to calculate the calculated values. It should have 3
 * arrays as inputs: d[] as the dimensions' values, i[] as the indicators'
 * values and c[] as the controls' values.
 * The result will be stored in the received data object.
 * 
 * @param {Object} data The data object to process.
 * @param {Array} controlValues Array of the actual control values.
 * @param {Function} func Function to calculate the calculated value.
 * @param {Number} index Index of the value to calculate.
 * @param {String} position "sz" or "n" to calculate the számláló or nevező.
 * @returns {undefined}
 */
DataDirector.prototype.applyFunction = function(data, controlValues, func, index, position) {
    for (var a = 0, aMax = data.length; a < aMax; a++) {
        const answer = data[a].response;
        for (var r = 0, rMax = answer.rows.length; r < rMax; r++) {
            const row = answer.rows[r];
            const d = row.dims;
            const i = row.origVals;
            const c = controlValues;
            row.vals[index][position] = func(d, c, i);            
        }
    }    
};


/**
 * Localizes the "name" dimension attributes in the raw data.
 * There is no return value, the input data is changed.
 * 
 * @param {type} newData New data to process
 * @returns {undefined} 
 */
DataDirector.prototype.localizeNewData = function(newData) {

    
    for (var i = 0, iMax = newData.length; i < iMax; i++) {
        
        const panelData = newData[i];
        
        const currentLang = String.locale;
        const dimIndexKey = panelData.name.split(":");
        const dictToUse = [];
        for (var dki = 0, dkiMax = dimIndexKey.length; dki < dkiMax; dki++) {
            if(dimIndexKey[dki] === '1') {
                const origLang = global.facts[this.side].reportMeta.dimensions[dki].lang;                                
                dictToUse.push(global.dictionaries[this.side].getDictionary(origLang, currentLang));
            }
        }        
        
        const rows = panelData.response.rows;
        for (var r = 0, rMax = rows.length; r < rMax; r++) {
            const dims = rows[r].dims;
            for (var d = 0, dMax = dims.length; d < dMax; d++) {
                const name = dims[d].name;
                const lookup = dictToUse[d][name];
                dims[d].name = (lookup === undefined) ? _(dims[d].name) : lookup;            
            }
        }
    }   
};

/**
 * Az aktuális drill-objektumból elkészíti a panel számára szólót, amely
 * már csak a panel számára is érdekes fúrást tartalmazza.
 * 
 * @param {Integer} i A panel azonosítója.
 * @param {Object} drill A fúrás objektum.
 * @returns {Object} A panel számára érdekes fúrás objektum.
 */
DataDirector.prototype.getPanelDrill = function(i, drill) {
    var panelDrill = {
        dim: drill.dim,
        direction: (this.panelRoster[i].dimsToShow[drill.dim] === 1) ? drill.direction : 0,
        fromId: drill.fromId,
        toId: drill.toId,
        duration: drill.duration
    };
    return panelDrill;
};

/**
 * Lekérdezi az oldalon lévő panelek pillanatnyi konfigurációját létrehozó
 * konfigurációs parancsot.
 * 
 * @param {Function} callback A visszahívandó függvény. Ha undefined, a konzolra írja.
 * @returns {undefined}
 */
DataDirector.prototype.getConfigs = function(callback) {
    var configs = "";
    var separator = "";

    // Egyesével elkéri a panelek konfigurőciós szkriptjét, és ;-vel elválasztottan összegyűjti.    
    // Fontos: nem a panelroster sorrendjében, hanem a képernyőn megjelenés sorrendjében kell végigmenni.
    var panels = d3.selectAll("#container" + this.side + " .panel.single:not(.dying)").nodes();
    for (var i = 0, iMax = panels.length; i < iMax; i++) {
        var panelId = "#" + d3.select(panels[i]).attr('id');
        var p = global.getFromArrayByProperty(this.panelRoster, "panelId", panelId);
        if (p && typeof p.getConfigFunction === 'function') {
            configs = configs + separator + p.getConfigFunction.call(p.context);
            separator = ";";
        }
    }

    // Ha callbackolni kell, íme.
    if (typeof callback === 'function') {
        var configObject = {};
        if (global.facts[this.side] && global.facts[this.side].localMeta) {
            configObject.s = this.side; // Az oldal, amire vonatkozik (0 vagy 1).
            configObject.c = global.facts[this.side].localMeta.cube_unique_name; // A cube neve.
            configObject.b = global.baseLevels[this.side]; // A bázisszintek, amire épp lefúrva van.
            configObject.i = global.facts[this.side].controlValues; // Actual value of the controls.
            configObject.v = global.minifyInits(configs); // A panelek init sztringje, minifyolva.
        }
        callback(configObject);
    } else {        
        var collector = "[ ";
        var sep0 = "";
        const baseArray = global.baseLevels[this.side];
        for (var i = 0, iMax = baseArray.length; i < iMax; i++) {
            collector += sep0 + "[";                    
            var sep1 = "";
            for (var j = 0, jMax = baseArray[i].length; j < jMax; j++) {
                collector += sep1 + "'" + baseArray[i][j].id + "'";
                sep1 = ", ";
            }
            collector += "]";
            sep0 = ", ";
        }
        collector += " ]";
        console.log(((this.side === 0) ? "Left side panels: " : "Right side panels: ") + configs);
        console.log("          base drill: " + collector);        
    }
};