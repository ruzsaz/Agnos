/* global global */

'use strict';

/**
 * Létrehoz egy új reportot, és betölti a hozzá tartozó metát.
 * 
 * @param {Object} reportSuperMeta A reporthoz tartalmazó superMeta.
 * @param {Number} side Melyik oldalon van? (0 vagy 1)
 * @param {Function} callbackFunction A meghívandó függvény, ha kész a meta letöltése.
 * @param {Object} callContext A meghívandó függvénynél a this-context.
 * @param {Object} startObject Az indulást leíró objektum, ha a reportba nem a legfelső szinten lépünk be.
 * @returns {Fact}
 */
function Fact(reportSuperMeta, side, callbackFunction, callContext, startObject) {

    var that = this;
    this.callback = callbackFunction;
    this.callContext = callContext;
    this.side = side;

    this.reportMeta = reportSuperMeta;
    this.localMeta = undefined;
    this.controlValues = [];
        
    that.enrichReportMeta(startObject);
    that.setControlValues((startObject) ? startObject.i : undefined);  
}

/**
 * A meták betöltése után meghívandó függvény. Beállít néhány változót,
 * majd meghívja a fact callbackját.
 * 
 * @param {Object} startObject Az indulást leíró objektum, ha a reportba nem a legfelső szinten lépünk be.
 * @returns {Fact.reportMetaReady}
 */
Fact.prototype.enrichReportMeta = function(startObject) {
        
    // A bázisszintet tartalmazó tömb kezdeti beállítása.
    for (var i = 0, iMax = this.reportMeta.dimensions.length; i < iMax; i++) {
        (global.baseLevels[this.side]).push([]); // Kezdetben a legfelsőbb szint a bázisszint.
    }
    if (startObject) {
        global.baseLevels[this.side] = startObject.b;
        this.reportMeta.visualizations = startObject.v;
    }

    // A dimenziók id-jének beállítása, tooltip beállítása;
    for (var i = 0, iMax = this.reportMeta.dimensions.length; i < iMax; i++) {
        this.reportMeta.dimensions[i].id = i;
    }

    // Ha van térkép, a térképkód kinyerése;
    for (var i = 0, iMax = this.reportMeta.dimensions.length; i < iMax; i++) {
        const dimType = this.reportMeta.dimensions[i].type;
        if (typeof dimType === "string" && dimType.length > 0) {
            this.reportMeta.mapKey = dimType;
            break;
        }
    }

    // A mutatók id-jének beállítása, tooltip beállítása.
    for (var i = 0, iMax = this.reportMeta.indicators.length; i < iMax; i++) {
        this.reportMeta.indicators[i].id = i;
    }
    
    // Az esetleges előre beállított színek érvényesítése.
    global.resetValColorsFromReportMeta(this.reportMeta, this.side);

};

/**
 * Kiválasztja a metából a pillanatnyi nyelvnek megelelő nyelvfüggő változatot.
 * 
 * @returns {Globalglobal.getFromArrayByLang.array|undefined}
 */
