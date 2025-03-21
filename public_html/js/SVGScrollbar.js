/* global d3 */

'use strict';

/**
 * Létrehoz egy html scrollbart, de egy svg-n belül, svg elemek scrollozására.
 * 
 * @param {Object} parentElement A scollbart tartalmazó szülőelem.
 * @param {Boolean} isHorizontal True: vízszintes, false: függőleges.
 * @param {Number} length A scrollbar hossza, pixelben.
 * @param {Function} scrollFunction A scrollozáskor meghívandó függvény.
 * @param {Number} wheelScrollSize A görgetés szkrollozandó mennyiség.
 * @param {Object} additionalWheelTarget Olyan elem, amelyhez a görgetést még extrán hozzárendeljük.
 * @returns {SVGScrollbar} A scollbar.
 */
function SVGScrollbar(parentElement, isHorizontal, length, scrollFunction, wheelScrollSize, additionalWheelTarget) {
    const that = this;

    this.isHorizontal = isHorizontal;
    this.positionStringToSet = (that.isHorizontal) ? "x" : "y";
    this.lengthStringToSet = (that.isHorizontal) ? "width" : "height";
    this.width = (that.isHorizontal) ? length : global.scrollbarWidth + 1;
    this.height = (that.isHorizontal) ? global.scrollbarWidth + 1 : length;
    this.className = (that.isHorizontal) ? "horizontal" : "vertical";
    this.length = length;
    this.thumbStyle = undefined;
    this.isDragging = false;
    this.scrollRatio = undefined;
    this.scrollThumbLength = undefined;
    this.scrollFunction = scrollFunction;
    this.wheelScrollSize = wheelScrollSize || 10;
    this.dragEvent = undefined;

    // A scroolbart tartalmazó div.
    this.scrollG = parentElement.append("svg:g")
            .attr("class", "svgScrollbarG " + that.className);

    this.scrollTrack = that.scrollG.append("svg:rect")
            .attr("class", "svgScrollbarTrack " + that.className)
            .attr("rx", (global.rectRounding / 2) + "px")
            .attr("width", that.width + "px")
            .attr("height", that.height + "px");

    this.scrollThumb = that.scrollG.append("svg:rect")
            .attr("class", "svgScrollbarThumb " + that.className)
            .attr("rx", (global.rectRounding / 2) + "px")
            .attr("x", "0px")
            .attr("y", "0px")
            .attr("width", that.width + "px")
            .attr("height", that.height + "px");

    let dragStartPosition;
    let dragPosition;

    const dragStarted = function () {
        if (this.dragEvent.which === 1 || this.dragEvent.which === 0) {
            var coords = d3.mouse(that.scrollG.nodes()[0]);
            dragStartPosition = (that.isHorizontal) ? coords[0] : coords[1];
            dragStartPosition = dragStartPosition - parseFloat(that.scrollThumb.attr(that.positionStringToSet));
            this.dragEvent.stopPropagation();
            that.scrollThumb.classed("dragging", true);
        }
    };

    const dragStartedByMouse = function (d) {
        this.dragEvent = d3.event.sourceEvent;
        dragStarted.apply(this);
    };

    const dragStartedByTouch = function (d) {
        this.dragEvent = d3.event;
        dragStarted.apply(this);
    };    

    /**
     * A megfogott réteg húzásakor történő dolgok.
     * 
     * @returns {undefined}
     */
    var dragging = function() {
        // Blokkoljuk a touch-scrollt, ha touchról van szó.
        if (d3.event.preventDefault) {
            d3.event.preventDefault();
            d3.event.stopImmediatePropagation();
        }
        const coords = d3.mouse(that.scrollG.nodes()[0]);
        dragPosition = Math.min(Math.max(0, ((that.isHorizontal) ? coords[0] : coords[1]) - dragStartPosition), that.length - that.scrollThumbLength);
        that.scrollThumb.attr(that.positionStringToSet, dragPosition + "px");
        scrollFunction(dragPosition / that.scrollRatio);
    };

    /**
     * Egérgörgetéskor történő dolgok.
     * 
     * @returns {undefined}
     */
    var zooming = function() {
        const t = d3.event;
        const delta = t.sourceEvent.deltaY;
        if (delta !== undefined) {
            const oldPos = parseFloat(that.scrollThumb.attr(that.positionStringToSet));
            dragPosition = Math.min(Math.max(0, oldPos + Math.sign(delta) * that.wheelScrollSize * that.scrollRatio), that.length - that.scrollThumbLength);
            that.scrollThumb.attr(that.positionStringToSet, dragPosition + "px");
            scrollFunction(dragPosition / that.scrollRatio);
        }
    };

    /**
     * A megfogott réteg elengedésénél történő dolgok.
     *
     * @returns {undefined}
     */
    const dragEnd = function () {
        that.scrollThumb.classed("dragging", false);
    };

    const addDragBehavior = function (elements) {
        elements.call(drag);
    };
    
    const addTouchDragBehavior = function(elements) {
        elements.on("touchstart", dragStartedByTouch);
        elements.on("touchmove", dragging);
        elements.on("touchend", dragEnd);
        elements.on("touchcancel", dragEnd);
    };

    // A drag-viselkedés definiálása.
    const drag = d3.drag()
            .on("start", dragStartedByMouse)
            .on("drag", dragging)
            .on("end", dragEnd);

    const zoom = d3.zoom()
            .filter(function() {
                return event.type === "wheel";
            })
            .on('zoom', zooming);

    if (global.hasTouchScreen) {
        addTouchDragBehavior(this.scrollThumb);
    } else {
        addDragBehavior(this.scrollThumb);
        this.scrollG.call(zoom);
        if (additionalWheelTarget) {
            additionalWheelTarget.call(zoom);
        }
    }
            
}

