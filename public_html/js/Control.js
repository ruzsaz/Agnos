/* global d3 */

'use strict';


function ControlSlider(parentElement, id, initObject, startValue, callback) {
    const that = this;

    const init = JSON.parse(initObject.parameters);

    this.className = "control slider";

    // A scroolbart tartalmazó div.
    this.container = parentElement.append("html:div")
        .attr("class", "sliderContainer");

    const valueContainer = that.container.append("html:text")
        .attr("class", "actualValue");

    valueContainer
        .style("opacity", 0)
        .text(global.cleverRound2(startValue))
        .transition(d3.transition().duration(global.selfDuration))
        .style("opacity", 1);

    this.container.append("html:input")
        .attr("class", that.className)
        .attr("id", id)
        .attr("type", "range")
        .attr("min", (init === undefined || init.min === undefined) ? 0 : init.min)
        .attr("max", (init === undefined || init.max === undefined) ? 100 : init.max)
        .attr("step", (init === undefined || init.step === undefined) ? 0 : init.step)
        .attr("value", startValue)
        .on("input", function () {
            const value = d3.select(this).property("value");
            valueContainer
                .style("opacity", 0.5)
                .text(global.cleverRound2(value));
        })
        .on("change", function () {
            const value = parseFloat(d3.select(this).property("value"));
            callback(value);
        });
}

ControlSlider.prototype.updateLabels = function (parentElement, newLabels, trans) {
    const value = this.container.select("input").property("value");
    const newValueText = global.cleverRound2(value);
    const valueContainer = this.container.select("text");
    const oldValueText = valueContainer.text();
    if (newValueText !== oldValueText) {
        valueContainer
            .style("opacity", 0)
            .text(newValueText)
    }
    valueContainer.transition(trans).style("opacity", 1);
};


function ControlRadio(parentElement, id, initObject, startValue, callback) {
    const that = this;

    const init = JSON.parse(initObject.parameters);

    const data = [];
    for (let i = 0, iMax = init.values.length; i < iMax; i++) {
        data.push({
            "value": init.values[i],
            "label": (initObject.labels === undefined || initObject.labels.length <= i) ? init.values[i] : initObject.labels[i]
        });
    }

    this.className = "control radio";

    // A scroolbart tartalmazó div.
    this.container = parentElement.append("html:div")
        .attr("class", "radioContainer");

    const valueContainer = that.container.append("html:form")
        .attr("id", id)
        .attr("class", that.className)
        .on("change", function () {
            const value = valueContainer.select('input:checked').node().value;
            callback(value);
        });

    valueContainer
        .style("opacity", 0)
        .transition(d3.transition().duration(global.selfDuration))
        .style("opacity", 1);

    const newRadioOption = valueContainer.selectAll("input").data(data)
        .enter().append("html:p");

    newRadioOption.append("html:input")
        .attr("type", "radio")
        .attr("class", "radioButton")
        .attr("name", id)
        .attr("value", function (d) {
            return d.value;
        });

    newRadioOption.insert("html:label")
        .text(function (d) {
            return d.label;
        });

    // Set the starting value
    valueContainer.select('input[value="' + startValue + '"]').node().checked = true;

}

ControlRadio.prototype.updateLabels = function (parentElement, newLabels, trans) {
    this.container.selectAll("label").data(newLabels)
        .style("opacity", function (d) {
            return (d === d3.select(this).text()) ? 1 : 0;
        })
        .text(function (d) {
            return d;
        }).transition(trans)
        .style("opacity", 1);

};


/* *****************************************
/* Functions to use from the frontend
/* *****************************************

/**
 * Interpolates the function value at a given x using linear interpolation.
 *
 * @param {number} x - The x value at which to interpolate the function value.
 * @param {number[]} xValues - An array of x values.
 * @param {number[]} yValues - An array of corresponding function values.
 * @returns {number} - The interpolated function value at x.
 */
function linearInterpolate(x, xValues, yValues) {
    if (xValues.length !== yValues.length) {
        throw new Error("The length of xValues and yValues must be the same.");
    }

    // Find the interval [x_i, x_{i+1}] that contains x
    for (let i = 0; i < xValues.length - 1; i++) {
        if (x >= xValues[i] && x <= xValues[i + 1]) {
            // Perform linear interpolation
            const t = (x - xValues[i]) / (xValues[i + 1] - xValues[i]);
            return yValues[i] * (1 - t) + yValues[i + 1] * t;
        }
    }

    // If x is outside the range of xValues, return NaN
    return NaN;
}

