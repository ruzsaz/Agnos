'use strict';

var getCssFile = function () {
    const username = document.querySelector('input').value;
    if (username !== undefined && username.startsWith('css/')) {
	document.querySelector('input').value = "";
        setCookie("loginCss", username);
	return username;
    }
    return getCookie("loginCss");
};

var changeCSS = function (cssFile) {
    var newLink = document.createElement("link");
    newLink.setAttribute("id", "cssLink");
    newLink.setAttribute("rel", "stylesheet");
    newLink.setAttribute("type", "text/css");
    newLink.setAttribute("href", cssFile);
    document.getElementsByTagName("head").item(0).appendChild(newLink);
};

function setCookie(cookieName, cookieValue) {
  document.cookie = cookieName + "=" + cookieValue + "; path=/";
}

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function getBasePath() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        var path = /.*agnos\//g.exec(scripts[i].src);
        if (path !== null) {
            return path[0];
        }
    }
}

const basePath = getBasePath();

window.onload = function() {
    const cssToUse = getCssFile();
    if (cssToUse !== undefined) {
        changeCSS(basePath + cssToUse);
    }
    document.body.setAttribute("style", "opacity: 1");
};