/**
 * Beállítja a scollbar helyét.
 * 
 * @param {Number} x A bal felső sarok x koordinátája.
 * @param {Number} y A bal felső sarok y koordinátája.
 * @returns {undefined}
 */
SVGScrollbar.prototype.setPosition = function(x, y) {
    this.scrollG
            .attr("transform", "translate(" + x + " " + y + ")");
};

/**
 * Beállítja a scrollbar által szkrollozott terület nagyságát, és a színét.
 * 
 * @param {Number} scrollPaneLength A scrollozott terület nagysága.
 * @param {String} color A scrollbar színe. Ha null vagy undefined, nem változik.
 * @param {Object} trans Az animáció objektum, amelyhez csatlakozni fog.
 * @returns {undefined}
 */
SVGScrollbar.prototype.set = function(scrollPaneLength, color, trans) {
    trans = trans || d3.transition().duration(0);

    this.scrollThumbLength = Math.min(this.length * this.length / scrollPaneLength, this.length);
    this.scrollRatio = this.length / scrollPaneLength;
    this.scrollG.classed("noEvents", (scrollPaneLength <= this.length) ? true : false);

    this.thumbStyle = {};
    this.gStyle = {};

    const oldX = parseFloat(this.scrollThumb.attr(this.positionStringToSet));
    const oldLength = parseFloat(this.scrollThumb.attr(this.lengthStringToSet));

    const newX = oldX * (this.length - this.scrollThumbLength) / (this.length - oldLength) || 0;

    this.gStyle["opacity"] = (scrollPaneLength <= this.length) ? 0 : 1;
    this.thumbStyle["fill"] = color;
    
    this.scrollThumb.transition(trans)
            .attr(this.lengthStringToSet, this.scrollThumbLength + "px")
            .attr(this.positionStringToSet, newX + "px")
            .styles(this.thumbStyle);

    this.scrollG.transition(trans)
            .styles(this.gStyle);

    this.scrollFunction(newX / this.scrollRatio);
};
