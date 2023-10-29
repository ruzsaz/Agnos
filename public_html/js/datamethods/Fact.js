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
    
    that.enrichReportMeta(startObject);
            
}

/**
 * A meták betöltése után meghívandó függvény. Beállít néhány változót,
 * majd meghívja a fact callbackját.
 * 
 * @param {Object} reportSuperMeta A reporthoz tartozó superMeta.
 * @param {Object} startObject Az indulást leíró objektum, ha a reportba nem a legfelső szinten lépünk be.
 * @returns {Fact.reportMetaReady}
 */
Fact.prototype.enrichReportMeta = function(startObject) {
    
    console.log(this.reportMeta)
        
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
        if (typeof dimType === "string" && dimType.search("map") !== -1) {
            this.reportMeta.mapKey = dimType.replace("map(", "").replace(")", "");
            break;
        }
    }

    // A mutatók id-jének beállítása, tooltip beállítása.
    for (var i = 0, iMax = this.reportMeta.indicators.length; i < iMax; i++) {
        this.reportMeta.indicators[i].id = i;
    }

    console.log(this.callback, this.callContext, this.side)
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
        this.localMeta.caption = localLabel.caption;
        this.localMeta.cube_unique_name = this.reportMeta.name;
        this.localMeta.datasource = localLabel.datasource;
        this.localMeta.description = localLabel.description;
        
        this.localMeta.dimensions = [];
        for (var i = 0, iMax = this.reportMeta.dimensions.length; i < iMax; i++) {
            var d = this.reportMeta.dimensions[i];
            const localLabel = global.getFromArrayByLang(d.multilingualization, language);
            var dimension = {
                'caption': localLabel.caption,
                'description': localLabel.description,
                'dimension_unique_name': d.name,
                'id': d.id,
                'is_territorial': (d.type === "" || d.type === null) ? 0 : 1,
                'levels': d.allowedDepth + 1,
                'top_level_caption': localLabel.topLevelString
            };
            this.localMeta.dimensions.push(dimension);
        }

        this.localMeta.indicators = [];
        for (var i = 0, iMax = this.reportMeta.indicators.length; i < iMax; i++) {
            var d = this.reportMeta.indicators[i];
            const localLabel = global.getFromArrayByLang(d.multilingualization, language);
            var indicator = {
                'caption': localLabel.caption,
                'description': localLabel.description,
                'fraction': {
                    'hide': d.denominatorIsHidden,
                    'measure_unique_name': d.denominatorName,
                    'multiplier': d.denominatorMultiplier,
                    'sign': d.denominatorSign,
                    'unit': localLabel.denominatorUnit,
                    'unitPlural': localLabel.denominatorUnitPlural
                },
                'id': d.id,
                'value': {
                    'hide': d.valueIsHidden,
                    'measure_unique_name': d.valueName,
                    'sign': d.valueSign,
                    'unit': localLabel.valueUnit,
                    'unitPlural': localLabel.valueUnitPlural
                }
            };
            this.localMeta.indicators.push(indicator);
        }
        this.localMeta.visualization = this.reportMeta.visualizations;
    }
    
    return this.localMeta;
};