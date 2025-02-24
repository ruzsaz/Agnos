/* global */

'use strict';

function Dictionaries() {    
    this.dictionaries = {};        
}

Dictionaries.prototype.getDictionary = function(fromLanguage, toLanguage) {
    const dictKey = fromLanguage + "->" + toLanguage;
    const dictionary = this.dictionaries[dictKey];
    return (dictionary === undefined) ? {} : dictionary;
};

Dictionaries.prototype.addDictionary = function(fromLanguage, toLanguage, dictEntries) {
    const dictKey = fromLanguage + "->" + toLanguage;
    if (this.dictionaries[dictKey] === undefined) {
        this.dictionaries[dictKey] = {};
    }
    const dictionary = this.dictionaries[dictKey];    
    for (var key in dictEntries) {
        dictionary[key] = dictEntries[key];
    }
};

Dictionaries.prototype.loadAsync = async function(jsonDictName) {
    const base = "data/dictionaries/";
    const dictionary = await global.loadExternal(base + jsonDictName);
    this.addDictionary(dictionary.fromLanguage, dictionary.toLanguage, dictionary.dictionary);
    return "loaded " + jsonDictName;
};

Dictionaries.prototype.loadAllAsync = async function(dictNames) {
    const promises = [];
    if (dictNames !== undefined && dictNames !== null) {
        for (var i = 0, iMax = dictNames.length; i < iMax; i++) {
            promises.push(this.loadAsync(dictNames[i]));
        }
    }
    await Promise.all(promises);
    return "Maps loaded";
};