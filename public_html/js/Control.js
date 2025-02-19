/* global d3 */

'use strict';


function ControlSlider(parentElement, id, initObject, startValue, callback) {
    var that = this;
    
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
            .text(global.cleverRound2(startValue))
            .transition(d3.transition().duration(global.selfDuration))
            .style("opacity", 1);   
    
    const slider = container.append("html:input")
            .attr("class", that.className)
            .attr("id", id)
            .attr("type", "range")
            .attr("min", (init === undefined || init.min === undefined) ? 0 : init.min)
            .attr("max", (init === undefined || init.max === undefined) ? 100 : init.max)
            .attr("step", (init === undefined || init.step === undefined) ? 0 : init.step)
            .attr("value", startValue)
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

ControlSlider.prototype.updateLabels = function() {
    
};


function ControlRadio(parentElement, id, initObject, startValue, callback) {
    var that = this;
    
    const init = JSON.parse(initObject.parameters);    
    
    const data = [];
    for (var i = 0, iMax = init.values.length; i < iMax; i++) {        
        data.push({
            "value" : init.values[i],
            "label" : (initObject.labels === undefined || initObject.labels.length <= i) ? init.values[i] : initObject.labels[i]
        });        
    }
    
    this.className = "control radio";
    this.changeFunction = callback;

    // A scroolbart tartalmazó div.
    const container = parentElement.append("html:div")
            .attr("class", "radioContainer");
    
    var valueContainer = container.append("html:form")
            .attr("id", id)
            .attr("class", that.className)
            .on("change", function() {
                    const value = valueContainer.select('input:checked').node().value;                    
                    callback(value);
            });
    
    valueContainer
            .style("opacity", 0)            
            .transition(d3.transition().duration(global.selfDuration))
            .style("opacity", 1);   
    
    var newRadioOption = valueContainer.selectAll("input").data(data)
            .enter().append("html:p");
                        
    newRadioOption.append("html:input")
            .attr("type", "radio")
            .attr("class", "radioButton")
            .attr("name", id)
            .attr("value", function(d){return d.value;});
    
    newRadioOption.insert("html:label")
            .text(function(d){return d.label;});
    
    // Set the starting value
    valueContainer.select('input[value="' + startValue + '"]').node().checked = true;
                
};

ControlRadio.prototype.updateLabels = function(parentElement, newLabels, trans) {
    var labels = parentElement.selectAll("label").data(newLabels);
    labels = labels.merge(labels)
            .style("opacity", function (d) {
                return (d === d3.select(this).text()) ? 1 : 0;
            })
            .text(function (d) {
                return d;
            }).transition(trans)
            .style("opacity", 1);
    
};
