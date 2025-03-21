/* global d3 */

'use strict';

/**
 * Egy oldal adatfolyamát intéző osztály.
 *  
 * @param {int} side Az oldal (0 vagy 1).
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
    
    this.currentData = undefined;
}

/**
 * Regisztrál, vagy töröl egy panelt. Ha már regisztrálva van, felülírja az előző regisztrációt.
 * 
 * @param {Object} context A panel objektum. Ha undefined, akkor töröl.
 * @param {int} panelId A panel azonosítója.
 * @param {Array} dimsToShow A panel által mutatott dimenziók. (0: nem mutatja, 1: mutatja.)
 * @param {Function} preUpdateFunction A panel klikkeléskor végrehajtandó függvénye.
 * @param {Function} updateFunction Az új adat megérkezésekor meghívandó függvény.
 * @param {Function} getConfigFunction A panel konfigurációját lekérdező függvény.
 * @returns {undefined}
 */
DataDirector.prototype.register = function(context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction) {
    // Ha már regisztrálva van ilyen panelId-jű, akkor azt kell majd kicserélni.
    let oldPosition = global.positionInArrayByProperty(this.panelRoster, "panelId", panelId);

    // Ha nem törölni kell, akkor cseréljük, vagy ha még nem volt ilyen, akkor hozzáadjuk.
    if (context !== undefined) {
        if (oldPosition === -1) {
            oldPosition = this.panelRoster.length;
        }
        const ds = [];
        for (let d = 0, dMax = global.facts[this.side].reportMeta.dimensions.length + global.facts[this.side].reportMeta.controls.length; d < dMax; d++) {
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
 * @returns {int} Az első szabad index.
 */
DataDirector.prototype.getFirstFreeIndex = function() {
    for (let index = 0; index < global.maxPanelCount; index++) {
        const panelId = "#panel" + this.side + "P" + index;
        if (global.positionInArrayByProperty(this.panelRoster, "panelId", panelId) === -1) {
            return index;
        }
    }
    return -1;
};

/**
 * Predicts the most suitable dimension for a new panel.
 * It guesses the one that appears the least frequently among the existing panels.
 *
 * @param {Array} exceptions If specified, this dimensions will be the last among the possible ones.
 * This should be used when predicting the second dimension for panels representing two dimensions.
 * @returns {int} The index of the predicted dimension.
 */
DataDirector.prototype.guessDimension = function(exceptions = []) {
    const meta = global.facts[this.side].localMeta;
    let bestDim = -1;
    let bestDimScore = 10000;
    for (let d = 0, dMax = meta.dimensions.length; d < dMax; d++) {
        let score = (exceptions.indexOf(d) !== -1) ? 1000 + d / 100 : d / 100;
        for (let p = 0, pMax = this.panelRoster.length; p < pMax; p++) {
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
 * Looking for a representable value. (One whose val or frac is not hidden.)
 *
 * @param {Array} exceptions Value indexes to skip.
 * @returns {int} A representable value's index, or 0 if there is none.
 */
DataDirector.prototype.guessValue = function(exceptions = []) {
    const meta = global.facts[this.side].localMeta;
    for (let i = 0, iMax = meta.indicators.length; i < iMax; i++) {
        if (meta.indicators[i].isShown && (exceptions === undefined || exceptions.indexOf(i) === -1)) {
            return i;
        }
    }
    return 0;
};

/**
 * Returns the number of currently active normal panels.
 * 
 * @returns {int} The number of normal panels in use.
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
    const that = this;

    let isSuccessful = false;
    const dim = drill.dim;

    // If the drill is a control, then set the desired controls value
    if (drill.dim > global.facts[that.side].reportMeta.dimensions.length - 1) {
        if (drill.direction === -1) {
            const controlNumber = drill.dim - global.facts[that.side].reportMeta.dimensions.length;
            const headPanelId = "#panel" + that.side + "P-1";
            const headPanel = (that.panelRoster.find(panel => panel.panelId === headPanelId)).context;
            const controlObject = headPanel.controlElements[controlNumber];
            controlObject.setValue(drill.toId);
            that.initiatePreUpdates(drill);
        }
    } else {
        const baseDim = (global.baseLevels[that.side])[dim];
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
    for (let i = 0, iMax = this.panelRoster.length; i < iMax; i++) {
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
    const that = this;
    const baseVector = [];
    for (let d = 0, dMax = (global.baseLevels[that.side]).length; d < dMax; d++) {
        const baseVectorCoordinate = {};
        baseVectorCoordinate.name = global.facts[that.side].reportMeta.dimensions[d].name;
        baseVectorCoordinate.levelValues = [];
        for (let l = 0, lMax = (global.baseLevels[that.side])[d].length; l < lMax; l++) {
            baseVectorCoordinate.levelValues.push(((global.baseLevels[that.side])[d])[l].id); 
        }
        baseVector.push(baseVectorCoordinate);
    }
    const queriesStamp = [];
    const queries = [];
    for (let p = 0, pMax = this.panelRoster.length; p < pMax; p++) {
        const elementStamp = this.panelRoster[p].dimsToShow.slice(0, baseVector.length).toString().replace(/,/g, ":");
        queriesStamp.push(elementStamp);
        
        // If it is a new query according to the stamp, put it into the query array,
        // so queries in the array will be unique.
        if (queriesStamp.indexOf(elementStamp) === queriesStamp.length - 1) {
            const query = [];
            for (let dts = 0, dtsMax = global.facts[this.side].reportMeta.dimensions.length; dts < dtsMax; dts++) {
                if (this.panelRoster[p].dimsToShow[dts] === 1) {
                    query.push(global.facts[this.side].reportMeta.dimensions[dts].name);
                }
            }
            queries.push({"dimsToDrill" : query});
        }
    }

    const requestObject = {
        "reportName": global.facts[that.side].reportMeta.name,
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
    for (let i = 0, iMax = newData.length; i < iMax; i++) {
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
       
    for (let i = 0, iMax = meta.indicators.length; i < iMax; i++) {
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
 * @param {Array} newData New data object.
 * @param {Object} drill The drill that started the data change.
 * @returns {undefined}
 */
DataDirector.prototype.notifyAllPanelsOnChange = function(newData, drill) {
    const realDimensions = global.facts[this.side].reportMeta.dimensions.length;
    for (let i = 0, iMax = this.panelRoster.length; i < iMax; i++) {
        const pos = global.positionInArrayByProperty(newData, "name", this.panelRoster[i].dimsToShow.slice(0, realDimensions).toString().replace(/,/g, ":"));
        const data = newData[pos].response;
        const enrichedData = this.enrichDataWithControlDimensions(data, this.panelRoster[i].dimsToShow);
        this.calculate(enrichedData);
        if (drill.onlyFor === undefined || drill.onlyFor === this.panelRoster[i].panelId) {
            this.panelRoster[i].updateFunction.call(this.panelRoster[i].context, enrichedData, this.getPanelDrill(i, drill));
        }
    }   
    global.getConfig2();    
};

DataDirector.prototype.enrichDataWithControlDimensions = function(data, dimsToShow) {
    const that = this;
    const meta = global.facts[this.side].reportMeta;
    const headPanelId = "#panel" + that.side + "P-1";
    const headPanel = (this.panelRoster.find(panel => panel.panelId === headPanelId)).context;
    const controlsAsDim = [];
    const controlsAsIndex = [];
    for (let i = 0, iMax = meta.controls.length; i < iMax; i++) {
        if (dimsToShow[meta.dimensions.length + i] === 1) {
            controlsAsDim.push(meta.controls[i]);
            controlsAsIndex.push(i);
        }
    }

    for (let c = 0, cMax = controlsAsDim.length; c < cMax; c++) {
        const controlObject = headPanel.controlElements[controlsAsIndex[c]];
        const possibleControlValues = controlObject.getPossibleControlValuesAsArray();
        const newData = {'rows': []};
        for (let r = 0, rMax = data.rows.length; r < rMax; r++) {
            const row = data.rows[r];
            possibleControlValues.forEach(function(controlValue) {
                const newRow = JSON.parse(JSON.stringify(row));
                if (newRow.controls === undefined) {
                    newRow.controls = [];
                    for (let i = 0, iMax = global.facts[that.side].controlValues.length; i < iMax; i++) {
                        newRow.controls[i] = global.facts[that.side].controlValues[i];
                    }
                }
                newRow.controls[controlsAsIndex[c]] = controlValue.value;
                newRow.dims.push({'id': controlValue.value + '', 'name': controlValue.label + ''}); // TODO: formázottan kéne sztringgé, legalább az egyiket?
                newData.rows.push(newRow);
            });
        }
        data = newData;
    }

    const localMeta = global.facts[this.side].localMeta;

    for (let i = 0, iMax = localMeta.indicators.length; i < iMax; i++) {

        const valueFunction = localMeta.indicators[i].value.function;
        if (typeof valueFunction === "function") {
            this.applyFunction2(data, valueFunction, i, "sz");
        }
        const fractionFunction = localMeta.indicators[i].fraction.function;
        if (typeof fractionFunction === "function") {
            this.applyFunction2(data, fractionFunction, i, "n");
        }
    }

    return data;
}

DataDirector.prototype.getPossibleControlValuesAsArray = function(parameters) {
    if (parameters === undefined) {
        return [];
    }
    if (parameters.values !== undefined) {
        return parameters.values;
    }
    if (parameters.min !== undefined || parameters.max !== undefined || parameters.step !== undefined) {
        const values = [];
        for (let i = parameters.min; i <= parameters.max; i += parameters.step) {
            values.push(i);
        }
        return values;
    }
}

DataDirector.prototype.applyFunction2 = function(data, func, index, position) {
        for (let r = 0, rMax = data.rows.length; r < rMax; r++) {
            const row = data.rows[r];
            const D = row.dims;
            const c = row.controls || global.facts[this.side].controlValues;
            const v = row.origVals.map(element => element.sz);
            const d = row.origVals.map(element => element.n);
            row.vals[index][position] = func(D, c, v, d);
        }
};


/**
 * Stores the original (without calculations applied) values of the indicators.
 * Should be called before applying the calculations. It modifies the received
 * data object.
 * 
 * @param {Array} data The data object to process.
 * @returns {undefined}
 */
DataDirector.prototype.storeOrigValues = function(data) {
    for (let a = 0, aMax = data.length; a < aMax; a++) {
        const answer = data[a].response;
        for (let r = 0, rMax = answer.rows.length; r < rMax; r++) {
            const row = answer.rows[r];
            const vals = row.vals;
            row.origVals = [];
            for (let v = 0, vMax = vals.length; v < vMax; v++) {
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
 * @param {Array} data The data object to process.
 * @param {Array} controlValues Array of the actual control values.
 * @param {Function} func Function to calculate the calculated value.
 * @param {int} index Index of the value to calculate.
 * @param {String} position "sz" or "n" to calculate the számláló or nevező.
 * @returns {undefined}
 */
DataDirector.prototype.applyFunction = function(data, controlValues, func, index, position) {
    for (let a = 0, aMax = data.length; a < aMax; a++) {
        const answer = data[a].response;
        for (let r = 0, rMax = answer.rows.length; r < rMax; r++) {
            const row = answer.rows[r];
            const D = row.dims;
            const c = controlValues;
            const v = row.origVals.map(element => element.sz);
            const d = row.origVals.map(element => element.n);
            row.vals[index][position] = func(D, c, v, d);
        }
    }    
};


/**
 * Localizes the "name" dimension attributes in the raw data.
 * There is no return value, the input data is changed.
 * 
 * @param {Array} newData New data to process
 * @returns {undefined} 
 */
DataDirector.prototype.localizeNewData = function(newData) {

    
    for (let i = 0, iMax = newData.length; i < iMax; i++) {
        
        const panelData = newData[i];
        
        const currentLang = String.locale;
        const dimIndexKey = panelData.name.split(":");
        const dictToUse = [];
        for (let dki = 0, dkiMax = dimIndexKey.length; dki < dkiMax; dki++) {
            if(dimIndexKey[dki] === '1') {
                const origLang = global.facts[this.side].reportMeta.dimensions[dki].lang;                                
                dictToUse.push(global.dictionaries[this.side].getDictionary(origLang, currentLang));
            }
        }        
        
        const rows = panelData.response.rows;
        for (let r = 0, rMax = rows.length; r < rMax; r++) {
            const dims = rows[r].dims;
            for (let d = 0, dMax = dims.length; d < dMax; d++) {
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
 * @param {int} i A panel azonosítója.
 * @param {Object} drill A fúrás objektum.
 * @returns {Object} A panel számára érdekes fúrás objektum.
 */
DataDirector.prototype.getPanelDrill = function(i, drill) {
    return {
        initiator: drill.initiator,
        dim: drill.dim,
        direction: (this.panelRoster[i].dimsToShow[drill.dim] === 1) ? drill.direction : 0,
        fromId: drill.fromId,
        toId: drill.toId,
        duration: drill.duration
    };
};

/**
 * Retrieves the configuration command that generates the current configuration
 * of the panels on the page.
 * 
 * @param {Function} callback A visszahívandó függvény. Ha undefined, a konzolra írja.
 * @returns {undefined}
 */
DataDirector.prototype.getConfigs = function(callback) {
    let configs = "";
    let separator = "";

    // Egyesével elkéri a panelek konfigurőciós szkriptjét, és ;-vel elválasztottan összegyűjti.    
    // Fontos: nem a panelroster sorrendjében, hanem a képernyőn megjelenés sorrendjében kell végigmenni.
    const panels = d3.selectAll("#container" + this.side + " .panel.single:not(.dying)").nodes();
    for (let i = 0, iMax = panels.length; i < iMax; i++) {
        const panelId = "#" + d3.select(panels[i]).attr('id');
        const p = global.getFromArrayByProperty(this.panelRoster, "panelId", panelId);
        if (p && typeof p.getConfigFunction === 'function') {
            configs = configs + separator + p.getConfigFunction.call(p.context);
            separator = ";";
        }
    }

    // Ha callbackolni kell, íme.
    if (typeof callback === 'function') {
        const configObject = {};
        if (global.facts[this.side] && global.facts[this.side].localMeta) {
            configObject.s = this.side; // Az oldal, amire vonatkozik (0 vagy 1).
            configObject.c = global.facts[this.side].localMeta.cube_unique_name; // A cube neve.
            configObject.b = global.baseLevels[this.side]; // A bázisszintek, amire épp lefúrva van.
            configObject.i = global.facts[this.side].controlValues; // Actual value of the controls.
            configObject.v = global.minifyInits(configs); // A panelek init sztringje, minifyolva.
        }
        callback(configObject);
    } else {
        let collector = "[ ";
        let sep0 = "";
        const baseArray = global.baseLevels[this.side];
        for (let i = 0, iMax = baseArray.length; i < iMax; i++) {
            collector += sep0 + "[";
            let sep1 = "";
            for (let j = 0, jMax = baseArray[i].length; j < jMax; j++) {
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