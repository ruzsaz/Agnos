/* global Panel, d3, global */

'use strict';

const bubblePanel = panel_bubble;

/**
 * A bubble diagram panel constructor.
 *
 * @param {Object} init Initialization object.
 * @returns {panel_bubble}
 */
function panel_bubble(init) {
    const that = this;

    this.constructorName = "panel_bubble";

    // Initialization object with default values.
    this.defaultInit = {
        group: 0,
        position: undefined,
        dim: 0,
        val: [0, 0, 0],
        ratio: true,
        mag: 1,
        frommg: 1,
        sortbyvalue: false
    };
    this.actualInit = global.combineObjects(that.defaultInit, init);

    Panel.call(that, that.actualInit, global.mediators[that.actualInit.group], true, true, global.numberOffset, 0); // Call the Panel constructor.

    this.valXToShow = that.actualInit.val[0];
    this.valYToShow = that.actualInit.val[1];
    this.valRToShow = that.actualInit.val[2];

    this.oldValXToShow = -1;
    this.oldValYToShow = -1;
    this.oldValRToShow = -1;

    this.valMultipliers = that.localMeta.indicators.map(ind => ind.value.multiplier);
    this.fracMultipliers = that.localMeta.indicators.map(ind => ind.fraction.multiplier);
    this.isScatter = (that.valRToShow === undefined);
    this.valFraction = that.actualInit.ratio;
    this.dimToShow = that.actualInit.dim;

    that.checkAndCorrectFractionSettings();

    this.preparedData = undefined;
    this.maxEntries = global.maxEntriesIn1D;
    this.maskId = global.randomString(12);

    // Scales for the bubble chart.
    this.xScale = d3.scaleLinear().range([0, that.width]).nice(global.niceX);
    this.yScale = d3.scaleLinear().range([that.height, 0]).nice(global.niceY);
    this.radiusScale = d3.scaleSqrt().range([that.minBubbleSize, (that.isScatter) ? that.scatterSize : that.maxBubbleSize]);

    // Axes.
    this.xAxis = d3.axisBottom(that.xScale)
        .ticks(10)
        .tickFormat(global.cleverRound3);
    this.yAxis = d3.axisLeft(that.yScale)
        .ticks(8)
        .tickFormat(global.cleverRound3);

    // Middle drop-area for the R value.
    if (!that.isScatter) {
        that.svg.insert("svg:g", ".panelControlButton")
            .attr("class", "background listener droptarget droptarget1")
            .on('mouseover', function () {
                that.hoverOn(this, "r");
            })
            .on('mouseout', function () {
                that.hoverOff();
            })
            .append("svg:rect")
            .attr("width", (that.w - that.margin.left - that.margin.right))
            .attr("height", (that.height))
            .attr("transform", "translate(" + (that.margin.left) + ", " + that.margin.top + ")");
    }

    // Top drop-area for the X value.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget1")
        .on('mouseover', function () {
            that.hoverOn(this, "x");
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .append("svg:rect")
        .attr("width", that.w)
        .attr("height", (2 * that.margin.bottom))
        .attr("transform", "translate(0, " + (that.height + that.margin.top - that.margin.bottom) + ")");

    // Left drop-area for the Y value.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget1")
        .on('mouseover', function () {
            that.hoverOn(this, "y");
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .append("svg:rect")
        .attr("width", that.margin.left * 2)
        .attr("height", that.h);

    // Base drop-are for the dimension change.
    that.svg.insert("svg:g", ".panelControlButton")
        .attr("class", "background listener droptarget droptarget0")
        .on('mouseover', function () {
            that.hoverOn(this);
        })
        .on('mouseout', function () {
            that.hoverOff();
        })
        .on("click", function () {
            that.drill();
        })
        .append("svg:rect")
        .attr("width", that.w)
        .attr("height", that.h);

    // X-axis group.
    this.gAxisX = that.svg.insert("svg:g", ".title_group")
        .attr("class", "axisX axis noEvents")
        .attr("transform", "translate(" + that.margin.left + ", " + (that.margin.top + that.height) + ")");

    // Write the actual dimension on it
    this.axisXCaption = that.svg.insert("svg:text", ".title_group")
        .attr("class", "dimensionLabel noEvents")
        .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");

    // Y-axis group.
    this.gAxisY = that.svg.insert("svg:g", ".title_group")
        .attr("class", "axisY axis")
        .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");

    // R-axis group.
    this.gAxisR = that.svg.insert("svg:g", ".title_group")
        .attr("class", "axisR axis")
        .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")");


    // Main SVG group for the bubbles.
    this.gBubbles = that.svg.insert("svg:g", ".title_group")
        .attr("class", "bubble_group")
        .attr("transform", "translate(" + that.margin.left + ", " + that.margin.top + ")")
        .attr("mask", "url(#maskurl" + that.maskId + ")");

    // Subscribe to value and dimension change events.
    let med;
    med = that.mediator.subscribe("changeValue", function (id, val, ratio, valToChange) {
        that.doChangeValue(id, val, ratio, valToChange);
    });
    that.mediatorIds.push({"channel": "changeValue", "id": med.id});

    med = that.mediator.subscribe("changeDimension", function (panelId, newDimId) {
        that.doChangeDimension(panelId, newDimId);
    });
    that.mediatorIds.push({"channel": "changeDimension", "id": med.id});

    // Register the panel.
    that.mediator.publish("register", that, that.panelId, [that.dimToShow], that.preUpdate, that.update, that.getConfig);

    this.actionCenterX = undefined;
    this.actionCenterY = undefined;
}

//////////////////////////////////////////////////
// Class constants
//////////////////////////////////////////////////

{
    panel_bubble.prototype = global.subclassOf(Panel);
    panel_bubble.prototype.scatterSize = 5;
    panel_bubble.prototype.maxBubbleSize = 30;
    panel_bubble.prototype.minBubbleSize = 0;
    panel_bubble.prototype.valNamePadding = 12;
}

//////////////////////////////////////////////////
// Helping functions for the drawing process
//////////////////////////////////////////////////

/**
 * Returns the values to show on the panel.
 *
 * @param {Object} d The raw data row.
 * @returns {{valueX: (number|*), originalValueX: (number|*), valueY: (number|*), originalValueY: (number|*), valueR: (number|*), originalValueR: (number|*)}}
 */
panel_bubble.prototype.valuesToShow = function (d) {
    const that = this;
    const x = that.valueToShow(d, that.valXToShow);
    const y = that.valueToShow(d, that.valYToShow);
    const r = that.valueToShow(d, that.valRToShow);
    return {
        valueX: x.value,
        originalValueX: x.originalValue,
        valueY: y.value,
        originalValueY: y.originalValue,
        valueR: r.value,
        originalValueR: r.originalValue
    };
}

/**
 * Returns a single value to show on the panel.
 *
 * @param {Object} d The raw data row.
 * @param valToShowIndex The index of the value to show.
 * @returns {{value: undefined, originalValue: undefined}|{value: number, originalValue: number}}
 */
panel_bubble.prototype.valueToShow = function (d, valToShowIndex) {
    const that = this;
    if (valToShowIndex === undefined) {
        return {value: this.scatterSize, originalValue: undefined};
    }
    if (d !== undefined && d.vals !== undefined) {
        let val = ((that.valFraction && !that.localMeta.indicators[valToShowIndex].fraction.hide) || !(!that.valFraction && !that.localMeta.indicators[valToShowIndex].value.hide)) ? this.fracMultipliers[valToShowIndex] * d.vals[valToShowIndex].sz / d.vals[valToShowIndex].n : this.valMultipliers[valToShowIndex] * d.vals[valToShowIndex].sz;
        let origVal = val;
        if (!isFinite(parseFloat(val))) {
            val = 0;
        }
        if (isNaN(parseFloat(origVal))) {
            origVal = "???";
        }
        return {value: val, originalValue: origVal};
    }
    return {value: undefined, originalValue: undefined};
}

panel_bubble.prototype.getSortingComparator = function () {
    const that = this;
    if (that.sortByValue) {
        return function (a, b) {
            const valA = that.valueToShow(a, that.valRToShow).value;
            const valB = that.valueToShow(b, that.valRToShow).value;
            return d3.ascending(valA, valB);
        };
    }
    return that.cmp;
}

panel_bubble.prototype.getTooltip = function (dim, val) {
    const that = this;
    const vals = [];

    const unitPropertyX = (val.valueX === 1) ? "unit" : "unitPlural";
    vals.push({
        name: that.localMeta.indicators[that.valXToShow].description,
        value: val.valueX,
        dimension: (that.valFraction) ? that.localMeta.indicators[that.valXToShow].fraction[unitPropertyX] : that.localMeta.indicators[that.valXToShow].value[unitPropertyX]
    });
    const unitPropertyY = (val.valueY === 1) ? "unit" : "unitPlural";
    vals.push({
        name: that.localMeta.indicators[that.valYToShow].description,
        value: val.valueY,
        dimension: (that.valFraction) ? that.localMeta.indicators[that.valYToShow].fraction[unitPropertyY] : that.localMeta.indicators[that.valYToShow].value[unitPropertyY]
    });
    if (!that.isScatter) {
        const unitPropertyR = (val.valueR === 1) ? "unit" : "unitPlural";
        vals.push({
            name: that.localMeta.indicators[that.valRToShow].description,
            value: val.valueR,
            dimension: (that.valFraction) ? that.localMeta.indicators[that.valRToShow].fraction[unitPropertyR] : that.localMeta.indicators[that.valRToShow].value[unitPropertyR]
        });
    }

    return that.createTooltip(
        [{
            name: that.localMeta.dimensions[that.dimToShow].description,
            value: (dim.name) ? dim.name.trim() : _("Nincs adat")
        }],
        vals
    );
}

//////////////////////////////////////////////////
// Drawing process
//////////////////////////////////////////////////

/**
 * Animation done at the beginning of the update.
 *
 * @param {Object} drill The drill object: {dim: dimension of the drill, direction: +1-up|-1-down, fromId: id if the previous item, toId: id of the new item}.
 */
panel_bubble.prototype.preUpdate = function (drill) {
    const that = this;
    const oldPreparedData = that.preparedData;

    if (drill.direction === -1) { // Lefúrás esetén.
        that.gBubbles.selectAll(".bubble")
            .filter(function (d) {
                return (d.id !== drill.toId);
            })
            .on("click", null)
            .remove();

        that.gBubbles.selectAll(".bubble_label")
            .filter(function (d) {
                return (d.id !== drill.toId);
            })
            .remove();

        const openFromElement = (drill.direction === -1 && oldPreparedData !== undefined) ? global.getFromArrayByProperty(oldPreparedData, 'id', drill.toId) : null;
        that.actionCenterX = (openFromElement === null) ? undefined : that.xScale(openFromElement.x);
        that.actionCenterY = (openFromElement === null) ? undefined : that.yScale(openFromElement.y);
        that.actionCenterR = 0;

    } else if (drill.direction === 1) { // Felfúrás esetén.
        that.gBubbles.selectAll(".bubble_label")
            .attr("opacity", 0);

        that.actionCenterX = undefined;
        that.actionCenterY = undefined;
        that.actionCenterR = (that.isScatter) ? 25 : 15;

    }
};

panel_bubble.prototype.prepareData = function (oldPreparedData, newDataRows, drill) {
    const that = this;
    const level = (global.baseLevels[that.panelSide])[this.dimToShow].length;

    const comparator = that.getSortingComparator();
    newDataRows.sort(comparator);

    const dataArray = [];

    const openFromElement = (drill.direction === -1 && oldPreparedData !== undefined) ? global.getFromArrayByProperty(oldPreparedData, 'id', drill.toId) : null;


    for (let i = 0; i < newDataRows.length; i++) {
        const d = newDataRows[i];
        const dim = d.dims[0];
        const val = that.valuesToShow(d);
        const element = {
            id: dim.id,
            uniqueId: level + "L" + dim.id,
            name: dim.name.trim(),
            order: i,
            x: val.valueX,
            y: val.valueY,
            r: Math.max(0, val.valueR),
            tooltip: that.getTooltip(dim, val)
        }
        dataArray.push(element);
    }

    that.xScale.domain(global.relaxExtent(d3.extent(dataArray, d => d.x))).nice(global.niceX);
    that.yScale.domain(global.relaxExtent(d3.extent(dataArray, d => d.y))).nice(global.niceY);
    that.radiusScale.domain([0, Math.max(0, d3.max(dataArray, d => d.r))]);

    return dataArray;
};

panel_bubble.prototype.update = function (data, drill) {
    const that = this;

    this.xAxis.ticks(10 * that.actualInit.mag);
    this.yAxis.ticks(8 * that.actualInit.mag);

    that.data = data || that.data;
    drill = drill || {dim: -1, direction: 0};

    const tweenDuration = (drill.duration === undefined) ? global.getAnimDuration("-1", that.panelId) : drill.duration;
    const trans = d3.transition().duration(tweenDuration);

    if (that.data.rows.length > that.maxEntries) {
        that.panic(true, _("The panel cannot display ") + that.data.rows.length + _(" values. The maximum number of values that can be displayed is ") + that.maxEntries + _("."));
        that.preparedData = undefined;
    } else {
        that.preparedData = that.prepareData(that.preparedData, that.data.rows, drill);
        that.panic(false);
        const trans = d3.transition().duration(tweenDuration);
        that.drawXAxe(that.preparedData, trans);
        that.drawYAxe(that.preparedData, trans);
        if (!that.isScatter) {
            that.drawRAxe(that.preparedData, trans);
        }
        that.drawBubbles(that.preparedData, trans);
        that.drawLabels(that.preparedData, trans);
    }

    that.drawLegend(trans);

    // Update the title.
    if (drill.toId === undefined || drill.dim === -1) {

        if (that.valXToShow === that.valYToShow && (that.valRToShow === undefined || that.valXToShow === that.valRToShow)) {
            that.titleBox.update(that.valXToShow, that.localMeta.indicators[that.valXToShow].caption, that.localMeta.indicators[that.valXToShow].value.unitPlural, that.localMeta.indicators[that.valXToShow].fraction.unitPlural, that.valFraction, tweenDuration);
        } else {

            const titleMetaArray = that.localMeta.indicators;
            const idA = [that.valXToShow, that.valYToShow];
            const nameA = [titleMetaArray[that.valXToShow].caption, titleMetaArray[that.valYToShow].caption];
            const valueUnitA = [titleMetaArray[that.valXToShow].value.unitPlural, titleMetaArray[that.valYToShow].value.unitPlural];
            const fractionUnitA = [titleMetaArray[that.valXToShow].fraction.unitPlural, titleMetaArray[that.valYToShow].fraction.unitPlural];

            if (!that.isScatter) {
                idA.push(that.valRToShow);
                nameA.push(titleMetaArray[that.valRToShow].caption);
                valueUnitA.push(titleMetaArray[that.valRToShow].value.unitPlural);
                fractionUnitA.push(titleMetaArray[that.valRToShow].fraction.unitPlural);
            }

            that.titleBox.update(idA, nameA, valueUnitA, fractionUnitA, that.valFraction, tweenDuration);
        }
        //that.drawLegend();
    }

    that.oldValXToShow = that.valXToShow;
    that.oldValYToShow = that.valYToShow;
    that.oldValRToShow = that.valRToShow;

}


panel_bubble.prototype.drawBubbles = function (preparedData, trans) {
    const that = this;

    let bubbleHolder = that.gBubbles.selectAll(".bubbleHolder").data(preparedData, d => d.id);

    bubbleHolder.exit()
        .on("click", null)
        .remove();

    const bubbleHolder_new = bubbleHolder.enter().append("svg:g")
        .attr("class", "bubbleHolder listener")
        .on("click", function (d) {
            that.drill(d);
        })

    bubbleHolder_new.append("svg:circle")
        .attr("class", "bubble shadow")
        .attr("cx", d => that.actionCenterX || ((that.actionCenterR > 0) ? 20 * (that.xScale(d.x) - that.width / 2) + that.width / 2 : that.xScale(d.x)))
        .attr("cy", d => that.actionCenterY || ((that.actionCenterR> 0) ? 20 * (that.yScale(d.y) - that.height / 2) + that.height / 2 : that.yScale(d.y)))
        .attr("r", d => that.actionCenterR * that.radiusScale(d.r) || 3)
        .attr("opacity", 0)

    bubbleHolder_new.append("svg:circle")
        .attr("class", "bubble bordered")
        .attr("cx", d => that.actionCenterX || ((that.actionCenterR > 0) ? 20 * (that.xScale(d.x) - that.width / 2) + that.width / 2 : that.xScale(d.x)))
        .attr("cy", d => that.actionCenterY || ((that.actionCenterR > 0) ? 20 * (that.yScale(d.y) - that.height / 2) + that.height / 2 : that.yScale(d.y)))
        .attr("r", d => that.actionCenterR * that.radiusScale(d.r) || 3)
        .attr("opacity", (that.actionCenterR === 0) ? 1 : 0)

    bubbleHolder = bubbleHolder_new.merge(bubbleHolder);

    bubbleHolder.sort(function (a, b) {
        return a.order - b.order;
    })
        .order();

    bubbleHolder.select(".bubble.shadow")
        .transition(trans)
        .attr("cx", d => that.xScale(d.x))
        .attr("cy", d => that.yScale(d.y))
        .attr("r", d => that.radiusScale(d.r))
        .attr("opacity", 1)

    bubbleHolder.select(".bubble.bordered")
        .transition(trans)
        .attr("cx", d => that.xScale(d.x))
        .attr("cy", d => that.yScale(d.y))
        .attr("r", d => that.radiusScale(d.r))
        .attr("fill", d => global.color(d.id))
        .attr("opacity", 1)
        .on('end', function() {
            d3.select(this).classed("darkenable", true)
        })

};

/**
 * Draws the labels of the bubbles.
 *
 * @param preparedData The prepared data.
 * @param trans The transition object to join.
 */
panel_bubble.prototype.drawLabels = function (preparedData, trans) {
    const that = this;

    const textColor = global.readableColor(global.colorValue(0, that.panelSide));

    const labelArray = [];
    const anchorArray = [];

    for (let i = 0; i <preparedData.length; i++) {
        const d = preparedData[i];
        const x = that.xScale(d.x);
        const y = that.yScale(d.y);
        labelArray.push({x: x, y: y + ((that.isScatter) ? 12 : 0), name: d.name, id: d.id, isVisible: true});
        anchorArray.push({x: x, y: y + ((that.isScatter) ? 12 : 0), r: 0});
    }

    let labels = that.gBubbles.selectAll(".bubble_label").data(labelArray, d => d.id);

    labels.exit().remove();

    labels = labels.enter().append("svg:text")
        .attr("class", "bubble_label valLegend legend noEvents")
        .attr("x", d => that.actionCenterX || ((that.actionCenterR > 0) ? 20 * (d.x - that.width / 2) + that.width / 2 : d.x))
        .attr("y", d => that.actionCenterY || ((that.actionCenterR > 0) ? 20 * (d.y - that.height / 2) + that.height / 2 : d.y))
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("opacity", -1)
        .text(d => d.name)
        .merge(labels)

    for (let i = 0; i < labelArray.length; i++) {
        const label = labelArray[i];
        const anchor = anchorArray[i];
        const textBox = labels.filter(d => d.id === label.id).nodes()[0].getBBox();
        label.width = textBox.width;
        label.height = textBox.height-2;
        if (anchor.x - label.width / 2 < 4) {
            anchor.x = label.width / 2 + 4;
        }
        if (anchor.y + label.height / 2 + 2 > that.height) {
            anchor.y = that.height - label.height / 2 - 2;
        }
        if (label.y > that.height - 6) {
            label.y = that.height - 6;
        }
    }

    d3.labeler()
        .label(labelArray)
        .anchor(anchorArray)
        .width(that.width)
        .height(that.height-6)
        .start(100);

    for (let i = labelArray.length - 1; i >= 0; i--) {
        const li = labelArray[i];
        let good = true;
        for (let j = labelArray.length - 1; j > i; j--) {
            const lj = labelArray[j];
            const isIntersects = that.isIntersects(li.x, li.y, li.width, li.height, lj.x, lj.y, lj.width, lj.height)
            if (lj.isVisible && isIntersects) {
                li.isVisible = false;
            }
        }
    }

    labels
        .each(function() {this.parentNode.appendChild(this)})
        .attr("fill", textColor)
        .transition(trans)
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("opacity", d => (d.isVisible) ? "1" : "0")

}

panel_bubble.prototype.drawXAxe = function (preparedData, trans) {
    const that = this;
    const valXChange = (that.oldValXToShow !== that.valXToShow);

    that.gAxisX.transition(trans).call(that.xAxis);
    const xAxisColor = global.colorValue(that.valXToShow, that.panelSide);
    const xAxisTextColor = global.readableColor(global.colorValue(that.valXToShow, that.panelSide));

    // Draw the background of the X-axis
    let xAxisBackground = that.gAxisX.selectAll(".axisLabelBackground").data([that.valXToShow]);

    let xAxisBackgroundNew = xAxisBackground.enter()
        .insert("svg:rect", "g.tick")
        .attr("class", "axisLabelBackground bordered")
        .attr("x", global.legendOffsetX - that.margin.left)
        .attr("y", global.legendOffsetY)
        .attr("width", that.w - 2 * global.legendOffsetX)
        .attr("height", global.legendHeight)
        .attr("opacity", 0);

    xAxisBackground.enter()
        .insert("svg:text", "g.tick")
        .attr("class", "xAxisValueName legend valLegend")
        .attr("text-anchor", "end")
        .attr("dy", "0.35em");

    xAxisBackground.exit()
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    xAxisBackground = xAxisBackgroundNew.merge(xAxisBackground);

    const xValueText = that.gAxisX.selectAll(".xAxisValueName")
        .text(that.localMeta.indicators[that.valXToShow].caption)
        .attr("fill", xAxisTextColor);

    if (valXChange) {
        xValueText.attr("opacity", 0)
            .transition(trans)
            .attr("opacity", 1);
    }

    const xAxisValueTextWidth = that.gAxisX.selectAll(".xAxisValueName").nodes()[0].getComputedTextLength();

    that.gAxisX.selectAll(".xAxisValueName")
        .attr("transform", "translate(" + (that.width - that.valNamePadding) + ", 25)")

    xAxisBackground
        .attr("rx", global.rectRounding)
        .attr("ry", global.rectRounding)
        .transition(trans)
        .attr("fill", xAxisColor)
        .attr("opacity", 1);

    that.gAxisX.selectAll(".tick text")
        .classed("legend", true)
        .classed("valLegend", true)
        .attr("dy", "0.35em")
        .attr("transform", "translate(0, 16)")

    that.gAxisX.selectAll(".tick text")
        .attr("fill", xAxisTextColor)
        .transition(trans)
        .attr("display", function (d) {
            return (that.xScale(d) > that.width - xAxisValueTextWidth - 40) ? "none" : "inline";
        });
};

panel_bubble.prototype.drawYAxe = function (preparedData, trans) {
    const that = this;
    const valYChange = (that.oldValYToShow !== that.valYToShow);

    const yAxisColor = global.colorValue(that.valYToShow, that.panelSide);
    const yAxisTextColor = global.readableColor(global.colorValue(that.valYToShow, that.panelSide));

    that.gAxisY.transition(trans).call(that.yAxis);

    // Remove the topmost value tick.
    that.gAxisY.selectAll(".tick").filter(function (d) {
        return (that.yScale(d) < 20);
    }).remove();

    that.gAxisY.selectAll(".tick text")
        .classed("legend", true)
        .classed("valLegend", true)
        .style("fill", yAxisTextColor)
        .attr("text-anchor", "middle")
        .attr("transform", "translate(-20, 0)")

    let yAxisBackground = that.gAxisY.selectAll(".tick").selectAll("rect")
        .data([that.valYToShow], d => d);

    const yAxisBackgroundNew = yAxisBackground.enter()
        .insert("svg:rect", "text")
        .attr("class", "axisLabelBackground bordered")
        .attr("x", "-48")
        .attr("y", "-10.4")
        .attr("width", "38px")
        .attr("height", global.legendHeight)
        .attr("opacity", 0);

    yAxisBackground = yAxisBackgroundNew.merge(yAxisBackground);

    yAxisBackground
        .attr("rx", global.rectRounding)
        .attr("ry", global.rectRounding)
        .transition(trans)
        .attr("fill", yAxisColor)
        .attr("opacity", 1);

    yAxisBackground.exit()
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    // Draw the value's name
    let yAxisValueNameBackground = that.gAxisY.selectAll(".yAxisValueNameBackground")
        .data([that.valYToShow], d => d);

    yAxisValueNameBackground.exit()
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    const yAxisValueNameBackgroundNew = yAxisValueNameBackground.enter()
        .append("svg:rect")
        .attr("class", "axisLabelBackground bordered yAxisValueNameBackground")
        .attr("x", -(36 + that.valNamePadding))
        .attr("y", "-10.4")
        .attr("height", global.legendHeight)
        .attr("opacity", 0);

    yAxisValueNameBackground = yAxisValueNameBackgroundNew.merge(yAxisValueNameBackground);

    let yAxisValueNameText = that.gAxisY.selectAll(".yAxisValueNameText")
        .data([that.valYToShow], d => d);

    yAxisValueNameText.exit()
        .remove();
    const yAxisValueNameTextNew = yAxisValueNameText.enter()
        .append("svg:text")
        .attr("class", "yAxisValueName legend valLegend yAxisValueNameText")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("transform", "translate(-40, 0)");

    yAxisValueNameText = yAxisValueNameTextNew.merge(yAxisValueNameText);

    yAxisValueNameText
        .text(that.localMeta.indicators[that.valYToShow].caption);

    const yAxisValueTextWidth = that.gAxisY.selectAll(".yAxisValueNameText").nodes()[0].getComputedTextLength();

    yAxisValueNameText
        .attr("opacity", (valYChange) ? 0 : 1)
        .attr("transform", "translate(" + (yAxisValueTextWidth / 2 - 36) + ", 0)")
        .style("fill", yAxisTextColor)
        .transition(trans)
        .attr("opacity", 1);

    yAxisValueNameBackground
        .attr("rx", global.rectRounding)
        .attr("ry", global.rectRounding)
        .attr("width", yAxisValueTextWidth + 2 * that.valNamePadding)
        .transition(trans)
        .attr("opacity", 1)
        .attr("fill", yAxisColor);
};

panel_bubble.prototype.drawRAxe = function (preparedData, trans) {
    const that = this;

    const valRChange = (that.oldValRToShow !== that.valRToShow);
    const rAxisColor = global.colorValue(that.valRToShow, that.panelSide);
    const rAxisTextColor = global.readableColor(global.colorValue(that.valRToShow, that.panelSide));


    let rAxisBackground = that.gAxisR.selectAll("rect")
        .data([that.valRToShow], d => d);

    rAxisBackground.exit()
        .transition(trans)
        .attr("opacity", 0)
        .remove();

    const rAxisBackgroundNew = rAxisBackground.enter()
        .insert("svg:rect", "text")
        .attr("class", "axisLabelBackground bordered")
        .attr("height", global.legendHeight)
        .attr("opacity", 0);

    rAxisBackground = rAxisBackgroundNew.merge(rAxisBackground);

    rAxisBackground
        .attr("rx", global.rectRounding)
        .attr("ry", global.rectRounding)
        .transition(trans)
        .attr("fill", rAxisColor)
        .attr("opacity", 1);

    let rAxisValueNameText = that.gAxisR.selectAll(".rAxisValueNameText")
        .data([that.valRToShow], d => d);

    const rAxisValueNameTextNew = rAxisValueNameText.enter()
        .append("svg:text")
        .attr("class", "rAxisValueName legend valLegend rAxisValueNameText")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")

    rAxisValueNameText.exit()
        .remove();

    rAxisValueNameText = rAxisValueNameTextNew.merge(rAxisValueNameText);

    rAxisValueNameText
        .text(that.localMeta.indicators[that.valRToShow].caption);

    const rAxisValueTextWidth = that.gAxisR.selectAll(".rAxisValueNameText").nodes()[0].getComputedTextLength();

    const xPos = that.width - rAxisValueTextWidth - 2 * that.valNamePadding;
    const yPos = that.height - 34;

    rAxisValueNameText
        .attr("opacity", (valRChange) ? 0 : 1)
        .attr("x", xPos)
        .attr("y", yPos + global.legendHeight / 2)
        .attr("dx", rAxisValueTextWidth / 2 + that.valNamePadding)
        .style("fill", rAxisTextColor)
        .transition(trans)
        .attr("opacity", 1);

    rAxisBackground
        .attr("rx", global.rectRounding)
        .attr("ry", global.rectRounding)
        .attr("x", xPos)
        .attr("y", yPos)
        .attr("width", rAxisValueTextWidth + 2 * that.valNamePadding)
        .transition(trans)
        .attr("fill", rAxisColor);


}

panel_bubble.prototype.drawLegend = function (trans) {
    const that = this;

    // The dimension label
    that.axisXCaption
        .text(that.localMeta.dimensions[that.dimToShow].caption)
        .attr("text-anchor", "end")
        .transition(trans).attrs({
        x: that.width, y: 0
    });
}


//////////////////////////////////////////////////
// Control functions
//////////////////////////////////////////////////

panel_bubble.prototype.drill = function (d) {
    const that = this;
    global.tooltip.kill();
    const drill = {
        dim: that.dimToShow,
        direction: (d === undefined) ? 1 : -1,
        toId: (d === undefined) ? undefined : d.id,
        toName: (d === undefined) ? undefined : d.name
    };
    that.mediator.publish("drill", drill);
}

panel_bubble.prototype.doChangeValue = function (panelId, value, ratio, targetId) {
    const that = this;

    if (panelId === undefined || panelId === that.panelId) {

        // In case of value change by drag&drop to the title, or a diagram area
        if (value !== undefined && value >= 0) {
            if (targetId === undefined) {

                that.actualInit.val[0] = value;
                that.actualInit.val[1] = value;
                that.actualInit.val[2] = (that.isScatter) ? undefined : value;
            } else {

                const targetIndex = (targetId === "x") ? 0 : (targetId === "y") ? 1 : (targetId === "r") ? 2 : undefined;
                if (targetIndex !== undefined) {
                    that.actualInit.val[targetIndex] = value;
                } else {
                    if (this.valXToShow === this.valYToShow && this.valYToShow === this.valRToShow) {
                        that.actualInit.val[0] = value;
                        that.actualInit.val[1] = value;
                        that.actualInit.val[2] = value;
                        if (ratio !== undefined) {
                            that.valFraction = (ratio === -1) ? !that.valFraction : ratio;
                            that.actualInit.ratio = that.valFraction;
                        }
                    }
                    if (this.valXToShow === this.valYToShow && this.valRToShow === undefined) {

                        that.actualInit.val[0] = value;
                        that.actualInit.val[1] = value;
                        that.actualInit.val[2] = undefined;
                        if (ratio !== undefined) {
                            that.valFraction = (ratio === -1) ? !that.valFraction : ratio;
                            that.actualInit.ratio = that.valFraction;
                        }
                    }
                }
            }
        }

        // In case of ratio change
        if (ratio !== undefined && value === undefined) {
            that.valFraction = (ratio === -1) ? !that.valFraction : ratio;
            that.actualInit.ratio = that.valFraction;
            that.checkAndCorrectFractionSettings();
        }

        // In chase of clicking on the title, and there is only 1 value to show
        if (value === -1 && this.valXToShow === this.valYToShow && (this.valYToShow === this.valRToShow || this.valRToShow === undefined)) {
            that.actualInit.val[0] = (that.valXToShow + 1) % that.localMeta.indicators.length;
            that.actualInit.val[1] = that.actualInit.val[0];
            that.actualInit.val[2] = (that.isScatter) ? undefined : that.actualInit.val[0];
        }

        this.valXToShow = that.actualInit.val[0];
        this.valYToShow = that.actualInit.val[1];
        this.valRToShow = that.actualInit.val[2];

        that.update();
        global.getConfig2();
    }
};

panel_bubble.prototype.checkAndCorrectFractionSettings = function() {
    const that = this;
    if (!that.isScatter) {
        if (that.valFraction && that.localMeta.indicators[that.valXToShow].fraction.hide && that.localMeta.indicators[that.valYToShow].fraction.hide && that.localMeta.indicators[that.valRToShow].fraction.hide) {
            that.valFraction = false;
        }
        if (!that.valFraction && that.localMeta.indicators[that.valXToShow].value.hide && that.localMeta.indicators[that.valYToShow].value.hide && that.localMeta.indicators[that.valRToShow].value.hide) {
            that.valFraction = true;
        }
    } else {
        if (that.valFraction && that.localMeta.indicators[that.valXToShow].fraction.hide && that.localMeta.indicators[that.valYToShow].fraction.hide) {
            that.valFraction = false;
        }
        if (!that.valFraction && that.localMeta.indicators[that.valXToShow].value.hide && that.localMeta.indicators[that.valYToShow].value.hide) {
            that.valFraction = true;
        }
    }
    that.actualInit.ratio = that.valFraction;
}

panel_bubble.prototype.doChangeDimension = function (panelId, newDimId) {
    const that = this;
    if (panelId === that.panelId) {
        that.dimToShow = newDimId;
        that.actualInit.dim = that.dimToShow;
        that.mediator.publish("register", that, that.panelId, [that.dimToShow], that.preUpdate, that.update, that.getConfig);
        global.tooltip.kill();
        that.mediator.publish("drill", {dim: -1, direction: 0, toId: undefined});
    }
};

/**
 * Checks if two rectangles intersect.
 *
 * @param {number} ax - The x-coordinate of the center of the first rectangle.
 * @param {number} ay - The y-coordinate of the center of the first rectangle.
 * @param {number} aw - The width of the first rectangle.
 * @param {number} ah - The height of the first rectangle.
 * @param {number} bx - The x-coordinate of the center of the second rectangle.
 * @param {number} by - The y-coordinate of the center corner of the second rectangle.
 * @param {number} bw - The width of the second rectangle.
 * @param {number} bh - The height of the second rectangle.
 * @returns {boolean} - Returns true if the rectangles intersect, false otherwise.
 */
panel_bubble.prototype.isIntersects = function(ax, ay, aw, ah, bx, by, bw, bh) {
    if (ax + aw/2 < bx - bw/2) {return false;}
    if (bx + bw/2 < ax - aw/2) {return false;}
    if (ay + ah/2 < by - bh/2) {return false;}
    if (by + bh/2 < ay - ah/2) {return false;}
    return true;
};


(function () {
    d3.labeler = function () {

        let index = 666;
        function rnd() {
            index++;
            index = index * 16807 % 2147483647;
            return index / 2147483647.0;
        }

        var labeler = {}, w, h, lab = [], anc = [];

        var max_move = 5.0,
            max_angle = 0.5,
            acc = 0,
            rej = 0;

        //weight
        var weight_label = 30.0,
            weight_label_anc = 30.0,
            weight_len = 0.2;

        const energy = function (index) {
            var m = lab.length,
                ener = 0,
                dx = lab[index].x - anc[index].x, //x dist between point and label
                dy = anc[index].y - lab[index].y, //y dist between point and label
                dist = Math.sqrt(dx * dx + dy * dy);

            // penalty for length of leader line
            if (dist > 0) ener += dist * weight_len;

            var x21 = lab[index].x,
                y21 = lab[index].y - lab[index].height + 2.0,
                x22 = lab[index].x + lab[index].width,
                y22 = lab[index].y + 2.0;
            var x11, x12, y11, y12, x_overlap, y_overlap, overlap_area;
            for (var i = 0; i < m; i++) {
                if (i != index) {
                    //label-label overlap
                    //positions of 4 corners of rect bounding the text
                    x11 = lab[i].x,
                        y11 = lab[i].y - lab[i].height + 2.0,
                        x12 = lab[i].x + lab[i].width,
                        y12 = lab[i].y + 2.0;
                    x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
                    y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
                    overlap_area = x_overlap * y_overlap;
                    ener += (overlap_area * weight_label);
                }
                //label point overlap
                x11 = anc[i].x - anc[i].r; //x start point
                y11 = anc[i].y - anc[i].r; //y start point
                x12 = anc[i].x + anc[i].r; //x end point
                y12 = anc[i].y + anc[i].r; //y end point
                x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
                y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
                overlap_area = x_overlap * y_overlap;
                ener += (overlap_area * weight_label_anc);
            }
            return ener;
        };

        const mcmove = function (currTemp) {
            var i = Math.floor(rnd() * lab.length);

            //save old location of label
            var x_old = lab[i].x;
            var y_old = lab[i].y;

            //old energy
            var old_energy = energy(i);

            //move to a new position
            lab[i].x += (rnd() - 0.5) * max_move;
            lab[i].y += (rnd() - 0.5) * max_move;

            if (lab[i].x > w) { lab[i].x = x_old; }
            if (lab[i].x < 0) { lab[i].x = x_old; }
            if (lab[i].y > h) { lab[i].y = y_old; }
            if (lab[i].y < 0) { lab[i].y = y_old; }

            //new energy
            var new_energy = energy(i);
            //change in energy
            var delta_energy = new_energy - old_energy;

            if (rnd() < Math.exp(-delta_energy / currTemp)) {
                // do nothing, label already at new pos
            } else {
                //go back to the old pos
                lab[i].x = x_old;
                lab[i].y = y_old;
                rej += 1;
            }
        }

        const coolingTemp = function (currTemp, initialTemp, nsweeps) {
            return (currTemp - (initialTemp / nsweeps));
        }
        labeler.start = function (nsweeps) {
            //starts simulated annealing
            var m = lab.length,
                currTemp = 1.0,
                initialTemp = 1.0;
            for (var i = 0; i < nsweeps; i++) {
                for (var j = 0; j < m; j++) {
                    mcmove(currTemp);
                }
                currTemp = coolingTemp(currTemp, initialTemp, nsweeps);
            }
        };
        labeler.width = function (x) {
            w = x;
            return labeler;
        };
        labeler.height = function (x) {
            h = x;
            return labeler;
        };
        labeler.label = function (x) {
            lab = x;
            return labeler;
        };
        labeler.anchor = function (x) {
            anc = x;
            return labeler;
        };
        return labeler;
    };
})();