/**
 * Interpolates the function value at a given x using linear monotonic linear interpolation.
 *
 * @param {number} x - The x value at which to interpolate the function value.
 * @param {number[]} xs - An array of x values.
 * @param {number[]} ys - An array of corresponding function values.
 * @returns {number} - The interpolated function value at x.
 */
function cubicInterpolate(x, xs, ys) {
    const length = xs.length;

    if (length !== ys.length) {
        throw new Error("The length of xValues and yValues must be the same.");
    }
    if (length === 0) {
        return 0;
    }
    if (length === 1) {
        return ys[0];
    }

    let j = 0;

    // Get consecutive differences and slopes
    const dxs = [], ms = [];
    for (let i = 0; i < length - 1; i++) {
        const dx = xs[i + 1] - xs[i], dy = ys[i + 1] - ys[i];
        dxs.push(dx);
        ms.push(dy / dx);
    }
    // Get degree-1 coefficients
    const c1s = [ms[0]];
    for (let i = 0; i < dxs.length - 1; i++) {
        const m = ms[i], mNext = ms[i + 1];
        if (m * mNext <= 0) {
            c1s.push(0);
        } else {
            const dx_ = dxs[i], dxNext = dxs[i + 1], common = dx_ + dxNext;
            c1s.push(3 * common / ((common + dxNext) / m + (common + dx_) / mNext));
        }
    }
    c1s.push(ms[ms.length - 1]);

    // Get degree-2 and degree-3 coefficients
    const c2s = [], c3s = [];
    for (let i = 0; i < c1s.length - 1; i++) {
        const c1 = c1s[i];
        const m_ = ms[i];
        const invDx = 1 / dxs[i];
        const common_ = c1 + c1s[i + 1] - m_ - m_;

        c2s.push((m_ - c1 - common_) * invDx);
        c3s.push(common_ * invDx * invDx);
    }

    // Search for the interval x is in, returning the corresponding y if x is one of the original xs
    let low = 0, mid, high = c3s.length - 1, rval;
    let i;
    while (low <= high) {
        mid = Math.floor(0.5 * (low + high));
        const xHere = xs[mid];
        if (xHere < x) {
            low = mid + 1;
        } else if (xHere > x) {
            high = mid - 1;
        } else {
            j++;
            i = mid;
            const diff = x - xs[i];
            rval = ys[i] + diff * (c1s[i] + diff * (c2s[i] + diff * c3s[i]));
            return rval;
        }
    }
    i = Math.max(0, high);

    // Interpolate
    const diff = x - xs[i];
    j++;
    rval = ys[i] + diff * (c1s[i] + diff * (c2s[i] + diff * c3s[i]));
    return rval;
}

/**
 * Interpolates the function value at a given x using cubic spline interpolation.
 *
 * @param {number} x - The x value at which to interpolate the function value.
 * @param {number[]} xValues - An array of x values.
 * @param {number[]} yValues - An array of corresponding function values.
 * @returns {number} - The interpolated function value at x.
 */
function cubicSplineInterpolate(x, xValues, yValues) {
    if (xValues.length !== yValues.length) {
        throw new Error("The length of xValues and yValues must be the same.");
    }

    // Calculate the coefficients of the cubic spline
    const n = xValues.length - 1;
    const a = yValues.slice();
    const b = new Array(n).fill(0);
    const d = new Array(n).fill(0);
    const h = new Array(n);
    const alpha = new Array(n).fill(0);
    const c = new Array(n + 1).fill(0);
    const l = new Array(n + 1).fill(1);
    const mu = new Array(n + 1).fill(0);
    const z = new Array(n + 1).fill(0);

    for (let i = 0; i < n; i++) {
        h[i] = xValues[i + 1] - xValues[i];
    }

    for (let i = 1; i < n; i++) {
        alpha[i] = (3 / h[i]) * (a[i + 1] - a[i]) - (3 / h[i - 1]) * (a[i] - a[i - 1]);
    }

    for (let i = 1; i < n; i++) {
        l[i] = 2 * (xValues[i + 1] - xValues[i - 1]) - h[i - 1] * mu[i - 1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    for (let j = n - 1; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    // Find the interval [x_i, x_{i+1}] that contains x
    for (let i = 0; i < n; i++) {
        if (x >= xValues[i] && x <= xValues[i + 1]) {
            const deltaX = x - xValues[i];
            return a[i] + b[i] * deltaX + c[i] * deltaX * deltaX + d[i] * deltaX * deltaX * deltaX;
        }
    }

    // If x is outside the range of xValues, return NaN
    return NaN;
}