Fact.prototype.getLocalMeta = function() {
    var language = String.locale;

    // Ha nem a jó nyelvről szól a localMeta, akkor elkészítjük.
    if (!(this.localMeta && this.localMeta.actualLanguage === language)) {
        this.localMeta = {};
        this.localMeta.actualLanguage = language;
        const localLabel = global.getFromArrayByLang(this.reportMeta.labels, language);
        const defaultLabel = global.getFromArrayByLang(this.reportMeta.labels, "");
        this.localMeta.caption = global.getFirstValidString(localLabel.caption, defaultLabel.caption, localLabel.description, defaultLabel.description);
        this.localMeta.cube_unique_name = this.reportMeta.name;
        this.localMeta.saveAllowed = this.reportMeta.saveAllowed;
        this.localMeta.datasource = global.getFirstValidString(localLabel.datasource, defaultLabel.datasource);
        this.localMeta.description = global.getFirstValidString(localLabel.description, defaultLabel.description, localLabel.caption, defaultLabel.caption);
                
        this.localMeta.dimensions = [];
        for (var i = 0, iMax = this.reportMeta.dimensions.length; i < iMax; i++) {
            var d = this.reportMeta.dimensions[i];
            const localLabel = global.getFromArrayByLang(d.multilingualization, language);
            const defaultLabel = global.getFromArrayByLang(d.multilingualization, "");
            const dimension = {
                'caption': global.getFirstValidString(localLabel.caption, defaultLabel.caption, localLabel.description, defaultLabel.description),
                'description': global.getFirstValidString(localLabel.description, defaultLabel.description, localLabel.caption, defaultLabel.caption),
                'dimension_unique_name': d.name,
                'id': d.id,
                'is_territorial': (d.type === "" || d.type === null) ? 0 : 1,
                'levels': d.allowedDepth + 1,
                'lang': d.lang,
                'top_level_caption': global.getFirstValidString(localLabel.topLevelString, defaultLabel.topLevelString)
            };
            this.localMeta.dimensions.push(dimension);
        }
        
        this.localMeta.controls = [];
        if (this.reportMeta.controls !== undefined) {
            for (var i = 0, iMax = this.reportMeta.controls.length; i < iMax; i++) {
                const d = this.reportMeta.controls[i];
                const localLabel = global.getFromArrayByLang(d.multilingualization, language);
                const defaultLabel = global.getFromArrayByLang(d.multilingualization, "");
                const controlLabelsString = global.getFirstValidString(localLabel.values, defaultLabel.values);

                const control = {
                    'caption': global.getFirstValidString(localLabel.caption, defaultLabel.caption, localLabel.description, defaultLabel.description),
                    'description': global.getFirstValidString(localLabel.description, defaultLabel.description, localLabel.caption, defaultLabel.caption),
                    'type': d.type,
                    'parameters': d.parameters,
                    'labels': (controlLabelsString.length < 2) ? undefined : JSON.parse(controlLabelsString),
                    'defaultValue': d.defaultValue
                };
                this.localMeta.controls.push(control);
            }
        }

        this.localMeta.indicators = [];
        for (var i = 0, iMax = this.reportMeta.indicators.length; i < iMax; i++) {            
            var d = this.reportMeta.indicators[i];
            const localLabel = global.getFromArrayByLang(d.multilingualization, language);
            const defaultLabel = global.getFromArrayByLang(d.multilingualization, "");
            const indicator = {
                'isShown' : !d.denominatorIsHidden || !d.valueIsHidden,
                'colorExact': d.colorExact,
                'preferredColor': d.preferredColor,
                'caption': global.getFirstValidString(localLabel.caption, defaultLabel.caption, localLabel.description, defaultLabel.description),
                'description': global.getFirstValidString(localLabel.description, defaultLabel.description, localLabel.caption, defaultLabel.caption),
                'fraction': {
                    'function': this.createFunction(d.denominatorFunction),
                    'hide': d.denominatorIsHidden,
                    'measure_unique_name': d.denominatorName,
                    'multiplier': d.denominatorMultiplier,
                    'sign': d.denominatorSign,
                    'unit': global.getFirstValidString(localLabel.denominatorUnit, localLabel.denominatorUnitPlural, defaultLabel.denominatorUnit, defaultLabel.denominatorUnitPlural),
                    'unitPlural': global.getFirstValidString(localLabel.denominatorUnitPlural, localLabel.denominatorUnit, defaultLabel.denominatorUnitPlural, defaultLabel.denominatorUnit)
                },
                'id': d.id,
                'value': {
                    'function': this.createFunction(d.valueFunction),
                    'hide': d.valueIsHidden,
                    'measure_unique_name': d.valueName,
                    'multiplier': d.valueMultiplier,
                    'sign': d.valueSign,
                    'unit': global.getFirstValidString(localLabel.valueUnit, localLabel.valueUnitPlural, defaultLabel.valueUnit, defaultLabel.valueUnitPlural),
                    'unitPlural': global.getFirstValidString(localLabel.valueUnitPlural, localLabel.valueUnit, defaultLabel.valueUnitPlural, defaultLabel.valueUnit)
                }
            };
            this.localMeta.indicators.push(indicator);
        }
        this.localMeta.visualization = this.reportMeta.visualizations;
    }
    
    return this.localMeta;
};

/**
 * Create a javascript function from a string containing the function's body.
 * 
 * @param {String} functionDefinition Definition of the function, like "function (a) {return a}".
 * @returns {Function} The created javascript function.
 */
Fact.prototype.createFunction = function(functionDefinition) {
    if (functionDefinition === null || functionDefinition === undefined || functionDefinition.length === 0) {
        return undefined;
    }
    var returnFunction;
    eval("returnFunction = " + functionDefinition);
    return returnFunction;    
};

/**
 * Set the controls' values as in the argument.
 * If no argument is given, set the default values.
 * 
 * @param {Array} controlValues Values to set.
 * @returns {undefined}
 */
Fact.prototype.setControlValues = function(controlValues) {
    if (controlValues !== undefined) {
        this.controlValues = controlValues;        
    } else if (this.reportMeta.controls !== undefined) {
        this.controlValues = [];
        for (var i = 0, iMax = this.reportMeta.controls.length; i < iMax; i++) {
            this.controlValues.push(this.reportMeta.controls[i].defaultValue);
        }
    }    
};
