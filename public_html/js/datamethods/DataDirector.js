/* global d3, Mediator */

'use strict';

/**
 * Class to direct the data flow between a side's panels and the server.
 *
 * @param {int} side Side of the page (0 or 1).
 * @param {Mediator} mediator Mediator object to communicate with the panels.
 * @returns {DataDirector} The DataDirector object.
 */
function DataDirector(side, mediator) {
    const that = this;

    this.side = side;
    this.mediator = mediator;
    this.panelRoster = [];
    this.drillLock = false; // Lock to prevent multiple drill requests.

    // Subscribe to the panel registration, drill, control change, and config request events.
    that.mediator.subscribe("register", function (context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction) {
        that.register(context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction);
    })
    that.mediator.subscribe("drill", function (drill) {
        if (!that.drillLock || drill.onlyFor !== undefined) {
            that.drillLock = true;
            that.drill(drill);
        }
    });
    that.mediator.subscribe("controlChange", function (duration) {
        that.controlChange(duration);
    });
    that.mediator.subscribe("getConfig", function (callback) {
        that.getConfigs(callback);
    });

    this.cubePreparationRequired = true; // flag to indicate if cube preparation is needed at the server side
    this.currentData = undefined;   // stores the current data
}

/**
 * Registers or unregisters a panel. If it is registered already, it will be
 * changed.
 *
 * @param {Object} context Panel to register. If undefined, the panel will be removed.
 * @param {int} panelId The panel's id. It should be unique.
 * @param {Array} dimsToShow Dimensions the panel shows. (0: doesn't show, 1: shows.)
 * @param {Function} preUpdateFunction Function to execute when clicking on the panel.
 * @param {Function} updateFunction Function to call when new data arrives.
 * @param {Function} getConfigFunction Function to call when the panel's configuration is requested.
 * @returns {undefined}
 */
DataDirector.prototype.register = function (context, panelId, dimsToShow, preUpdateFunction, updateFunction, getConfigFunction) {
    // If panel with the same id is already registered, then this should be exchanged for it.
    let oldPosition = global.positionInArrayByProperty(this.panelRoster, "panelId", panelId);

    // If it shouldn't be deleted, then exchange or add it to the panel roster.
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

        // If it should be deleted, then remove it from the panel roster.
    } else {
        if (oldPosition >= 0) {
            this.panelRoster.splice(oldPosition, 1);
        }
    }
};

/**
 * Returns the first free index in the panel roster.
 *
 * @returns {int} First free index.
 */
