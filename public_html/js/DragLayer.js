/* global d3 */

'use strict';

/**
 * Húzd-és-ejtsd réteg konstruktora.
 * 
 * @param {Integer} side A képernyő-oldal (0 vagy 1).
 * @param {Object} mediator Az oldalhoz tartozó mediátor.
 * @returns {Draglayer} A húzd-és-ejtsd réteg.
 */
function Draglayer(side, mediator) {
    var that = this;

    var container = d3.select("#container" + side);
    var isDragging = false;
    var dragCircle = container.append("html:div")
            .attr("class", "dragCircle");
    const mouseOut = new MouseEvent('mouseout', {'bubbles': true});
    const mouseOver = new MouseEvent('mouseover', {'bubbles': true});

    /**
     * A réteg megfogásakor történő dolgok.
     * 
     * @returns {undefined}
     */
    var dragStarted = function () {
        if ((global.dragDropManager.startEvent.which === 1 || global.dragDropManager.startEvent.which === 0) && !isDragging) {
            isDragging = true;
            var type = (global.dragDropManager.draggedItem.value === undefined) ? 0 : 1; // 0: dimenzió, 1: érték.
            var background = d3.selectAll(this.parentNode.childNodes).filter(".backgroundCell");
            dragCircle.text(global.dragDropManager.draggedItem.caption);
            
            //global.dragDropManager.startEvent.stopPropagation();
            d3.selectAll("svg > *:not(.droptarget" + type + ")").style("pointer-events", "none");
            d3.select(this).classed("dragging", true);
            dragCircle
                    .styles(global.getStyleForScale(1, 1, 1))
                    .style("opacity", 1)
                    .style("display", "block")
                    .style("margin-left", ((-parseFloat(dragCircle.style("width")) / 2) - 15) + "px")
                    .style("background-color", background.style("background-color"))
                    .style("color", background.style("color"));
            
            if (global.dragDropManager.coordinates) {
                dragCircle
                        .style("left", (global.dragDropManager.coordinates[0] / global.scaleRatio) + "px")
                        .style("top", (global.dragDropManager.coordinates[1] / global.scaleRatio) + "px")
                        .style("visibility", "visible");
            }
            
            global.dragDropManager.draggedId = global.dragDropManager.draggedItem.id;
            global.dragDropManager.draggedType = type;
            global.dragDropManager.draggedSide = side;
            global.dragDropManager.scrollVector = 0;            
        }
    };

    var dragStartedByMouse = function (d) {
        global.dragDropManager.startEvent = d3.event.sourceEvent;
        global.dragDropManager.draggedItem = d;
        dragStarted.apply(this);
    };
    
    var dragStartedByTouch = function (d) {
        const that = this;
        global.dragDropManager.startEvent = d3.event;
        global.dragDropManager.draggedItem = d;                
        global.dragDropManager.coordinates = d3.mouse(container.nodes()[0]);        
        global.dragDropManager.timer = setTimeout(function(){dragStarted.apply(that);}, 500);            
    };    

    /**
     * A megfogott réteg húzásakor történő dolgok.
     * 
     * @returns {undefined}
     */
    var dragging = function () {
        clearTimeout(global.dragDropManager.timer);
        if (isDragging) {
            
            // Megragadva scrollozás előkészítése
            global.tooltip.kill();
            const s = 50;
            const posY = d3.event.sourceEvent ? d3.event.sourceEvent.clientY : d3.event.touches[0].clientY;
            //dragCircle.text(posY)
            global.dragDropManager.scrollVector = 0;
            if (posY < s + global.mainToolbarHeight) {
                global.dragDropManager.scrollVector = Math.max(-2, (posY - s - global.mainToolbarHeight) / s);
            } else if (posY > window.innerHeight - s) {
                global.dragDropManager.scrollVector = Math.min(2, (s + posY - window.innerHeight) / s);
            }            
            
            // Blokkoljuk a touch-scrollt, ha touchról van szó.
            if (d3.event.preventDefault) {
                d3.event.preventDefault();
                d3.event.stopImmediatePropagation();
            }
            
            var coordsOnLayer = d3.mouse(container.nodes()[0]);
            dragCircle
                    .style("left", (coordsOnLayer[0] / global.scaleRatio) + "px")
                    .style("top", (coordsOnLayer[1] / global.scaleRatio) + "px")
                    .style("visibility", "visible");

            const coordsOnScreen = d3.mouse(d3.select("body").nodes()[0]);
            global.dragDropManager.hoverObject = document.elementFromPoint((coordsOnScreen[0]), ((coordsOnScreen[1])));
            if (global.dragDropManager.hoverObject !== global.dragDropManager.previousHoverObject) {
                if (global.dragDropManager.previousHoverObject) {
                    global.dragDropManager.previousHoverObject.dispatchEvent(mouseOut);
                }
                if (global.dragDropManager.hoverObject) {
                    global.dragDropManager.hoverObject.dispatchEvent(mouseOver);
                }
            }
            d3.select(dragCircle.node().parentNode).classed("dragging", true);
            global.dragDropManager.previousHoverObject = global.dragDropManager.hoverObject;
            autoScroller();
        }        
    };

    /**
     * A megfogott réteg elengedésénél történő dolgok.
     * 
     * @returns {undefined}
     */
    var dragEnd = function () {
        clearTimeout(global.dragDropManager.timer);
        if ((global.dragDropManager.startEvent.which === 1 || global.dragDropManager.startEvent.which === 0) && isDragging) {
            global.dragDropManager.scrollVector = 0;
            var target = d3.select(global.dragDropManager.targetObject);

            if (!target.empty()) {
                if (global.dragDropManager.draggedType === 0) {
                    mediator.publish("changeDimension", global.dragDropManager.targetPanelId, global.dragDropManager.draggedId, global.dragDropManager.targetId);
                } else if (global.dragDropManager.draggedType === 1) {
                    mediator.publish("changeValue", global.dragDropManager.targetPanelId, global.dragDropManager.draggedId, undefined, global.dragDropManager.targetId);
                }
            }
            d3.select(this).classed("dragging", false);
            d3.selectAll("svg > *").style("pointer-events", null);
            var dragOrigX = parseInt(dragCircle.style("width")) / 2;
            var dragOrigY = parseInt(dragCircle.style("height")) / 2;
            dragCircle
                    .styles(global.getStyleForScale(1, dragOrigX, dragOrigY))
                    .transition().duration(global.selfDuration / 2)
                    .styles(global.getStyleForScale(0, dragOrigX, dragOrigY))
                    .style("opacity", 0)
                    .on("end", function () {
                        d3.select(this)
                                .style("display", null)
                                .style("visibility", null);
                        isDragging = false;
                    });

            if (global.dragDropManager.hoverObject) {
                global.dragDropManager.hoverObject.dispatchEvent(mouseOut);
            }
            global.dragDropManager.draggedId = null;
            global.dragDropManager.draggedType = null;
            global.dragDropManager.draggedSide = null;
            global.dragDropManager.hoverObject = null;
            global.dragDropManager.previousHoverObject = null;
            global.dragDropManager.coordinates = null;

            d3.select(dragCircle.node().parentNode).classed("dragging", false);
        }
    };

    // A drag-viselkedés definiálása.
    this.mouseDrag = d3.drag()            
            .on("start", dragStartedByMouse)
            .on("drag", dragging)
            .on("end", dragEnd);

    mediator.subscribe("addDrag", function (elements) {
        if (!global.hasTouchScreen) {
            that.addDragBehavior(elements);
        } else {            
            addTouchDragBehavior(elements);
        }
    });
        
    const addTouchDragBehavior = function(elements) {
        elements.on("touchstart", dragStartedByTouch);
        elements.on("touchmove", dragging);
        elements.on("touchend", dragEnd);
        elements.on("touchcancel", dragEnd);
    };
    
    const autoScroller = function () {
        if (isDragging) {            
            const offset = Math.round(10 * global.dragDropManager.scrollVector);
            if (offset !== 0) {   
                clearTimeout(global.dragDropManager.scrollRepeaterTimer);                
                const scrollElement = document.getElementById("scrollPaneP" + side);
                const startScrollPosition = scrollElement.scrollTop;
                document.getElementById("scrollPaneP0").scrollBy(0, offset);
                const endScrollPosition = scrollElement.scrollTop;                
                dragCircle.style("top", parseFloat(dragCircle.style("top")) + ((endScrollPosition - startScrollPosition) / global.scaleRatio) + "px");
                global.dragDropManager.scrollRepeaterTimer = setTimeout(autoScroller, 10);
                
            }    
            
        }                
    }
    
    
}

/**
 * A draggolásra megjelölt elemekhez hozzáadjuk a drag-viselkedést.
 * 
 * @param {Array} elements
 * @returns {undefined}
 */
Draglayer.prototype.addDragBehavior = function (elements) {
    elements.call(this.mouseDrag);      
};

// TODO: mobilon képernyőből való kihúzást kezelni
