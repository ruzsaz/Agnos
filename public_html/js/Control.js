/* global d3 */

'use strict';

/**
 * Létrehoz egy html scrollbart, de egy svg-n belül, svg elemek scrollozására.
 * 
 * @param {Object} parentElement A scollbart tartalmazó szülőelem.
 * @param {Boolean} isHorizontal True: vízszintes, false: függőleges.
 * @param {Number} length A scrollbar hossza, pixelben.
 * @param {Function} callback A scrollozáskor meghívandó függvény.
 * @param {Number} wheelScrollSize A görgetés szkrollozandó mennyiség.
 * @param {Object} additionalWheelTarget Olyan elem, amelyhez a görgetést még extrán hozzárendeljük.
 * @returns {SVGScrollbar} A scollbar.
 */
function ControlSlider(parentElement, trans, initObject, callback) {
    var that = this;
    
    console.log(initObject.parameters)
    const init = JSON.parse(initObject.parameters);    

    this.className = "control slider";
    this.changeFunction = callback;

    // A scroolbart tartalmazó div.

    const container = parentElement.append("html:div")
            .attr("class", "sliderContainer");
    
    var valueContainer = container.append("html:text")
            .attr("class", "actualValue");
    
    valueContainer
            .style("opacity", 0)
            .text(global.cleverRound2(initObject.value))
            .transition(d3.transition().duration(global.selfDuration))
            .style("opacity", 1);   
    
    const slider = container.append("html:input")
            .attr("id", "zolikaokos")
            .attr("class", that.className)
            .attr("type", "range")
            .attr("min", (init === undefined || init.min === undefined) ? 0 : init.min)
            .attr("max", (init === undefined || init.max === undefined) ? 100 : init.max)
            .attr("step", (init === undefined || init.step === undefined) ? 0 : init.step)
            .attr("value", initObject.value)
            .on("input", function() {
                const value = d3.select(this).property("value");
                valueContainer
                        .style("opacity", 0.5)
                        .text(global.cleverRound2(value));
            })
            .on("change", function() {
                    const value = d3.select(this).property("value");
                    const trans = d3.transition().duration(global.selfDuration);
                    valueContainer
                            //.style("opacity", 0)
                            .text(global.cleverRound2(value))
                            .transition(trans)
                            .style("opacity", 1);                                                
                    callback(value);
            });
                
};

