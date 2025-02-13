/* global global */

'use strict';

function MapStore() {
    this.maps = {};
}

MapStore.prototype.contains = function(mapName) {
    return mapName in this.maps;
};

MapStore.prototype.get = function(mapName) {
    const convertedMapName = this.convertMapName(mapName);
    return this.maps[convertedMapName];
};

MapStore.prototype.put = function(mapName, map) {    
    this.maps[mapName] = map;    
};

MapStore.prototype.loadAsync = async function(jsonMapName) {
    const convertedMapName = this.convertMapName(jsonMapName);
    if (this.contains(convertedMapName)) {
        return "map already loaded";
    }
    const that = this;
    const base = "data/maps/";
    const map = await global.loadExternal(base + convertedMapName);
    that.put(convertedMapName, map);
    return "loaded " + convertedMapName;
};

MapStore.prototype.loadAllAsync = async function(mapNames) {
    const promises = [];
    for (var i = 0, iMax = mapNames.length; i < iMax; i++) {
        promises.push(this.loadAsync(mapNames[i]));
    }
    await Promise.all(promises);
    return "Maps loaded";
};

MapStore.prototype.convertMapName = function(mapName) {
    if (mapName.indexOf(".json") === mapName.length - 5) {
        return mapName;
    }
    if (mapName.indexOf("map(") === 0) {
        return mapName.split(/\(|\)/)[1] + ".json";
    }
    return mapName + ".json";    
};