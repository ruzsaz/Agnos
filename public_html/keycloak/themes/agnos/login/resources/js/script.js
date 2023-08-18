'use strict';

var getCssFile = function () {
    const username = document.querySelector('input').value;
    if (username !== "") {
	document.querySelector('input').value = "";
        setCookie("loginCss", username);
	return username;
    }
    return getCookie("loginCss");
}

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
  if (parts.length == 2) return parts.pop().split(";").shift();
}

window.onload = function() {
    const cssToUse = getCssFile();
    changeCSS("/resources/atk2l/login/agnos/" + cssToUse);
    document.body.setAttribute("style", "opacity: 1");
}