DataDirector.prototype.getFirstFreeIndex = function () {
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
DataDirector.prototype.guessDimension = function (exceptions = []) {
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
DataDirector.prototype.guessValue = function (exceptions = []) {
    const meta = global.facts[this.side].localMeta;
    for (let i = 0, iMax = meta.indicators.length; i < iMax; i++) {
        if (meta.indicators[i].isShown && (exceptions === undefined || exceptions.indexOf(i) === -1)) {
            return i;
        }
    }
    return 0;
};

/**
 * Drilling function. Sets the filtering-drilling filters, and if the drilling is executable,
 * calls the pre-update functions of the panels, then starts the new data collection.
 *
 * @param {Object} drill The drill object.
 * @returns {undefined}
 */
DataDirector.prototype.drill = function (drill) {
    const that = this;
    let isSuccessful = false;
    const dim = drill.dim;

    // If it is a kaplanMeier dimension, allow drilling by replacing the current drill regardless of the level.
    // Clicking the currently displayed last period should be a no-op instead of reloading the same state.
    const dimension = global.facts[that.side].reportMeta.dimensions[dim];
    if (dimension !== undefined && dimension.kaplanMeier) {
        const baseDim = (global.baseLevels[that.side])[dim];
        const currentKaplanMeierValue = (baseDim.length > 0)
            ? (baseDim[baseDim.length - 1]).id
            : ((dimension.kaplanMeierValues !== undefined && dimension.kaplanMeierValues.length > 0)
                ? dimension.kaplanMeierValues[dimension.kaplanMeierValues.length - 1].id
                : undefined);

        if (drill.direction === -1 && drill.toId === currentKaplanMeierValue) {
            that.drillLock = false;
            return;
        }
        drill.replace = true;
    }

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
            if (drill.replace && drill.toId !== undefined && baseDim.length > 0) {
                isSuccessful = true;
                drill.fromId = (baseDim[baseDim.length - 1]).id;
                baseDim[baseDim.length - 1] = {id: drill.toId, name: drill.toName};
            } else if (drill.toId !== undefined && baseDim.length < global.facts[that.side].localMeta.dimensions[dim].levels - 1) {
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
DataDirector.prototype.controlChange = function (duration) {
    this.calculate(this.currentData);
    const drill = {dim: -1, direction: 0, duration: duration};
    this.notifyAllPanelsOnChange(this.currentData, drill);
    this.drillLock = false;
};

/**
 * Calls the pre-update function of all panels.
 *
 * @param {Object} drill The drill object.
 * @returns {undefined}
 */
DataDirector.prototype.initiatePreUpdates = function (drill) {
    for (let i = 0, iMax = this.panelRoster.length; i < iMax; i++) {
        this.panelRoster[i].preUpdateFunction.call(this.panelRoster[i].context, this.getPanelDrill(i, drill));
    }
};

/**
 * Requests new data from the server. The new data will be distributed to the
 * panels' pre-update function.
 *
 * @param {Object} drill The drill object.
 * @returns {undefined}
 */
DataDirector.prototype.requestNewData = function (drill) {
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
            queries.push({"dimsToDrill": query});
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
    // The actual data request.
    global.get(global.url.fact, encodedQuery, function (result) {
        that.processNewData(drill, result);
        that.drillLock = false;
    });
};

/**
 * Distributes data to the panels, and calls the panels' update functions.
 *
 * @param {Object} drill The drill object.
 * @param {Object} newDataJson The new data to process.
 * @returns {undefined}
 */
DataDirector.prototype.processNewData = function (drill, newDataJson) {
    const newData = newDataJson["answer"];
    for (let i = 0, iMax = newData.length; i < iMax; i++) {
        newData[i].name = newData[i]["richName"].replace(/(?<=:|^)[^:][^:]+(?=:|$)/g, '1');
    }
    this.extractLatLonFromDimensions(newData);
    this.storeOrigValues(newData);
    this.localizeNewData(newData);
    this.calculate(newData);
    this.currentData = newData;
    this.notifyAllPanelsOnChange(newData, drill);
};

/**
 * Extracts the latitude and longitude from the dimension names,
 * and writes them into the dimension objects.
 *
 * @param newData Data to process.
 */
DataDirector.prototype.extractLatLonFromDimensions = function (newData) {
    for (let i = 0, iMax = newData.length; i < iMax; i++) {
        const panelData = newData[i].response;
        for (let r = 0, rMax = panelData.rows.length; r < rMax; r++) {
            const row = panelData.rows[r];
            const dims = row.dims;
            for (let d = 0, dMax = dims.length; d < dMax; d++) {
                const dim = dims[d];
                const separator = this.determineLatLonSeparator(dim.name);
                if (separator !== null && dim.name.indexOf(separator) !== -1) {
                    const splitDim = dim.name.split(separator);
                    dim.name = splitDim[0];
                    dim.lat = splitDim[1];
                    dim.lon = splitDim[2];
                }
            }
        }
    }
};

/**
 * Determines the separator between latitude and longitude in the dimension name.
 * To recognize the separator, the data row should look like this:
 * Unicode_name@@@latitude@@@longitude, where @@@ can be any non-text character group,
 * but the two occurrences should be the same.
 *
 * @param inputString The string to analyze.
 * @returns {String|null} The separator if found, otherwise null.
 */
DataDirector.prototype.determineLatLonSeparator = function (inputString) {
    const regex = /[^\w\s.,-]+[0-9.,-]+/g; // Matches non-alphanumeric, non-space, non-dot, and non-hyphen character groups, and a number after it.
    const matches = inputString.match(regex);
    if (matches && matches.length > 1) {
        const sep1 = matches[matches.length - 2].match(/[^0-9.,-]+/g);
        const sep2 = matches[matches.length - 1].match(/[^0-9.,-]+/g);
        if (sep1 && sep2 && sep1[0] === sep2[0]) {
            return sep1[0]; // Return the common separator
        }
    }
    return null;
};

/**
 * Calculates the actual value of the calculated indicators. It modifies the
 * data object received on input.
 *
 * @param {Array} data The data object containing the input values.
 * @returns {undefined}
 */
DataDirector.prototype.calculate = function (data) {
    const meta = global.facts[this.side].localMeta;

    // Determine the control values
    const controlValues = global.facts[this.side].controlValues;

    for (let i = 0, iMax = meta.indicators.length; i < iMax; i++) {
        const valueFunction = meta.indicators[i].value.function;
        if (typeof valueFunction === "function") {
            this.applyFunctionToAllPanels(data, controlValues, valueFunction, i, "sz");
        }
        const fractionFunction = meta.indicators[i].fraction.function;
        if (typeof fractionFunction === "function") {
            this.applyFunctionToAllPanels(data, controlValues, fractionFunction, i, "n");
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
DataDirector.prototype.notifyAllPanelsOnChange = function (newData, drill) {
    const realDimensions = global.facts[this.side].reportMeta.dimensions.length;
    for (let i = 0, iMax = this.panelRoster.length; i < iMax; i++) {
        const pos = global.positionInArrayByProperty(newData, "name", this.panelRoster[i].dimsToShow.slice(0, realDimensions).toString().replace(/,/g, ":"));
        const data = newData[pos].response;
        const enrichedData = this.enrichDataWithControlDimensions(data, this.panelRoster[i].dimsToShow);
        if (drill.onlyFor === undefined || drill.onlyFor === this.panelRoster[i].panelId) {
            this.panelRoster[i].updateFunction.call(this.panelRoster[i].context, enrichedData, this.getPanelDrill(i, drill));
        }
    }
    global.writeConfigToUrl();
};

/**
 * Puts the control dimensions into the data object, as if it would be also a
 * dimension. It modifies the data object received on input.
 *
 * @param {Object} data Data to process & modify.
 * @param {Array} dimsToShow Dimensions that are required (shown in the panel).
 * @returns {Object} The modified data object.
 */
DataDirector.prototype.enrichDataWithControlDimensions = function (data, dimsToShow) {
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
        for (let r = 0, rMax = data["rows"].length; r < rMax; r++) {
            const row = data["rows"][r];
            possibleControlValues.forEach(function (controlValue) {
                const newRow = JSON.parse(JSON.stringify(row));
                if (newRow.controls === undefined) {
                    newRow.controls = [];
                    for (let i = 0, iMax = global.facts[that.side].controlValues.length; i < iMax; i++) {
                        newRow.controls[i] = global.facts[that.side].controlValues[i];
                    }
                }
                newRow.controls[controlsAsIndex[c]] = controlValue.value;
                newRow.dims.push({'id': controlValue.value + '', 'name': controlValue.label + ''});
                newData.rows.push(newRow);
            });
        }
        data = newData;
    }

    const localMeta = global.facts[this.side].localMeta;

    for (let i = 0, iMax = localMeta.indicators.length; i < iMax; i++) {

        const valueFunction = localMeta.indicators[i].value.function;
        if (typeof valueFunction === "function") {
            this.applyFunction(data, undefined, valueFunction, i, "sz");
        }
        const fractionFunction = localMeta.indicators[i].fraction.function;
        if (typeof fractionFunction === "function") {
            this.applyFunction(data, undefined, fractionFunction, i, "n");
        }
    }

    return data;
}

/**
 * Returns the possible control values as an array.
 *
 * @param {Object} parameters The parameters object containing the control values. It can be
 * the parameters describing a radio button panel, or a slider with discrete values.
 * @returns {Array} Array of possible control values.
 */
DataDirector.prototype.getPossibleControlValuesAsArray = function (parameters) {
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

/**
 * Applies the function to the data rows of a panel. The function should have 4
 * arrays as inputs: D[] as the dimensions' values, v[] as the indicators'
 * values, d[] as the indicators' divisors and c[] as the controls' values.
 *
 * @param {Object} data The data object to process.
 * @param {Array|undefined} controlValues Array of control values. If undefined, extracted from the data.
 * @param {Function} func Function to calculate the calculated value.
 * @param {int} index Index of the value to calculate.
 * @param {String} position "sz" or "n" to calculate the számláló or nevező.
 * @returns {undefined}
 */
DataDirector.prototype.applyFunction = function (data, controlValues, func, index, position) {
    for (let r = 0, rMax = data.rows.length; r < rMax; r++) {
        const row = data.rows[r];
        const D = row.dims;
        const c = (controlValues !== undefined) ? controlValues : (row.controls || global.facts[this.side].controlValues);
        const v = row.origVals.map(element => element.sz);
        const d = row.origVals.map(element => element.n);
        row["vals"][index][position] = func(D, c, v, d);
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
DataDirector.prototype.storeOrigValues = function (data) {
    for (let a = 0, aMax = data.length; a < aMax; a++) {
        const answer = data[a].response;
        for (let r = 0, rMax = answer.rows.length; r < rMax; r++) {
            const row = answer.rows[r];
            const vals = row["vals"];
            row.origVals = [];
            for (let v = 0, vMax = vals.length; v < vMax; v++) {
                const val = vals[v];
                row.origVals.push({"sz": val.sz, "n": val.n});
            }
        }
    }
};

/**
 * Applies a function to calculate the calculated values. It should have 4
 * arrays as inputs: D[] as the dimensions' values, v[] as the indicators'
 * values, d[] as the indicators' divisors and c[] as the controls' values.
 * The result will be stored in the received data object.
 *
 * @param {Array} data The data object to process.
 * @param {Array} controlValues Array of the actual control values.
 * @param {Function} func Function to calculate the calculated value.
 * @param {int} index Index of the value to calculate.
 * @param {String} position "sz" or "n" to calculate the számláló or nevező.
 * @returns {undefined}
 */
DataDirector.prototype.applyFunctionToAllPanels = function (data, controlValues, func, index, position) {
    for (let a = 0, aMax = data.length; a < aMax; a++) {
        const answer = data[a].response;
        this.applyFunction(answer, controlValues, func, index, position);
    }
};

/**
 * Localizes the "name" dimension attributes in the raw data.
 * There is no return value, the input data is changed.
 *
 * @param {Array} newData New data to process
 * @returns {undefined}
 */
DataDirector.prototype.localizeNewData = function (newData) {
    for (let i = 0, iMax = newData.length; i < iMax; i++) {
        const panelData = newData[i];
        const currentLang = String.locale;
        const dimIndexKey = panelData.name.split(":");
        const dictToUse = [];
        for (let dki = 0, dkiMax = dimIndexKey.length; dki < dkiMax; dki++) {
            if (dimIndexKey[dki] === '1') {
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
 * Converts the global drill object for a given panel. The converted
 * object contains only the information that is interesting for the panel.
 *
 * @param {int} i Index of the panel.
 * @param {Object} drill The original drill object.
 * @returns {Object} The converted drill object.
 */
DataDirector.prototype.getPanelDrill = function (i, drill) {
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
 * @param {Function} callback Optional callback function. If undefined, it is written to the console.
 * @returns {undefined}
 */
DataDirector.prototype.getConfigs = function (callback) {
    let configs = "";
    let separator = "";

    // Collect the configuration strings of the panels. The order is the occurrence on the screen.
    const panels = d3.selectAll("#container" + this.side + " .panel.single:not(.dying)").nodes();
    for (let i = 0, iMax = panels.length; i < iMax; i++) {
        const panelId = "#" + d3.select(panels[i]).attr('id');
        const p = global.getFromArrayByProperty(this.panelRoster, "panelId", panelId);
        if (p && typeof p.getConfigFunction === 'function') {
            configs = configs + separator + p.getConfigFunction.call(p.context);
            separator = ";";
        }
    }

    // If callback is provided, call it with the configuration object.
    if (typeof callback === 'function') {
        const configObject = {};
        if (global.facts[this.side] && global.facts[this.side].localMeta) {
            configObject.s = this.side;
            configObject.c = global.facts[this.side].localMeta.cube_unique_name; // The cube name.
            configObject.b = global.baseLevels[this.side]; // Current base levels.
            configObject.i = global.facts[this.side].controlValues; // Actual value of the controls.
            configObject.v = global.minifyInits(configs); // Initialization strings for the panels, minified.
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
