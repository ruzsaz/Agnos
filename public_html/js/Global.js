/* global d3, LZString, parseFloat, agnosConfig, stringOrdering */

'use strict';


/**
 * Kiterjeszti a d3.selectiont egy .moveToFront() függvénnyel, ami az adott
 * elemeket a vele egy szinten levő elemek elé mozgatja.
 * 
 * @returns {d3.selection.prototype@call;each}
 */
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};


/**
 * Fordítást végző függvény. "blabla" helyett _("blabla") írandó.
 * 
 * @param {String} string Lefordítandó szöveg
 * @returns {String} A kiválasztott locale-re lefordított szöveg.
 */
var _ = function (string) {    
    return (string) ? string.toLocaleString() : "";
};


/**
 * A globális változók elérését biztosító namespace. (Valójában property-tömb.)
 * 
 * @type _L101.Anonym$8
 */
var global = function () {

//////////////////////////////////////////////////
// Lokálisan használt függvények.
//////////////////////////////////////////////////

    /**
     * Betölt és alkalmaz egy css-t.
     * 
     * @param {String} cssFile Az alkalmazandó css url-je.
     * @returns {undefined}
     */
    var changeCSS = function (cssFile) {
        if (!global.isEmbedded) {
            setCookie("css", cssFile, 730);
        }
        clearTimeout(global.cssChangeTimer);
        global.changeCSSInProgress = true;

        d3.select('body').style("opacity", 0);

        var oldLink = document.getElementById("cssLink");
        oldLink.removeAttribute("id");

        var newLink = document.createElement("link");
        newLink.setAttribute("id", "cssLink");
        newLink.setAttribute("rel", "stylesheet");
        newLink.setAttribute("type", "text/css");
        newLink.setAttribute("href", cssFile);

        document.getElementsByTagName("head").item(0).removeChild(oldLink);
        document.getElementsByTagName("head").item(0).appendChild(newLink);

        resetAfterChangeCSS(cssFile);
        if (global.hasTouchScreen) {
            _recreateElement(document.getElementsByClassName("cssSwitch")[0]);
        }
    };

    /**
     * Css váltás után frissíti a már képernyőn levő tartalmat.
     * 
     * @param {String} cssFile A css url-je.
     * @returns {undefined}
     */
    var resetAfterChangeCSS = function (cssFile) {

        // Megpróbáljuk beolvasni az új css-t
        varsFromCSS = readVarsFromCSS();
        initValuesFromCss();
        const newLink = document.getElementById("cssLink");
        const newCssFile = (newLink === null) ? undefined : newLink.getAttribute("href");

        // Ha nincs css, vagy nem az új, akkor picit később újra megpróbáljuk
        if (newCssFile !== cssFile || colors[0] === undefined) {
            setTimeout(function () {
                resetAfterChangeCSS(cssFile);
            }, 10);
            // Ha megvan az új, akkor végrehajtjuk a változtatást    
        } else {

            global.mediators[0].publish("cssSwitch");
            global.mediators[1].publish("cssSwitch");

            var savedDuration = global.selfDuration;
            global.selfDuration = 0;

            // Féldinamikus (metával megkapott) szövegek átírása.
            global.mediators[0].publish("langSwitch");
            global.mediators[1].publish("langSwitch");

            // Dinamikus (adattal megkapott) szövegek átírása egy önmagába fúrással.
            if (global.facts[0] && global.facts[0].reportMeta) {
                global.mediators[0].publish("drill", {dim: -1, direction: 0});
            }
            if (global.facts[1] && global.facts[1].reportMeta) {
                global.mediators[1].publish("drill", {dim: -1, direction: 0});
            }

            d3.select('body').transition(savedDuration).delay(0).style("opacity", 1)
                    .on("end", function () {
                        global.cssChangeTimer = setTimeout(function () {
                            global.changeCSSInProgress = false;
                        }, 2000);
                        global.selfDuration = savedDuration;
                    });
        }
    };

    /**
     * Átírja a fix szövegeket a beállított nyelvre. A nyelvbeállítás a
     * String.locale beállításával történik.
     * 
     * @returns {undefined}
     */
    var localizeAll = function () {
        $("[origText]").html(function () {
            return _($(this).attr('origText'));
        });
    };

    /**
     * Átalakítja egy sztring filenévben nem szívesen látott karaktereit.
     * 
     * @param {type} input A bemenő sztring.
     * @returns {unresolved} Ugyanaz, gyanús karakterek nélkül.
     */
    var convertFileFriendly = function (input) {
        return input
                .replace(/[őóö]/ig, "o")
                .replace(/[űüú]/ig, "u")
                .replace(/[á]/ig, "a")
                .replace(/[é]/ig, "e")
                .replace(/[í]/ig, "i")
                .replace(/[ŐÖÓ]/ig, "O")
                .replace(/[ŰÚÜ]/ig, "U")
                .replace(/[Á]/ig, "A")
                .replace(/[É]/ig, "E")
                .replace(/[Í]/ig, "I")
                .replace(/[^a-z0-9]/gi, "_");
    };

    /**
     * Kiolvassa a css-be írt változók értékeit.
     * 
     * @returns {Object} A css változók key, value objectként.
     */
    var readVarsFromCSS = function () {
        var configVars = {};
        for (var css = 0, cssMax = document.styleSheets.length; css < cssMax; css++) {
            var sheet = document.styleSheets[css];

            for (var r = 0, rMax = sheet.cssRules.length; r < rMax; r++) {
                var sRule = sheet.cssRules[r].cssText;
                if (sRule.substr(0, 5) === "#less") {
                    var aKey = sRule.match(/\.(\w+)/);
                    var aVal = sRule.match(/: .*;/)[0].replace(": ", "").replace(";", "");
                    if (aKey && aVal) {
                        if (configVars[aKey[1]] === undefined) {
                            configVars[aKey[1]] = aVal;
                        } else if (Array.isArray(configVars[aKey[1]])) {
                            configVars[aKey[1]].push(aVal);
                        } else {
                            configVars[aKey[1]] = [];
                        }
                    }
                }
            }
        }
        return configVars;
    };

    var varsFromCSS = readVarsFromCSS();

    /**
     * Eldönti, hogy egy panel közepe a képrenyőn van-e?
     * 
     * @param {Object} panel A panel.
     * @returns {Boolean} True ha igen, false ha nem.
     */
    var isPanelVisible = function (panel) {
        var rect = $(panel)[0].getBoundingClientRect();
        var x = (rect.left + rect.right) / 2;
        var y = (rect.top + rect.bottom) / 2;
        return (
                x >= 0 &&
                y >= 0 &&
                y <= (window.innerHeight || document.documentElement.clientHeight) &&
                x <= (window.innerWidth || document.documentElement.clientWidth)
                );
    };

    /**
     * Egyetlen, már kiírt  szövegelemet összenyom a megadott pixelméretre.
     * Ha kell levág belőle, ha kell összenyomja a szöveget.
     * 
     * @param {Object} renderedText A kiírt szöveg, mint html objektum.
     * @param {Number} maxSize Maximális méret pixelben.
     * @param {Number} maxRatio Maximum ennyiszeresére nyomható össze a szöveg.
     * @param {Boolean} isVerical True: függőleges a szöveg, false: vízszintes.
     * @param {Boolean} isCenter True: centrálni is kell a szöveget, false: nem.
     * @param {Number} sizeToCenterIn Ha centrálni kell, ekkora területen belül.
     * @returns {undefined}
     */
    var _cleverCompress = function (renderedText, maxSize, maxRatio, isVerical, isCenter, sizeToCenterIn) {
        maxRatio = maxRatio || 1.7;
        if (maxSize < 10) { // 10px alatt üres szöveget csinálunk.
            renderedText.text("");
        } else {
            var textWidth = renderedText.nodes()[0].getBBox().width; // A szöveg pillanatnyi mérete.

            // Ha 1.7-szor nagyobb mértékben kéne összenyomni, akkor levágunk belőle.
            if (textWidth > maxSize * maxRatio) {
                var text = renderedText.text().trim();
                // Preferáljuk a szóköznél vagy -nél történő vágást.
                var cutPositionMin = Math.round((text.length) * (maxSize / textWidth) * (1 + (maxRatio - 1) * 0.28) - 1);
                var cutPositionMax = Math.round((text.length) * (maxSize / textWidth) * maxRatio - 1);
                var tosplit = text.substring(cutPositionMin, cutPositionMax);
                var offset = Math.max(tosplit.lastIndexOf("-"), tosplit.lastIndexOf(" "), tosplit.lastIndexOf("/"));
                var cutPosition = Math.round((offset > -1) ? cutPositionMin + offset : (cutPositionMin + cutPositionMax) / 2);
                var newText = text.substring(0, cutPosition) + "..";
                renderedText.text(newText);
                textWidth = renderedText.nodes()[0].getBBox().width; // A szöveg pillanatnyi mérete.
            }

            var ratio = 1;
            // összenyomjuk, ha nagyobb volt, mint a rendelkezésre álló hely.
            if (textWidth > maxSize) {
                ratio = maxSize / textWidth;
                textWidth = maxSize;
            }

            // Ha össze kellett nyomni, vagy centrálni kell, akkor beállítjuk a transform-mátrixot.
            if (ratio !== 1 || isCenter) {
                var transOrigo = renderedText.attr("x") * (1 - ratio);
                if (isCenter) {
                    transOrigo = transOrigo + (sizeToCenterIn - textWidth) / 2;
                }
                var oldTRansform = ((renderedText.attr("transform") || "") + " ").replace(/matrix.*/g, '');
                renderedText.attr("transform", oldTRansform + "matrix(" + ratio + ",0,0,1," + transOrigo + ",0)");
            }
        }
    };

    /**
     * Segítő függvény path-generáláshoz.
     * 
     * @param {Number} x Pl. 3.
     * @param {Number} y Pl. 5.
     * @returns {String} Ekkor: "3 5 "
     */
    var pathHelper = function (x, y) {
        return x + " " + y + " ";
    };

    /**
     * Hash függvény, amely egy sztringből egész számot generál.
     * 
     * @param {String} str A bemeneti sztring.
     * @returns {Number} Kapott hash-szám.
     */
    var djb2Code = function (str) {
        var hash = 5381;
        for (var i = 0, iMax = str.length; i < iMax; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) + hash) + char;
        }
        return Math.abs(hash);
    };

//////////////////////////////////////////////////
// Globálisan használt függvények.
//////////////////////////////////////////////////

    /**
     * Nyelvállítás előtt kell meghívni. A .loc osztályú tag-ekenél a
     * szöveget berakja egy 'origText' tag-be, hogy arra cuppanjon rá
     * a nyelvállító fordítóJSON.
     * 
     * @returns {undefined}
     */
    var tagForLocalization = function () {
        $(".loc").each(function () {
            if ($(this).attr('origText') === undefined) {
                $(this).attr('origText', function () {
                    return $(this).html().trim().replace(/\r?\n|\r/g, '').replace(/\s\s+/g, ' ');
                });
            }
        });
    };

    /**
     * Beállít egy cookie-t.
     * 
     * @param {String} name A beállítandó cookie neve.
     * @param {String} value A beállítandó cooke értéke.
     * @param {Number} expires Lejárati idő, nap.
     * @returns {undefined}
     */
    var setCookie = function (name, value, expires) {
        var d = new Date();
        d.setTime(d.getTime() + (expires * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    };

    /**
     * Kiolvas egy cookie-t.
     * 
     * @param {String} name A kiolvasandó cookie neve.
     * @returns {String} A kiolvasott cookie értéke, vagy undefined, ha nincs.
     */
    var getCookie = function (name) {
        name = name + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return undefined;
    };

    /**
     * Átáll a kiválasztott nyelvre.
     * 
     * @param {String} lang A nyelv kódja, pl. 'hu', 'en'.
     * @param {Number} side Az átváltandó oldal sorszáma (0, 1, vagy undefined).
     * @returns {undefined}
     */
    var setLanguage = function (lang, side) {
        lang = lang || getCookie("language") || 'en';
        tagForLocalization();
        String.locale = lang;

        // Cookie-ban tárolás.
        if (!global.isEmbedded) {
            setCookie("language", lang, 730);
        }

        // Statikus szövegek átírása.
        localizeAll();

        // Statikus, soknyelvű szövegpanelek (pl. help) átkapcsolása.
        d3.selectAll(".localized").style("display", "none");
        if (d3.selectAll(".localized.language_" + lang).empty()) {
            d3.selectAll(".localized.language_default").style("display", "block");
        } else {
            d3.selectAll(".localized.language_" + lang).style("display", "block");
        }

        if (side === undefined || side === 0) {
            // Féldinamikus (metával megkapott) szövegek átírása.
            global.mediators[0].publish("langSwitch");
            // Dinamikus (adattal megkapott) szövegek átírása egy önmagába fúrással.
            if (global.facts[0] && global.facts[0].reportMeta) {
                global.mediators[0].publish("drill", {dim: -1, direction: 0});
            }
        }
        
        if (side === undefined || side === 1) {
            global.mediators[1].publish("langSwitch");
            if (global.facts[1] && global.facts[1].reportMeta) {
                global.mediators[1].publish("drill", {dim: -1, direction: 0});
            }
        }
        localizedSortArray = global.getFromArrayByLang(stringOrdering, String.locale).ordering;
    };

    /**
     * Kiírja a konzolra a még lefordítatlan statikus sztringeket.
     * 
     * @param {String} lang A kiírandó nyelv nyevlkódja.
     * @returns {undefined}
     */
    var getUntranslated = function (lang) {
        var localeToStore = String.locale;
        String.locale = lang;
        tagForLocalization();
        var untranslated = [];

        // A statikus tartalmak kinyerése
        $("[origText]").text(function () {
            var original = $(this).attr('origText');
            var translated = original.toLocaleString(true);
            if (translated === undefined) {

                untranslated.push(original);
            } else {
                console.log('"' + original + '": "' + translated + '",');
            }

        });

        // A tooltip-ek kinyerése
        $(".tloc[tooltip]").text(function () {
            var original = $(this).attr('tooltip');
            var translated = original.toLocaleString(true);
            if (translated === undefined) {
                untranslated.push(original);
            } else {
                console.log('"' + original + '": "' + translated + '",');
            }
        });

        var untranslatedString = "";
        for (var i = 0, iMax = untranslated.length; i < iMax; i++) {
            untranslatedString = untranslatedString + '"' + untranslated[i] + '": "",\n';
        }
        console.log(untranslatedString);

        String.locale = localeToStore;
    };

    /**
     * Kiírja a pillanatnyilag meglevő panelek konfigurációját a konzolra.
     * 
     * @returns {undefined}
     */
    var getConfig = function () {
        global.mediators[0].publish("getConfig");
        global.mediators[1].publish("getConfig");
    };

    /**
     * Kiírja a konzolra az épp aktuális állapottot embedded-ként beillesztő url-t.
     * 
     * @returns {undefined}
     */
    var getEmbeddedUrl = function() {
        if (global.isEmbedded === false) {
            global.isEmbedded = true;
            getConfigToHash(true);
            global.isEmbedded = false;
        }
    };


    /**
     * Kiegészíti a böngésző URL-jét egy hash-al, ami bookmarkolhatóan
     * tartalmazza a panelek állapotát, a reportokat, és a lefúrási szinteket.
     * 
     * @param {Boolean} onlyForDisplay True: csak a konzolra írja ki, false: elvégzi a beállítást.
     * @returns {undefined}
     */
    var getConfigToHash = function(onlyForDisplay) {
        var startObject = {}; // A bookmarkban tárolandó objektum.
        startObject.e = global.isEmbedded;  // Embedded mód érvényessége.
        startObject.l = String.locale;
        startObject.s = getCookie("css");
        startObject.p = []; // A betöltendő oldalak inicializációs objektumai.
        var panelsToWaitFor = 2;

        // A bal és a jobb oldal konfigurációs sztringjeit feldolgozó callback-függvény.
        var receiveConfig = function (oneSideStartObject) {
            startObject.p.push(oneSideStartObject);
            panelsToWaitFor = panelsToWaitFor - 1;

            // Ha mindkét oldalé megérkezett...
            if (panelsToWaitFor === 0) {

                // A megjelenítési mód (bal, jobb, osztott) kinyerése.
                var displayMode;
                var numberOfSides = d3.selectAll(".container.activeSide[id]").nodes().length; // Hány aktív oldal van? (2 ha osztottkijelzős üzemmód, 1 ha nem.)
                if (numberOfSides === 1) {
                    displayMode = d3.selectAll("#container1.activeSide").nodes().length * 2; // Aktív oldal id-je, 0 vagy 2. Csak akkor ételmes, ha 1 aktív oldal van.
                } else {
                    displayMode = 1;
                }
                startObject.d = displayMode; // A megjelenítési mód: 0: bal, 2: jobb, 1: mindkettő.

                // A képernyőn egy sorba kiférő panelek száma.
                startObject.n = global.panelNumberOnScreen;

                const newUrl = location.origin + location.pathname + "?q=" + LZString.compressToEncodedURIComponent(JSON.stringify(startObject));
                
                // Tényleges URL-be írás. Ha nem kell, kikommentelendő.
                if (global.saveToBookmarkRequired && !onlyForDisplay && !global.isEmbedded) {
                    window.history.replaceState({id: "100"}, "Page 3", newUrl);
                }
                
                if (onlyForDisplay) {
                    console.log(newUrl);
                }
            }
        };

        // Kérés kiküldése a két oldal dataDirector-ja számára.
        global.mediators[0].publish("getConfig", receiveConfig);
        global.mediators[1].publish("getConfig", receiveConfig);        
    };


    /**
     * Logs the current user out from the identity provider
     * 
     * @returns {undefined}
     */
    var logout = function () {
        keycloak.logout();
    };

    /**
     * Starts the login method of the identity provider.
     * 
     * @returns {undefined}
     */
    var login = function () {
        keycloak.login({"prompt": true, "locale": getCookie("language"), "loginHint": getCookie("css")});
    };

    /**
     * Logs out the current user, and starts the login method of the identity provider.
     * 
     * @returns {undefined}
     */
    var reLogin = function () {
        keycloak.logout({"redirectUri": keycloak.createLoginUrl({"redirectUri": location.href})});
    };

    /**
     * If an user is logged in, logs it out, else starts the login process
     * 
     * @returns {undefined}
     */
    var loginOrLogout = function () {
        if (keycloak !== undefined && keycloak.userInfo !== undefined) {
            login();
        } else {
            logout();
        }
    };

    /**
     * Shows the not authenticated dialog when a not logged in user tries to
     * access protected content.
     * 
     * @returns {undefined}
     */
    var showNotAuthenticated = function () {
        setDialog(
                "Bejelentkezés szükséges",
                "<div class='errorStaticText loc' style='text-align:center'>A kért tartalom hozzáférése korlátozott.</div>" +
                "<div class='errorStaticText loc' style='text-align:center; margin-top:1em'>A továblépéshez jelentkezzen be!</div>",
                "Belépés",
                global.login,
                "Mégse",
                function () {
                    location.replace(location.origin + location.pathname);
                },
                1
                );
    };

    /**
     * Shows the not authorized dialog when an user tries to access
     * content not available for him.
     * 
     * @param {type} username Name of the user (for the warning message only)
     * @returns {undefined}
     */
    var showNotAuthorized = function (username) {
        setDialog(
                "Hozzáférés megtagadva",
                "<div class='errorStaticText'><span class='loc'>Sajnálom&nbsp;</span><span style='font-style: italic'>" + username +
                "</span><span class='loc'>, a kért jelentés megtekintésére nem jogosult.</span></div>" +
                "<div class='errorStaticText loc' style='margin-top:1em'>Kérjen hozzáférést az adminisztrátortól, vagy lépjen be más identitással!</div>",
                "Belépés",
                global.reLogin,
                "Mégse",
                function () {
                    location.replace(location.origin + location.pathname);
                },
                2
                );
    };

    /**
     * Aszinkron ajax adatletöltés GET-en át, hibakezeléssel.
     * A keycloak tokent frissíti, ha lejáróban van.
     * 
     * @param {String} url Az URL, ahonnan le kell tölteni.
     * @param {String} data A felküldendő adat.
     * @param {String} callback Sikeres letöltés után meghívandó függvény.
     * @param {Boolean} isDeleteDialogRequired Sikeres letöltés után törölje-e a dialógusablakot?
     * @returns {undefined}
     */
    var get = function (url, data, callback, isDeleteDialogRequired) {
        getWithRetries(url, data, callback, isDeleteDialogRequired, 3);
    };

    /**
     * Aszinkron ajax adatletöltés GET-en át, újrapróbálkozással, hibakezeléssel.
     * A keycloak tokent frissíti, ha lejáróban van.
     * 
     * @param {String} url Az URL, ahonnan le kell tölteni.
     * @param {String} data A felküldendő adat.
     * @param {String} callback Sikeres letöltés után meghívandó függvény.
     * @param {Boolean} isDeleteDialogRequired Sikeres letöltés után törölje-e a dialógusablakot?
     * @param {Nimber} triesLeft Ennyi próbálkozást engedünk meg.
     * @returns {undefined}
     */
    var getWithRetries = function (url, data, callback, isDeleteDialogRequired, triesLeft) {
        triesLeft--;
        var progressDiv = d3.select("#progressDiv");
        var progressCounter = setTimeout(function () {
            progressDiv.style("z-index", 1000);
        }, 200);

        keycloak.updateToken(10).then(function (refreshed) {
            if (refreshed) {
                //console.log('Token is successfully refreshed');
            } else {
                //console.log('Token NOT refreshed');
            }
        }).catch(function () {
            //console.log('Failed to refresh the token, or the session has expired');
        }).finally(() => {
            $.ajax({
                url: url,
                data: data,
                timeout: 5000,
                beforeSend: function (xhr) {
                    if (keycloak.token !== undefined) {
                        xhr.setRequestHeader('authorization', `Bearer ${keycloak.token}`);
                    }
                },
                success: function (result, status) { // Sikeres letöltés esetén.
                    // Esetleges hibaüzenet levétele.
                    if (isDeleteDialogRequired === undefined || isDeleteDialogRequired) {
                        setDialog();
                    }
                    callback(result, status);
                },
                error: function (jqXHR, textStatus, errorThrown) { // Hálózati, vagy autentikációs hiba esetén.
                    $(':focus').blur();
                    // Esetleges homokóra letörlése.
                    clearTimeout(progressCounter);
                    progressDiv.style("z-index", -1);
                    if (jqXHR.status === 401) { // Ha a szerver 'nem vagy autentikálva' választ ad, autentikáljuk.
                        console.log("401-es hiba");
                        showNotAuthenticated();
                    } else if (jqXHR.status === 403) { // Ha az autentikáció jó, de nincs olvasási jog az adathoz
                        console.log("403 error")
                        showNotAuthorized();
                    } else { // Más hiba esetén...    
                        if (triesLeft > 0) {
                            console.log("Hmmm...", jqXHR.status, textStatus, errorThrown, "no problem, ", triesLeft, " tries still left before giving up.");
                            getWithRetries(url, data, callback, isDeleteDialogRequired, triesLeft);
                        } else {
                            alert('Unknown error. Not good...');
                        }
                    }
                },
                complete: function () {
                    // Esetleges homokóra letörlése.
                    clearTimeout(progressCounter);
                    progressDiv.style("z-index", -1);
                }

            });

        });

    };

    /**
     * Loads an external json resource, with possibility to retry it.
     * 
     * @param {String} resource Url to the resource file.
     * @param {Number} triesLeft Tries left before giving up.
     * @returns {Object} The object stored in the json file.
     */
    var loadExternal = async function(resource, triesLeft) {
        if (triesLeft === undefined) {
            triesLeft = 3;
        }
        var base_url = window.location.href.substring(0, window.location.href.indexOf("index.html"));
        
        try {
            const response = await fetch(base_url + resource);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const json = await response.json();
            return json;     
        } catch (error) {
            triesLeft--;
            if (triesLeft < 1) {
                alert('Map file is missing. Not good...');
            } else {
                return await loadExternal(resource, triesLeft);
            }
        }
    };

    /**
     * Egy panel animálásának ideje. Csak azonakat animálja, amelyek
     * középpontja látszik a képernyőn.
     * 
     * @param {String} callerId A fúrást kérő panel azonosítója.
     * @param {String} panelId Az animálandó panel azonosítója.
     * @returns {Number} Az animálás ideje (ms).
     */
    var getAnimDuration = function (callerId, panelId) {
        if (d3.selectAll(".container").nodes().length > 2) {
            return 0;
        }

        var animMode = 1; // 0: mindent animál, 1: csak láthatót animál, 2: csak saját magát
        var duration = 0;
        if (animMode === 0 || callerId === panelId || (animMode === 1 && isPanelVisible(panelId))) {
            duration = global.selfDuration;
        }
        return duration;
    };

    /**
     * Betömörít kiírt feliratokat a megadott helyre.
     * Ha kell levág belőle, ha kell, összenyomja a szöveget.
     * 
     * @param {d3.Selection} renderedTexts Már kirajzolt szövegek összessége, mint d3 selection.
     * @param {Object|Number} renderedParent A kirajzolt szövegdoboz, vagy a mérete pixelben.
     * @param {Number} multiplier A szövegdoboz ennyiszeresét töltse ki maximum a szöveg.
     * @param {Number} maxRatio Maximum ennyiszeresére nyomható össze a szöveg.
     * @param {Boolean} isVertical True: függőleges a szöveg; false: vízszintes.
     * @param {Boolean} isCenter True: centrálni is kell a szöveget, false: nem.
     * @param {Number} sizeToCenterIn Ha centrálni kell, ekkora területen belül. 
     * @returns {undefined}
     */
    var cleverCompress = function (renderedTexts, renderedParent, multiplier, maxRatio, isVertical, isCenter, sizeToCenterIn) {
        var maxTextWidth;
        // Meghatározzuk a szöveg maximális méretét pixelben.
        if (typeof renderedParent === "number") {
            maxTextWidth = multiplier * renderedParent;
        } else {
            maxTextWidth = multiplier * ((isVertical) ? renderedParent.nodes()[0].getBBox().height : renderedParent.nodes()[0].getBBox().width);
        }

        // Egyesével elvégezzük a tömörítést.
        renderedTexts.each(function () {
            _cleverCompress(d3.select(this), maxTextWidth, maxRatio, isVertical, isCenter, sizeToCenterIn);
        });
    };

    /**
     * Egy sztringből rövidítést csinál.
     * 
     * @param {String} str A rövidítendő szöveg.
     * @param {Number} length Maximális karakterszám.
     * @returns {String} A rövidítés.
     */
    var cleverAbbreviate = function(str, length) {
        if (length === undefined) {
            length = 6;
        }
        if (str.length < length) {
            return str;
        }
        if (str.indexOf(" ") <= length) {
            return str.substring(0, str.indexOf(" "));
        }
        const strArray = str.split(" ");        
        const letters = [];
        strArray.forEach(function(e) {letters.push(e.substring(0,1).toLocaleUpperCase());});
        if (letters.length * 3 <=  length + 1) {
            return letters.join(". ") + ".";
        }
        if (letters.length * 2 <= length) {
            return letters.join(".") + ".";
        }
        return letters.join(".").substring(0, length);        
    };


    /**
     * Egy SVG téglalapot kirajzoló path-t generál, opcionálisan lekerekített sarkokkal.
     * 
     * @param {Number} x Balfelső csúcs x koordinátája.
     * @param {Number} y Balfelső csúcs y koordinátája.
     * @param {Number} w Szélesség.
     * @param {Number} h Magasság.
     * @param {Number} r1 Balfelső lekerekítettség pixelben.
     * @param {Number} r2 Jobbfelső lekerekítettség pixelben.
     * @param {Number} r3 Jobbalsó lekerekítettség pixelben.
     * @param {Number} r4 Balalsó lekerekítettség pixelben.
     * @returns {String} A path-ot definiáló karakterlánc.
     */
    var rectanglePath = function (x, y, w, h, r1, r2, r3, r4) {
        var strPath = "M" + pathHelper(x + r1, y); //A
        strPath += "L" + pathHelper(x + w - r2, y) + "Q" + pathHelper(x + w, y) + pathHelper(x + w, y + r2); //B
        strPath += "L" + pathHelper(x + w, y + h - r3) + "Q" + pathHelper(x + w, y + h) + pathHelper(x + w - r3, y + h); //C
        strPath += "L" + pathHelper(x + r4, y + h) + "Q" + pathHelper(x, y + h) + pathHelper(x, y + h - r4); //D
        strPath += "L" + pathHelper(x, y + r1) + "Q" + pathHelper(x, y) + pathHelper(x + r1, y); //A
        strPath += "Z";
        return strPath;
    };

    /**
     * Szám rövid kijelzése kiíráshoz, 3-4 számkarakterrel. (pl. 32.5 Mrd.)
     * 
     * @param {Number} n Kijelzendő szám.
     * @returns {String} A kiírandó sztring.
     */
    var cleverRound2 = function (n) {
        if (n === undefined) {
            return "???";
        }
        if (!isFinite(n)) {
            return "inf";            
        }
        if (Math.abs(n) > 0.01 && Math.abs(n) < 9999.5) {
            return parseFloat(d3.format(".3g")(n)).toLocaleString(String.locale);
        }
        return parseFloat(d3.format(".3s")(n)).toLocaleString(String.locale) + _(d3.format(".3s")(n).replace(/-*\d*\.*\d*/g, ''));        
    };

    /**
     * Szám rövid kijelzése kiíráshoz, max. 4 számkarakterrel. (pl. 32.51 Mrd.)
     * 
     * @param {Number} n Kijelzendő szám.
     * @returns {String} A kiírandó sztring.
     */
    var cleverRound3 = function (n) {
        if (n === undefined) {
            return "???";
        }
        if (!isFinite(n)) {
            return "inf";            
        }
        if (Math.abs(n) > 0.01 && Math.abs(n) < 9999.5) {
            return parseFloat(d3.format(".4g")(n)).toLocaleString(String.locale);
        }
        return parseFloat(d3.format(".4s")(n)).toLocaleString(String.locale) + _(d3.format(".4s")(n).replace(/-*\d*\.*\d*/g, ''));        
    };

    /**
     * Szám hosszabb kijelzése kiíráshoz, max. 6 számkarakterrel. (pl. 35123 M.)
     *  
     * @param {Number} n Kijelzendő szám.
     * @returns {String} A kiírandó sztring.
     */
    var cleverRound5 = function (n) {
        if (n === undefined) {
            return "???";
        }
        if (!isFinite(n)) {
            return "inf";            
        }        
        if (Math.abs(n) > 0.001 && Math.abs(n) < 999999.5) {
            return parseFloat(d3.format(".6g")(n)).toLocaleString(String.locale);
        }
        return parseFloat(d3.format(".6s")(n)).toLocaleString(String.locale) + _(d3.format(".6s")(n).replace(/-*\d*\.*\d*/g, ''));
    };
    
    /**
     * Egy dátumot ember által fogyasztható formában ír ki, a beállított
     * locale-nak megfelelő nyelven (közelmúltat pontosan, távolabbit csak kb.).
     * 
     * @param {Date} date A konvertálandó dátum.
     * @returns {String} A dátumot tartalmazó string.
     */
    var cleverDate = function (date) {
        const now = new Date();
        const diffInDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        if (diffInDays < 3) {
            return date.toLocaleDateString(String.locale, {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"});
        }
        if (diffInDays < 365) {
            return date.toLocaleDateString(String.locale, {year: "numeric", month: "long", day: "numeric"});
        }
        if (diffInDays < 730) {
            return date.toLocaleDateString(String.locale, {year: "numeric", month: "long"});
        }
        return date.toLocaleDateString(String.locale, {year: "numeric"});
    };

    /**
     * Összehasonlít két sztringet lexikografikusan, illetve numerikusan, ha számok.
     * Figyelembe veszi, hogyha az egyik, vagy mindkét sztring szerepel a speciális
     * sorbarendezési tömbben: ekkor ezeket veszi előre, az ottani sorrendjükben.
     * 
     * @param {String} aString Az első összehasonlítandó.
     * @param {String} bString A második összehasonlítandó.
     * @returns {Number} -1 ha aString van előrébb, 1 ha bString, 0 ha azonosak.
     */
    var realCompare = function (aString, bString) {
        const indexA = localizedSortArray.indexOf(aString.toLocaleLowerCase());
        const indexB = localizedSortArray.indexOf(bString.toLocaleLowerCase());
        if (indexA === -1 && indexB === -1) {
            let result = 0;
            try {
                result = aString.localeCompare(bString, String.locale, {numeric: true, sensitivity: 'variant', caseFirst: 'upper'});
            } catch (error) {
                result = aString.localeCompare(bString);
            }
            return result;
        }
        if (indexA === -1) {
            return 1;
        }
        if (indexB === -1) {
            return -1;
        }
        if (indexA < indexB) {
            return -1;
        }
        if (indexA > indexB) {
            return 1;
        }
        return 0;    
    };

    /**
     * Összehasonlít két két részből álló sztringet lexikografikusan,
     * numerikusan, vagy a sorbarendezési lista alapján.
     * Ha a két sztring az első felükben eltér, az alapján, ha azonosak,
     * a második felük alapján.
     * 
     * @param {String} a0String Az első szting első fele.
     * @param {String} a1String Az első sztring másofik fele.
     * @param {String} b0String A második sztring első fele.
     * @param {String} b1String A második sztring másofik fele.
     * @returns {Number} -1 ha a van előrébb, 1 ha b, 0 ha azonosak.
     */
    var realCompare2d = function (a0String, a1String, b0String, b1String) {
        return (a0String !== b0String) ? realCompare(a0String, b0String) : realCompare(a1String, b1String);
    };

    /**
     * Megadja egy érték kijelzésének színét az adott oldalon lévő report számára.
     * 
     * @param {Integer} valueId Az érték sorszáma.
     * @param {Integer} side A panel oldala (0 vagy 1).
     * @returns {String} A hozzá tartozó szín, html kódolva.
     */
    var colorValue = function (valueId, side) {
        return (isNaN(valueId)) ? colorNA : valColors[side][(valueId) % 20];
    };

    /**
     * Beállítja az értékek színét a css séma alapján. Ha a report metában
     * van kért szín, azt is figyelembe veszi.
     * 
     * @param {type} meta A report metája.
     * @param {type} side Az oldal, amely színeit állítani kell (0 vagy 1).
     * @returns {undefined}
     */
    var resetValColorsFromReportMeta = function(meta, side) {
        const availableColors = [];
        for (var i = 0; i < 20; i++) {
            availableColors[i] = {color: colors[i], cielab: _rgb2cielab(_rgbComponents(colors[i]))};
            valColors[side][i] = undefined;
        }
        
        // Beállítjuk a report metában kért színeket, ha egzakt a kérés azt, ha nem, a legközelebbit.
        for (var i = 0; i < meta.indicators.length; i++) {
            const indicator = meta.indicators[i];
            if (indicator.preferredColor !== undefined && indicator.preferredColor !== null && indicator.preferredColor.length > 2) {
                const color = _hexToRgb(indicator.preferredColor);
                if (color) {
                    if (indicator.colorExact) {
                        valColors[side][i] = color;
                    } else {
                        const bestMatchIndex = _getClosestColorIndex(_rgb2cielab(_rgbComponents(color)), availableColors);
                        if (bestMatchIndex !== -1) {
                            valColors[side][i] = availableColors[bestMatchIndex].color;
                            availableColors.splice(bestMatchIndex, 1);
                        }
                    }
                }
            }
        }
        
        // Beállítjuk a külön nem kért színeket is
        for (var i = 0; i < 20; i++) {
            if (valColors[side][i] === undefined) {
                valColors[side][i] = availableColors[0].color;
                availableColors.splice(0, 1);
            }
        }
    };

    /**
     * Hexa kódolt rgb-t rgb(r,g,b) alakba ír.
     * 
     * @param {String} hex A hexa kód, pl. #00ffee.
     * @returns {String} Az rgb kódolt megfelelő, vagy undefined, ha nem sikerül a dekódolás.
     */
    var _hexToRgb = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? "rgb(" + parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) + ")" : undefined;
    };

    /**
     * Megkeresi egy adott színhez legjobban hasonlítót egy szín-tömbben.
     * 
     * @param {Array} colorInCielab A keresett szín a CieL*a*b térben.
     * @param {Array} colorArray A szín tömb.
     * @returns {Integer} A legjobban hasonlító szín indexe, vagy -1 ha nincs.
     */
    var _getClosestColorIndex = function(colorInCielab, colorArray) {
        const result = {min: 9999999, index: -1};
        for (var i = 0; i < colorArray.length; i++) {
            const distance = Math.hypot(colorInCielab[0]-colorArray[i].cielab[0], colorInCielab[1]-colorArray[i].cielab[1], colorInCielab[2]-colorArray[i].cielab[2]);
            if (distance < result.min) {
                result.min = distance;
                result.index = i;
            }
        }
        return result.index;
    };

    /**
     * RGB tömbbé konvertál egy "rgb(1,45,64)" stringet.
     * 
     * @param {String} rgbColorString A szín string formában
     * @returns {Array} Az rgb értékek tömbje.
     */
    var _rgbComponents = function(rgbColorString) {
        const result = rgbColorString.split(",");
        result.forEach(function(item, index, arr) {arr[index] = parseInt(item.match(/\d+/)[0]);});
        return result;
    };

    /**
     * Egy RGB-ben megadott színt CieL*a*b-ban megadottá konvertál.
     * 
     * @param {Array} rgbArray A szín rgb tömbben.
     * @returns {Array} A szín CieL*a*b tömbben.
     */
    var _rgb2cielab = function(rgbArray) {
        var var_R = ( rgbArray[0] / 255.0 );
        var var_G = ( rgbArray[1] / 255.0 );
        var var_B = ( rgbArray[2] / 255.0 );

        var_R = ( var_R > 0.04045 ) ? Math.pow( ( var_R + 0.055 ) / 1.055, 2.4) : var_R / 12.92;
        var_G = ( var_G > 0.04045 ) ? Math.pow( ( var_G + 0.055 ) / 1.055, 2.4) : var_G / 12.92;
        var_B = ( var_B > 0.04045 ) ? Math.pow( ( var_B + 0.055 ) / 1.055, 2.4) : var_B = var_B / 12.92;

        var var_X = (var_R * 41.24 + var_G * 35.76 + var_B * 18.05) / 95.047;
        var var_Y = (var_R * 21.26 + var_G * 71.52 + var_B * 7.22) / 100.000;
        var var_Z = (var_R * 1.93 + var_G * 11.92 + var_B * 95.05) / 108.883;
                
        var_X = ( var_X > 0.008856 ) ? Math.pow(var_X, 1/3) : 7.787*var_X + 0.137931034;
        var_Y = ( var_Y > 0.008856 ) ? Math.pow(var_Y, 1/3) : 7.787*var_Y + 0.137931034;
        var_Z = ( var_Z > 0.008856 ) ? Math.pow(var_Z, 1/3) : 7.787*var_Z + 0.137931034;

        return [116*var_Y - 16,
                500*(var_X-var_Y),
                200*(var_Y-var_Z)];
    };

    /**
     * Megadja egy dimenzióelem kijelzésének színét.
     * 
     * @param {Integer} id A dimenzió azonosítója.
     * @returns {String} A hozzá tartozó szín, html kódolva.
     */
    var color = function (id) {
        return colors[(djb2Code(id) + 4) % 20];
    };

    /**
     * Inicializálja a globális változókat a belépés után.
     * Betölti a superMetát, majd meghívja az induló függvényt.
     * 
     * @param {Function} callback A meghívandó induló függvény.
     * @returns {Global_L27.initGlobals}
     */
    var initGlobals = function (callback) {
        var that = this;
        this.tooltip = new Tooltip();
        get(global.url.superMeta, "", function (result, status) {
            that.superMeta = result.reports;
            callback();
        });
    };

    /**
     * Osztály származtatását megvalósító függvény.
     * 
     * @param {Object} base Szülőpéldány.
     * @returns {Prototype} A gyerek osztály új prototípusa.
     */
    var subclassOf = function (base) {
        var _subclassOf = function () {
        };
        _subclassOf.prototype = base.prototype;
        return new _subclassOf();
    };

    /**
     *  Adott hosszúságú véletlen stringet generál.
     *  
     * @param {Integer} length A kívánt hosszúság. Ha undefined, 16 lesz.
     * @returns {String} A véletlen string.
     */
    var randomString = function (length) {
        length = length || 16;
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

    /**
     * Egy tömböt sorbarendez, és miden elemből csak 1-et tart meg.
     * 
     * @param {Array} arr A rendezendő tömb.
     * @param {Function} sortby Comparator függvény. Ha undefined, az alapértelmezett.
     * @returns {Array} A rendezett, unique tömb.
     */
    var sort_unique = function (arr, sortby) {
        var A1 = arr.slice();
        A1 = (typeof sortby === 'function') ? A1.sort(sortby): A1.sort();

        var last = A1.shift(), next, A2 = [last];
        while (A1.length) {
            next = A1.shift();
            while (next === last) next = A1.shift();
            if (next !== undefined){
                A2[A2.length] = next;
                last = next;
            }
        }
        return A2;
    };

    /**
     * Megkeresi egy tömb elemét a nyelvkód alapján. Ha adott nyelvkódú nincs, akkor a
     * "" nyelvkódut adja vissza. Ha az sincs, akkor a tömb első elemét.
     * 
     * @param {Array} array A tömb.
     * @param {String} lang Nyelvkód. Ha undefined, az aktuálist veszi.
     * @returns {undefined|Globalglobal.getFromArrayByLang.array}
     */
    var getFromArrayByLang = function (array, lang) {
        if (lang === undefined) {
            lang = String.locale;
        }
        var langPropertyNames = ["language", "lang", "languageId"];
        var returnIndex = -1;
        for (var i = 0, iMax = langPropertyNames.length; i < iMax; i++) {
            returnIndex = global.positionInArrayByProperty(array, langPropertyNames[i], lang);
            if (returnIndex === -1) {
                returnIndex = global.positionInArrayByProperty(array, langPropertyNames[i], "");
            }
            if (returnIndex !== -1) {
                break;
            }
        }
        return (returnIndex === -1) ? array[0] : array[returnIndex];
    };

    /**
     * Megkeresi egy tömb elemét az elem egyik property-je alapján.
     * 
     * @param {Array} array A tömb.
     * @param {String} property Az elemek property-je, aminek az értékét vizsgáljuk.
     * @param {Object} value A keresett érték.
     * @returns {Object} A tömb első eleme, amelynek .property -je = value.
     */
    var getFromArrayByProperty = function (array, property, value) {
        var returnIndex = global.positionInArrayByProperty(array, property, value);
        return (returnIndex === -1) ? undefined : array[returnIndex];
    };

    /**
     * Megkeresi egy tömb elemének indexét az elem egyik property-je alapján.
     * 
     * @param {Array} array A tömb.
     * @param {String} property Az elemek property-je, aminek az értékét vizsgáljuk.
     * @param {Object} value A keresett érték.
     * @returns {Integer} A tömb első eleme, amelynek .property -je = value.
     */
    var positionInArrayByProperty = function (array, property, value) {
        var returnIndex = -1;
        for (var i = 0, iMax = array.length; i < iMax; i++) {
            if (array[i][property] === value) {
                returnIndex = i;
                break;
            }
        }
        return returnIndex;
    };
    
    /**
     * Megkeresi egy tömb elemének indexét az elem néhány property-je alapján.
     * 
     * @param {Array} array A tömb.
     * @param {[String]} properties Az elemek property-jei, aminek az értékeit vizsgáljuk.
     * @param {[Object]} values A keresett értékek tömbje.
     * @returns {Integer} A tömb első eleme, amelynek .property -jei = value-k.
     */
    var positionInArrayByProperties = function (array, properties, values) {
        const length = properties.length;
        for (var i = 0, iMax = array.length; i < iMax; i++) {
            var found = true;
            for (var j = 0; j < length; j++) {
                if (array[i][properties[j]] !== values[j]) {
                    found = false;                    
                    break;
                }
            }
            if (found) {
                return i;
            }            
        }
        return -1;
    };
    
    
    /**
     * Egy objektum-tömbből egy tömböt csinál, amely az objektumok egyik propertyeit tartalmazza.
     * 
     * @param {Array} objectArray Az objektumok tömbje.
     * @param {String} property Az elemek propertyje.
     * @returns {Array} A propertykhez tartozó értékek tömbje.
     */
    var getArrayFromObjectArrayByProperty = function (objectArray, property) {
        var arr = [];
        for (var i = 0, iMax = objectArray.length; i < iMax; i++) {
            arr.push(objectArray[i][property]);
        }
        return arr;
    };

    /**
     * Megnézi, hogy a tömb hányadik eleme egy érték.
     * 
     * @param {Array} array A tömb.
     * @param {Object} value A keresett érték.
     * @returns {Integer} -1: nincs benne, különben: ennyiedik.
     */
    var positionInArray = function (array, value) {
        var position = -1;
        for (var i = 0, iMax = array.length; i < iMax; i++) {
            if (array[i] === value) {
                position = i;
                break;
            }
        }
        return position;
    };

    /**
     * Visszaadja az első legalább 1 karakter hosszú szöveget, vagy "-"-t ha nincs.
     * 
     * @param {String} a Első jelölt.
     * @param {String} b Második jelölt.
     * @param {String} c Harmadik jelölt.
     * @param {String} d Negyedik jelölt.
     * @returns {String} Az első érvényes sztring, vagy - ha nincs.
     */
    var getFirstValidString = function(a, b, c, d) {
        if (a !== undefined && a.length > 0) {
            return a;
        }
        if (b !== undefined && b.length > 0) {
            return b;
        }
        if (c !== undefined && c.length > 0) {
            return c;
        }
        if (d !== undefined && d.length > 0) {
            return d;
        }
        return "-";
    };

    /**
     * Nagyítást/kicsinyítést végrehajtó style generálása.
     * 
     * @param {Number} scaleRatio A nagyítás aránya.
     * @param {Number} origX A nagyítás közepének x koordinátája.
     * @param {Number} origY A nagyítás közepének y koordinátája.
     * @returns {String} A beállítandó style.
     */
    var getStyleForScale = function (scaleRatio, origX, origY) {
        return {"-webkit-transform": "scale(" + scaleRatio + ")",
            "-moz-transform": "scale(" + scaleRatio + ")",
            "-ms-transform": "scale(" + scaleRatio + ")",
            "-o-transform": "scale(" + scaleRatio + ")",
            "transform": "scale(" + scaleRatio + ")",
            "-webkit-transform-origin": origX + "px " + origY + "px",
            "-moz-transform-origin": origX + "px " + origY + "px",
            "-ms-transform-origin": origX + "px " + origY + "px",
            "-o-transform-origin": origX + "px " + origY + "px",
            "transform-origin": origX + "px " + origY + "px"};
    };

    /**
     * Eldönti, hogy egy érték a [min, max) intervallumba esik-e?
     * 
     * @param {Number} value Érték.
     * @param {Number} min Minimum.
     * @param {Number} max Maximum.
     * @returns {Boolean} True ha igen, false ha nem.
     */
    var valueInRange = function (value, min, max) {
        return (value < max) && (value >= min);
    };

    /**
     * Olvasható színt választ egy adott háttérszínhez.
     * Ha nincs megadva színkínálat, akkor a a writeOnDimColor/writeOnValColor -ból választ.
     * 
     * @param {String} background Háttér színe.
     * @param {String} primaryColor Elsődleges szín.
     * @param {String} secondaryColor Másodlagos szín.
     * @returns {String} A legjobban olvasható írásszín.
     */
    var readableColor = function (background, primaryColor, secondaryColor) {
        var back = d3.lab(background);
        var primary = (primaryColor) ? d3.lab(primaryColor) : d3.lab(writeOnValColor);
        var secondary = (secondaryColor) ? d3.lab(secondaryColor) : d3.lab(writeOnValColor2);
        var dP = Math.pow((back.l - primary.l), 2) + Math.pow((back.a - primary.a), 2) + Math.pow((back.b - primary.b), 2);
        var dS = Math.pow((back.l - secondary.l), 2) + Math.pow((back.a - secondary.a), 2) + Math.pow((back.b - secondary.b), 2);
        return (dP > dS) ? primary.rgb() : secondary.rgb();
    };

    /**
     * Összekombinál két objektumot, ha egy property mindkettőben szerepel, akkor
     * a másodikbeli értéke lesz, ha csak az elsőben, akkor az.
     * 
     * @param {Object} defaultObj A 'default' értékeket tartalmazó objektum.
     * @param {Object} obj A felhasználó által adott értékeket tartalmazó objektum.
     * @returns {Object} A kombinált objektum.
     */
    var combineObjects = function (defaultObj, obj) {
        var keys = Object.keys(defaultObj);
        var combined = [];
        for (var i = 0; i < keys.length; i++) {
            if ((typeof obj !== "undefined") && (keys[i] in obj)) {
                combined[keys[i]] = obj[keys[i]];
            } else {
                combined[keys[i]] = defaultObj[keys[i]];
            }
        }
        return combined;
    };

    /**
     * Minify-olja és visszaállítja a panelek konstrukciós konstruktorhívó parancsait.
     * 
     * @param {String} initString Átalakítandó sztring.
     * @param {Boolean} isBack Ha true, akkor visszaállít.
     * @returns {String} Az átalakított sztring.
     */
    var minifyInits = function (initString, isBack) {
        // Az oda-visszaalakító szótár. Vigyázni kell, nehogy valamelyik oldalon
        // valami más részhalmazát adjunk meg, mert a csere elbaszódik!
        var dictionary = [
            ['panel_pie', 'PP'],
            ['panel_bar2d', 'PB2'],
            ['panel_barline', 'PB'],
            ['panel_horizontalbar', 'PH'],
            ['panel_map', 'PM'],
            ['panel_table1d', 'PT1'],
            ['panel_table2d', 'PT2'],
            ['panel_sankey', 'PS'],
            ['group:', 'A:'],
            ['position:', 'B:'],
            ['dim:', 'C:'],
            ['dimx:', 'D:'],
            ['dimy:', 'E:'],
            ['dimr:', 'F:'],
            ['dimc:', 'G:'],
            ['val:', 'H:'],
            ['valbars:', 'I:'],
            ['vallines:', 'J:'],
            ['valavglines:', 'K:'],
            ['valpos:', 'L:'],
            ['valneg:', 'M:'],
            ['multiplier:', 'N:'],
            ['ratio:', 'O:'],
            ['streched:', 'P:'],
            ['centered:', 'Q:'],
            ['domain:', 'R:'],
            ['domainr:', 'S:'],
            ['symbols:', 'T:'],
            ['top10:', 'U:'],
            ['range:', 'V:'],
            ['poi:', 'W:'],
            ['mag:', 'X:'],
            ['frommg:', 'Y:'],
            ['shortbyvalue:', 'Sv:'],
            ['visiblePoi', 'Z:'],
            ['false', 'Ff'],
            ['true', 'Tt'],
            ['undefined', 'Uu']
        ];
        initString = initString.replace(/ /g, "");
        var from = (isBack) ? 1 : 0;
        var to = (isBack) ? 0 : 1;
        for (var i = 0, iMax = dictionary.length; i < iMax; i++) {
            initString = initString.replace(new RegExp(dictionary[i][from], "g"), dictionary[i][to]);
        }        
        return initString;
    };

    /**
     * Az oszlopdiagram tengelybetű-méretét határozza meg.
     * 
     * @param {Number} x Az oszlop szélessége pixelben.
     * @returns {Number} Javasolt betűméret (px).
     */
    var axisTextSize = function (x) {
        var size = Math.sin(Math.pow(Math.min(x, 80), 0.92) / 40) * 40;
        return Math.min(size, 32);
    };

    /**
     * Egy szám helyett 0-t ad, ha az NaN, vagy infinite.
     * 
     * @param {Number} n Bejövő szám.
     * @returns {Number} n ha normális szám, 0 különben.
     */
    var orZero = function (n) {
        return isFinite(n) ? n : 0;
    };

    /**
     * Egy adott html elemről megállapítja, hogy melyik panelben van.
     * 
     * @param {Object} element A kérdéses html elem.
     * @returns {String} A tartalmazó panel Id-je, vagy null, ha ilyen nincs.
     */
    var getContainerPanelId = function (element) {
        if (element === null) {
            return null;
        } else if (element.nodeName.toLowerCase() === 'div' && element.id.substring(0, 5) === 'panel') {
            return element.id;
        } else {
            return getContainerPanelId(element.parentNode);
        }
    };

    /**
     * Megmutatja/elrejti a kért help-elemet.
     * 
     * @param {String} item A megmutatandó elem html-id-je.
     * Ha undefined, becsukja a help-et, ha null, az alapértelmezettet mutatja.
     * @returns {undefined}
     */
    var mainToolbar_help = function (item) {
        if (item === undefined) {
            document.getElementById("helpMask").style.opacity = 0;
            setTimeout(function () {
                document.getElementById("helpMask").style.display = "none";
            }, 100);
        } else if (item === null) {
            document.getElementById("helpMask").style.display = "block";
            d3.selectAll(".helpContent > div").style("display", "none");
            d3.selectAll(".helpContent .helpStart").style("display", null);
            d3.selectAll("#helpControl span").classed("activeHelp", false);
            d3.selectAll("#helpControl .startItem").classed("activeHelp", true);
            setTimeout(function () {
                document.getElementById("helpMask").style.opacity = 1;
            }, 5);
        } else {
            var domItem = d3.select(item);
            var link = domItem.attr("data-link");
            d3.selectAll("#helpControl .activeHelp").classed("activeHelp", false);
            domItem.classed("activeHelp", true);
            d3.selectAll(".helpContent > div").style("display", "none");
            d3.selectAll(".helpContent ." + link).style("display", null);
        }
    };

    /**
     * Egyel több, vagy kevesebb panel méretűre kicsinyít/nagyít.
     * 
     * @param {Integer} direction 1: 1-el több panel, -1: 1-el kevesebb.
     * @returns {undefined}
     */
    var mainToolbar_magnify = function (direction) {
        global.mediators[0].publish("magnify", direction);
        global.getConfig2();
    };

    /**
     * Bezárja az épp böngészett reportot.
     * 
     * @returns {undefined}
     */
    var mainToolbar_closeSide = function () {
        d3.select("#progressDiv").style("z-index", -1);
        global.mediators[0].publish("killside", 0);
        global.mediators[1].publish("killside", 1);
        global.getConfig2();
    };

    /**
     * Nézett oldalt vált.
     * 
     * @returns {undefined}
     */
    var mainToolbar_switchSide = function () {
        global.mediators[0].publish("changepanels");
        global.getConfig2();
    };

    /**
     * Új panelt hoz létre.
     * 
     * @param {String} panelType A létrehozandó panel típusa.
     * @returns {undefined}
     */
    var mainToolbar_createNewPanel = function (panelType) {
        global.mediators[0].publish('addPanel', panelType);
        global.mediators[1].publish('addPanel', panelType);
        if (global.hasTouchScreen) {
            _recreateElement(document.getElementsByClassName("newpanel")[0]);        
        }
    };

    /**
     * Elindítja az épp aktív oldal adatmentését.
     * 
     * @returns {undefined}
     */
    var mainToolbar_save = function () {
        global.mediators[0].publish('save');
        global.mediators[1].publish('save');
    };

    /**
     * Képként menti az összes látható panelt.
     * 
     * @returns {undefined}
     */
    var mainToolbar_saveAllImages = function () {
        var side = d3.selectAll("#container1.activeSide").nodes().length; // Aktív oldal id-je, 0 vagy 1. Csak akkor ételmes, ha 1 aktív oldal van.
        var today = new Date();
        var todayString = today.toISOString().slice(0, 10) + "_" + today.toTimeString().slice(0, 8).split(":").join("-");
        var filename = "Agnos"
                + "_" + global.convertFileFriendly(global.facts[side].localMeta.caption)
                + "_" + todayString
                + "_P";
        d3.selectAll(".activeSide div.panel > svg").each(function (d, i) {
            var width = d3.select(this).attr("width");
            var height = d3.select(this).attr("height");
            saveSvgAsPng(this, filename + (i + 1), 2, width, height, 0, 0);
        });
    };

    /**
     * Nyelvet vált.
     * 
     * @param {String} lang A váltandó nyelv kódja.
     * @returns {undefined}
     */
    var mainToolbar_setLanguage = function (lang) {
        if (global.hasTouchScreen) {
            _recreateElement(document.getElementsByClassName("languageSwitch")[0]);        
        }
        global.setLanguage(lang);
    };

    var _recreateElement = function (node) {
        const clonedNode = node.cloneNode(true);
        node.parentNode.insertBefore(clonedNode, node);
        node.remove();
    };

    /**
     * Frissíti az ikonok láthatóságát.
     * 
     * @returns {undefined}
     */
    var mainToolbar_refreshState = function () {
        var numberOfActiveSides = d3.selectAll(".container.activeSide[id]").nodes().length; // Hány aktív oldal van? (2 ha osztottkijelzős üzemmód, 1 ha nem.)
        
        // Alap láthatósági beállítás: ha osztottkijelzős a mód, akkor inaktívak a lokálisra ható gombok.
        d3.selectAll("#mainToolbar .onlyforreport")
                .classed("inactive", (numberOfActiveSides === 2));

        // Ha két panel van, de van betöltött report, akkor a bezárógomb engedélyezve.
        if (numberOfActiveSides === 2 && (!d3.selectAll(".reportHeadPanel").empty())) {
            d3.selectAll("#mainToolbar #mainCloseButton").classed("inactive", false);
        }

        // Ha nem osztott kijelzős a mód, akkor finomhangoljuk a láthatóságot.
        if (numberOfActiveSides === 1) {

            // Megállapítjuk a program állapotát.
            var side = d3.selectAll("#container1.activeSide").nodes().length; // Aktív oldal id-je, 0 vagy 1. Csak akkor ételmes, ha 1 aktív oldal van.
            var isContainsReport = !(d3.selectAll("#container" + side + " .reportHeadPanel").empty()); // True ha épp aktív reportkijelzés van, false ha nem.
            var panelNumber = d3.selectAll("#container" + side + " .panel").nodes().length; // Az épp fennlevő panelek száma.

            // Ha elértük a maximális számot, nem lehet újat létrehozni.
            if (panelNumber > global.maxPanelCount || !isContainsReport) {
                d3.selectAll("#mainToolbar .newpanel").classed("inactive", true);
            }

            // Ha nincs mutatott adat, akkor a mentés, és a bezárás gomb legyen inaktív.
            if (!isContainsReport) {
                d3.selectAll("#mainToolbar .save").classed("inactive", true);
                d3.selectAll("#mainToolbar .save, #mainToolbar #mainCloseButton").classed("inactive", true);
            }

            // Ha nincs megengedve az adatok mentése, akkor a mentrés gomb legyen inaktív.
            if (!(isContainsReport && global.facts[side] && global.facts[side].localMeta && global.facts[side].localMeta.saveAllowed)) {
                d3.selectAll("#mainToolbar .saveAsCsv").classed("inactive", true);
            }

            // Ha nincs területi dimenzió, a mappanel letiltása.
            if (global.facts[side]) {
                var isHaveTerritorial = false;
                if (global.facts[side].localMeta) {
                    for (var d = 0, dMax = global.facts[side].localMeta.dimensions.length; d < dMax; d++) {
                        if (global.facts[side].localMeta.dimensions[d].is_territorial === 1) {
                            isHaveTerritorial = true;
                            break;
                        }
                    }
                }
                d3.selectAll("#mainToolbar .mappanelcreator").classed("inactive", !isHaveTerritorial);
            }
        }

        // + és - gombok.
        d3.selectAll("#mainToolbar #mainPlusButton")
                .classed("inactive", (global.panelNumberOnScreen <= 1));
        d3.selectAll("#mainToolbar #mainMinusButton")
                .classed("inactive", (global.panelNumberOnScreen >= global.maxPanelCount));        
    };

    /**
     * A be- és kifúrásnál a maradandó objektumon végrehajtandó animáció.
     * Klónozza az objetumot, hogy az eredeti átírható legyen.
     * 
     * @param {type} event A kattintás esemény.
     * @param {type} node A maradandó objektum, mint html-dom node.
     * @param {type} transition Az animáció, amelyhez csatlakozni kell.
     * @param {type} to A zoomolásnál a megérkezési nagyítószorzó.
     * @returns {undefined}
     */
    const cloneAndZoom = function(event, node, transition, to) {
        const scrollTop = node.scrollTop;
        const clonedNode = node.cloneNode(true);
        const nodeId = node.getAttribute("id");
        
        node.parentNode.insertBefore(clonedNode, node);
        clonedNode.scrollTop = scrollTop;
        
        const offset = clonedNode.getClientRects()[0];
        const center = (event) ?
                (event.clientX - offset.x)/global.scaleRatio + "px " + (event.clientY - offset.y)/global.scaleRatio + "px" :
                offset.width/2/global.scaleRatio + "px " + (offset.top/2) /global.scaleRatio + "px";

        stripIds(clonedNode);
        d3.select(clonedNode)
                .on("click", null)
                .attr("class", "clonedForZoom " + nodeId)
                .style("transform-origin", center)
                .transition(transition)
                .styleTween("opacity", () => (t) => 1-t)
                .style("transform", "scale(" + to + ")")
                .remove();      
    };

    /**
     * A be- és kifúrásnál a maradandó objektumon végrehajtandó animáció.
     * 
     * @param {type} event A kattintás esemény.
     * @param {type} node A maradandó objektum, mint html-dom node.
     * @param {type} transition Az animáció, amelyhez csatlakozni kell.
     * @param {type} from A zoomolásánál a kiindulási nagyítószorzó.
     * @param {type} to A zoomolásnál a megérkezési nagyítószorzó.
     * @returns {undefined}
     */
    const zoom = function(event, node, transition, from, to) {
        if (to === undefined) {
            to = 1;
        }
        const offset = node.getClientRects()[0];
        const center = (event) ?
                (event.clientX - offset.x)/global.scaleRatio + "px " + (event.clientY - offset.y)/global.scaleRatio + "px" :
                offset.width/2/global.scaleRatio + "px " + (offset.top/2) /global.scaleRatio + "px";
        d3.select(node)
                .style("overflow", "hidden")
                .style("transform-origin", center)
                .style("transform", "scale(" + from + ")")
                .transition(transition)                
                .styleTween("opacity", () => (t) => (from === 1) ? -t : (from < 1) ? t*3 : t*t)
                .style("transform", "scale(" + to + ")")
                .on("end", function() {
                    d3.select(this).style("transform", "none").style("overflow", null);
        });

    };


    const stripIds = function(selector) {
        d3.select(selector).selectAll("*").attr("id", null);
        d3.select(selector).attr("id", null);
    };

    var dialogTimeoutVar; // A dialógusablak időzített eltüntetését számontartó időzítő.

    /**
     * Dialógusablak beállítása/levétele.
     * 
     * @param {String} title A címe.
     * @param {String} body Az ablak hasában levő szöveg html kódja.
     * @param {String} leftButtonLabel Baloldali gomb szövege. Ha undefined, nincs bal gomb.
     * @param {Function} leftButtonFunction Baloldali gomb megnyomásakor lefutó függvény.
     * @param {String} rightButtonLabel Jobboldali gomb szövege. Ha undefined, nincs jobb gomb.
     * @param {Function} rightButtonFunction Jobboldali gomb megnyomásakor lefutó függvény.
     * @param {Integer} enterFunctionNumber Az enter melyik gombklikkelést hajtsa végre? (1: bal, 2: jobb, undefined: semmit se)
     * @param {String} extraButtonLabel Extra gomb szövege.
     * @param {Function} extraButtonFunction Az extra gomb megnyomásakor lefutó függvény.
     * @returns {undefined}
     */
    var setDialog = function (title, body, leftButtonLabel, leftButtonFunction, rightButtonLabel, rightButtonFunction, enterFunctionNumber, extraButtonLabel, extraButtonFunction) {
        clearTimeout(dialogTimeoutVar);
        var dialogMask = d3.select("#dialogMask");
        if (enterFunctionNumber) {
            dialogMask.on("keydown", function () {
                if (d3.event && d3.event.keyCode === 13) {
                    if (enterFunctionNumber === 1 && leftButtonFunction) {
                        leftButtonFunction();
                    } else if (enterFunctionNumber === 2 && rightButtonFunction) {
                        rightButtonFunction();
                    }
                }
            });
        } else {
            dialogMask.on("keydown", null);
        }

        var leftButton = dialogMask.select("#dialogFirstButton");
        var rightButton = dialogMask.select("#dialogSecondButton");
        var extraButton = dialogMask.select("#dialogExtraButton");
        if (title === undefined) { // Ha üres a cím, eltüntetjük a panelt.
            if (dialogMask.style("display") !== "none") {
                dialogMask.style("opacity", 0);
                dialogTimeoutVar = setTimeout(function () {
                    dialogMask.style("display", "none");
                }, 200);
            }
        } else { // Különben megjelenítjük.
            dialogMask.select("h1")
                    .attr("class", "loc")
                    .html(title);
            dialogMask.select("#dialogMessage")
                    .html(body);
            if (leftButtonLabel === undefined) {
                leftButton.classed("hidden", true);
                leftButton.nodes()[0].onclick = undefined;
            } else {
                leftButton.attr("class", "loc").html(leftButtonLabel);
                leftButton.nodes()[0].onclick = leftButtonFunction;
                leftButton.classed("hidden", false);
            }
            if (rightButtonLabel === undefined) {
                rightButton.classed("hidden", true);
                rightButton.nodes()[0].onclick = undefined;
            } else {
                rightButton.attr("class", "loc").html(rightButtonLabel);
                rightButton.nodes()[0].onclick = rightButtonFunction;
                rightButton.classed("hidden", false);
            }
            if (extraButtonLabel === undefined) {
                extraButton.classed("hidden", true);
                extraButton.nodes()[0].onclick = undefined;
            } else {
                extraButton.attr("class", "loc").html(extraButtonLabel);
                extraButton.nodes()[0].onclick = extraButtonFunction;
                extraButton.classed("hidden", false);
            }

            // Fókusz elvétele bármin is volt.
            rightButton.nodes()[0].focus();
            rightButton.nodes()[0].blur();
            dialogMask.style("display", "block");
            setTimeout(function () {
                dialogMask.style("opacity", 1);
                dialogMask.node().focus();
            }, 50);
        }
    };

////////////////////////////////////////////////////
// Lokálisan használt változók.
//////////////////////////////////////////////////

    {
        var writeOnDimColor = varsFromCSS.writeOnDimColor;
        var writeOnValColor = varsFromCSS.writeOnValColor;
        var writeOnValColor2 = varsFromCSS.writeOnValColor2;
    }

//////////////////////////////////////////////////
// Globálisan használt változók.
//////////////////////////////////////////////////

    var hasTouchScreen = false;
    var isMobile = false;
    var isFullscreen = false;
    var changeCSSInProgress = false;
    var isEmbedded = false;
    var preferredUsername = undefined;
    var localizedSortArray = undefined;
    if (keycloak !== undefined && keycloak.userInfo !== undefined) {
        preferredUsername = keycloak.userInfo.preferred_username;
    }

    {
        // Az értékek megjelenését színező színpaletta.
        var colorNA = 'grey';
        var colors = [];
        var valColors = [];
        valColors[0] = [];
        valColors[1] = [];

        // Húzd-és-ejtsd működését vezérlő ojektum.
        var dragDropManager = {
            timer: null, // A megragadást késleltető timer
            scrollRepeaterTimer: null,
            draggedSide: null, // A húzott objektum származási oldala (0 v 1).
            draggedType: null, // A húzott valami típusa: 0: dimenzió, 1: érték.
            draggedId: null, // A húzott valami ID-je.
            previousHoverObject: null,
            hoverObject: null,
            targetObject: null, // A dobás célpont objektuma.
            targetPanelId: null, // A dobás célpontpanelének ID-je.
            targetSide: null, // A dobás célpontpaneljének oldala (0 v 1).
            targetId: null, // A dobás által megváltoztatandó objektum ID-je.
            coordinates: null,
            draggedMatchesTarget: function () {
                return (this.draggedSide === this.targetSide);
            }
        };

        {
            var outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.width = "100px";
            outer.style.msOverflowStyle = "scrollbar";
            document.body.appendChild(outer);
            var widthNoScroll = outer.offsetWidth;
            outer.style.overflow = "scroll";
            // add innerdiv
            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);
            var widthWithScroll = inner.offsetWidth;
            // remove divs
            outer.parentNode.removeChild(outer);
            var scrollBarSize = widthNoScroll - widthWithScroll;
        };                

    }

    /**
     * Normál és teljes képernyős mód között vált.
     * 
     * @returns {undefined}
     */
    const toogleFullscreen = function () {
        const body = d3.select("body");
        if (body.classed("fullscreen")) {
            document.exitFullscreen().then( e => {
                    body.classed("fullscreen", false);
                    global.isFullscreen = false;
            });            
        } else {
            document.body.requestFullscreen({ navigationUI: "hide" }).then( e => {
                    body.classed("fullscreen", true);
                    global.isFullscreen = true;
            });            
        }        
    };

    /**
     * Felderíti és beállítja az eszközre jellemző változókat: touchscreen, mobil-e?
     * 
     * @returns {undefined}
     */
    const initDeviceProperties = function () {
        global.hasTouchScreen = _hasTouchScreen();
        global.isMobile = _detectMobile();
        const optimalMainToolbarHeight = _determineOptimalMainToolbarHeight(global.hasTouchScreen, global.isMobile);        
        _setMainToolbarHeight(optimalMainToolbarHeight);
        if (global.isMobile) {
            document.body.className += " mobile";
            
        }           
    };

    /**
     * Beállítja a felső vezérlőcsík magasságát.
     * 
     * @param {Number} valueInPixels A beállítandó magasság pixelben.
     * @returns {undefined}
     */
    const _setMainToolbarHeight = function(valueInPixels) {
        global.mainToolbarHeight = valueInPixels;
        document.body.style.fontSize = valueInPixels + "px";
    };

    /**
     * Megállapítja a felső vezérlőcsík optimális magasságát.
     * 
     * @param {Boolean} isTouchEnabled Touch az interakciós mód?
     * @param {Boolean} isMobile Mobil/tablet az eszköz?
     * @returns {Number} Az optimális magasság pixelben.
     */
    const _determineOptimalMainToolbarHeight = function(isTouchEnabled, isMobile) {
        if (isTouchEnabled) {
            if (isMobile) {
                return Math.ceil(Math.min(screen.width, screen.height) / 10); 
            } else {
                return Math.ceil(Math.min(screen.width, screen.height) / 16); 
            }
        } else {            
            return Math.max(32, Math.ceil(Math.min(screen.width, screen.height) / 32));
        }
    };

    /**
     * Meghatározza, hogy az eszköz touch vezérlésű-e?
     * 
     * @returns {Boolean} True ha igen, false ha nem.
     */
    const _hasTouchScreen = function() {
        let hasTouchScreen = false;
        if ("maxTouchPoints" in navigator) {
            hasTouchScreen = navigator.maxTouchPoints > 0;
        } else if ("msMaxTouchPoints" in navigator) {
            hasTouchScreen = navigator.msMaxTouchPoints > 0;
        } else {
            const mQ = matchMedia?.("(pointer:coarse)");
            if (mQ?.media === "(pointer:coarse)") {
            hasTouchScreen = !!mQ.matches;
                } else if ("orientation" in window) {
                hasTouchScreen = true; // deprecated, but good fallback
            } else {
                // Only as a last resort, fall back to user agent sniffing
                const UA = navigator.userAgent;
                hasTouchScreen =
                    /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
                    /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
            }
        }
        return hasTouchScreen;
    };

    /**
     * Megállapítja, hogy az eszköz mobil/tablet-e?
     * 
     * @returns {Boolean} True ha igen, False ha nem.
     */
    const _detectMobile = function() {
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);        
        return check;
    };

    /**
     * Az érvnyben levő css-ből kiolvas, és változóba rak néhány értéket.
     * 
     * @returns {undefined}
     */
    var initValuesFromCss = function () {

        // Az értékek megjelenését színező színpaletta.
        global.colorNA = varsFromCSS.valClorNA; // A "nem szám", ill "nem definiált" érték színezési színe.
        for (var i = 0; i < 20; i++) {
            colors[i] = varsFromCSS["valColor" + (i + 1)];
            valColors[0][i] = varsFromCSS["valColor" + (i + 1)];
            valColors[1][i] = varsFromCSS["valColor" + (i + 1)];
        }

        // A CSS-ből kiolvasott értékek.
        global.mapBorder = parseInt(varsFromCSS.elementBorderSize); // A térképi elemek határvonal-vastagsága.
        global.rectRounding = parseInt(varsFromCSS.rounding);  // A téglalapi elemek sarkának lekerekítettsége.
        global.panelWidth = parseInt(varsFromCSS.panelWidth); // Panelek szélessége.
        global.panelMargin = parseInt(varsFromCSS.panelMargin); // Panelek margója.
        global.panelHeight = parseInt(varsFromCSS.panelHeight); // Panelek magassága.
        global.panelBackgroundColor = varsFromCSS.panelBackgroundColor; // Panelek háttérszíne.
        global.axisTextOpacity = varsFromCSS.axisTextOpacity; // Az oszlopdiagramok tengelyszövegének átlátszósága.
        global.fontSizeSmall = parseInt(varsFromCSS.fontSizeSmall); // A legkisebb betűméret.
        global.mainToolbarHeight = parseInt(varsFromCSS.mainToolbarHeight); // A képernyő tetején levő toolbar magassága.

        // Csak lokálisan kell
        writeOnDimColor = varsFromCSS.writeOnDimColor;
        writeOnValColor = varsFromCSS.writeOnValColor;
        writeOnValColor2 = varsFromCSS.writeOnValColor2;

        {
            var outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.width = "100px";
            outer.style.msOverflowStyle = "scrollbar";
            document.body.appendChild(outer);
            var widthNoScroll = outer.offsetWidth;
            outer.style.overflow = "scroll";
            // add innerdiv
            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);
            var widthWithScroll = inner.offsetWidth;
            // remove divs
            outer.parentNode.removeChild(outer);
            scrollBarSize = widthNoScroll - widthWithScroll;
        }

    };

//////////////////////////////////////////////////
// A létrejövő, globálisan elérhető objektum
//////////////////////////////////////////////////

    return {
        
        // Globálisan elérendő változók.        
        url: agnosConfig.url,   // A végpontok elérési url-jét tartalmazó objektum. 
        i18nRequired: agnosConfig.i18nRequired, // Legyen-e nyelvállítás?
        saveToBookmarkRequired: agnosConfig.saveToBookmarkRequired, // Írja-e bookmarkba a pillanatnyi állapotot?
        facts: [], // Az adatokat tartalmazó 2 elemű tömb.
        mapStore: undefined,
        maxPanelCount: 6, // Egy oldalon levő panelek maximális száma.		
        panelNumberOnScreen: undefined, // Megjelenítendő panelszám soronként.
        oldPanelNumberOnScreen: undefined, // Megjelenítendő panelszám soronként.        
        mediators: [], // Az oldalak mediátorát tartalmazó 2 elemű tömb.
        keywordFilters: [[], []],   // Az oldalon épp aktuális report-kulcsszó filter-tömb 2 elemű tömb.
        textFilter: ["", ""], // Az oldalon épp aktuális report filter tartalma, 2 elemű tömb.
        baseLevels: [[], []], // A két oldal aktuális lefúrási szintjeit tartalmazó tömb.
        superMeta: undefined, // SuperMeta: az összes riport adatait tartalmazó leírás.
        scrollbarWidth: scrollBarSize, // Scrollbarok szélessége.
        selfDuration: 800, // A fő animációs időhossz (ms).
        legendOffsetX: 20, // A jelkulcs vízszintes pozicionálása.
        legendOffsetY: 15, // A jelkulcs függőleges pozicionálása.
        panelTitleHeight: 30, // A panelek fejlécének magassága.
        numberOffset: 35, // Ha a panel bal oldalán számkijelzés van a tengelyen, ennyi pixelt foglal.
        legendHeight: 20, // Jelkulcs magassága, px.
        scaleRatio: undefined, // A képernyő svg elemeire vonatkozó nagyítás szorzója.
        dragDropManager: dragDropManager, // Húzd-és-ejtsd működését vezérlő ojektum.
        tooltip: undefined, // Épp aktuális tooltip törzse, html.
        maxEntriesIn1D: 350, // Egy 1D-s panelen megjelenítendő adatelemek maximális száma.
        maxEntriesIn2D: 10000, // Egy 2D-s panelen megjelenítendő adatelemek maximális száma.
        maxEntriesIn3D: 20000, // Egy 3D-s panelen megjelenítendő adatelemek maximális száma.
        niceX: 4, // A vízszintes skála kerekítési finomsága
        niceY: 3, // A függőleges skála kerekítési finomsága (ha csak 1 dim. van, ez használatos)
        captionDistance: 10, // A tengelyekre írandó dimenziónév függőleges távolsága a tengelytől
        preferredUsername: preferredUsername,
        localizedSortArray: localizedSortArray,
        hasTouchScreen: hasTouchScreen, // Érintőképernyőn fut-e a program?
        isMobile: isMobile, // Mobilon/tagleten fut-e a program?
        isFullscreen: isFullscreen, // Teljes képernyős üzemmódban van-e a program?
        isEmbedded: isEmbedded,     // Beágyazott üzemmód van-e?
        changeCSSInProgress: changeCSSInProgress,   // Folyamatban van-e egy css-csere?
        
        // Globálisan elérendő függvények.
        logout: logout, // Logs the current user out from the identity provider
        login: login, // Starts the login method of the identity provider
        reLogin: reLogin, // Logs out the current user, and starts the login method of the identity provider
        loginOrLogout: loginOrLogout, // If an user is logged in, logs it out, else starts the login process        
        changeCSS: changeCSS, // Css-t vált
        tagForLocalization: tagForLocalization, // Nyelvváltoztatás előtt a szövegeket az 'origText' attrib-ba írja.
        localizeAll: localizeAll, // Elvégzi a lokalizálást az épp látható elemeken
        convertFileFriendly: convertFileFriendly, // Átalakítja egy sztring filenévben nem szívesen látott karaktereit.
        setCookie: setCookie, // Beállít egy cookie-t.
        getCookie: getCookie, // Kiolvas egy cookie-t.
        setLanguage: setLanguage, // Nyelvváltoztató függvény.
        axisTextSize: axisTextSize, // Az oszlopdiagram tengelybetű-méretét határozza meg.
        getFromArrayByLang: getFromArrayByLang, // Megkeresi egy tömb elemét a nyalvkód alapján.
        getFromArrayByProperty: getFromArrayByProperty, // Megkeresi egy tömb elemét az elem egyik property-je alapján.
        positionInArrayByProperty: positionInArrayByProperty, // Megkeresi egy tömb elemének indexét az elem egyik property-je alapján.
        positionInArrayByProperties: positionInArrayByProperties, // Megkeresi egy tömb elemének indexét az elem néhány property-je alapján.
        positionInArray: positionInArray, // Megnézi, hogy a tömb hányadik eleme egy érték.
        getArrayFromObjectArrayByProperty: getArrayFromObjectArrayByProperty, // Egy objektum-tömbből egy tömböt csinál, amely az objektumok egyik propertyeit tartalmazza.
        getFirstValidString: getFirstValidString,   // Visszaadja az első legalább 1 karakter hosszú szöveget, vagy "-"-t ha nincs.
        sort_unique: sort_unique,   // Egy tömböt sorbarendez, és miden elemből csak 1-et tart meg.
        valueInRange: valueInRange, // Eldönti, hogy egy érték a [min, max) intervallumba esik-e?
        initGlobals: initGlobals, // Inicializálja a globális változókat a belépés után.
        readableColor: readableColor, //  Olvasható színt választ egy adott háttérszínhez.
        combineObjects: combineObjects, // Összekombinál két objektumot, ha egy property mindkettőben szerepel, akkor a másodikbeli értéke lesz, ha csak az elsőben, akkor az.
        getContainerPanelId: getContainerPanelId, // Egy adott html elemről megállapítja, hogy melyik panelben van.
        mainToolbar_help: mainToolbar_help, // Megmutatja/elrejti a kért help-elemet.
        mainToolbar_magnify: mainToolbar_magnify, // Egyel több, vagy kevesebb panel méretűre kicsinyít/nagyít.
        mainToolbar_closeSide: mainToolbar_closeSide, // Bezárja az épp böngészett reportot.
        mainToolbar_switchSide: mainToolbar_switchSide, // Nézett oldalt vált.
        mainToolbar_createNewPanel: mainToolbar_createNewPanel, // Új panelt hoz létre.
        mainToolbar_save: mainToolbar_save, // Elindítja az épp aktív oldal adatmentését.
        mainToolbar_saveAllImages: mainToolbar_saveAllImages, // Elmenti az összes panelt képként.
        mainToolbar_setLanguage: mainToolbar_setLanguage, // Nyelvet vált.
        mainToolbar_refreshState: mainToolbar_refreshState, // Frissíti az ikonok láthatóságát.
        toogleFullscreen: toogleFullscreen, // Normál és teljes képernyős mód között vált.
        getConfig: getConfig, // Kiírja a pillanatnyilag meglevő panelek konfigurációját a konzolra.
        getUntranslated: getUntranslated, // Kiírja a még lefordítatlan szövegeket a konzolra.
        getEmbeddedUrl: getEmbeddedUrl, // Kiírja a konzolra az épp aktuális állapottot embedded-ként beillesztő url-t.
        getConfig2: getConfigToHash, // A böngésző URL-jébe írja boomarkolhatóan hash-ként az állapotot.
        minifyInits: minifyInits, // Minifyol egy init-stringet, hogy az URL-kódolt verzió kisebb legyen.
        setDialog: setDialog, // Dialógusablak beállítása/levétele.
        get: get, // Aszinkron ajax adatletöltés GET-en át, hibakezeléssel.
        loadExternal: loadExternal, // Loads an external json resource, with possibility to retry it.        
        subclassOf: subclassOf, // Osztály származtatását megvalósító függvény.
        getStyleForScale: getStyleForScale, // Nagyítást/kicsinyítést végrehajtó style generálása.
        orZero: orZero, // Egy szám helyett 0-t ad, ha az NaN, vagy infinite.
        getAnimDuration: getAnimDuration, // Egy panel animálásának ideje.
        cleverRound2: cleverRound2, // Szám rövid kijelzése kiíráshoz, 3-4 számkarakterrel. (pl. 3.5 Mrd.)
        cleverRound3: cleverRound3, // Szám rövid kijelzése kiíráshoz, max 4 számkarakterrel. (pl. 3.51 Mrd.)
        cleverRound5: cleverRound5, // Szám rövid kijelzése kiíráshoz, max 5 számkarakterrel. (pl. 34514 M.)
        cleverDate: cleverDate, // Egy dátumot ember által fogyasztható formában ír ki, a beállított locale-nak megfelelő nyelven.
        realCompare: realCompare, // Pótlás a picit hibásan működő localeCompare helyett.
        realCompare2d: realCompare2d, // 2 részből álló sztringpárt összehasonlít.
        cleverCompress: cleverCompress, // Betömörít kiírt feliratokat a megadott helyre.
        cleverAbbreviate: cleverAbbreviate, // Egy sztringből rövidítést csinál.
        rectanglePath: rectanglePath, // Egy SVG téglalapot kirajzoló path-t generál, opcionálisan lekerekített sarkokkal.
        colorValue: colorValue, // Megadja egy érték kijelzésének színét.
        color: color, // Megadja egy dimenzióelem kijelzésének színét.
        resetValColorsFromReportMeta: resetValColorsFromReportMeta, // Beállítja az értékek színét a css séma alapján.
        randomString: randomString, // Adott hosszúságú véletlen stringet generál.
        initValuesFromCss: initValuesFromCss,   // Az érvnyben levő css-ből kiolvas, és változóba rak néhány értéket.
        initDeviceProperties: initDeviceProperties, // Felderíti és beállítja az eszközre jellemző változókat: touchscreen, mobil-e?
        showNotAuthenticated: showNotAuthenticated, // Shows the not authenticated dialog when a not logged in user tries to access protected content.
        showNotAuthorized: showNotAuthorized,   // Shows the not authorized dialog when an user tries to access content not available for him.
        cloneAndZoom: cloneAndZoom, // A be- és kifúrásnál a maradandó objektumon végrehajtandó animáció. Klónozza az objetumot, hogy az eredeti átírható legyen.
        zoom: zoom  // A be- és kifúrásnál a maradandó objektumon végrehajtandó animáció.
    };

}();

// Elindításkor inicializálandó értékek beállítása.
global.initValuesFromCss();
global.initDeviceProperties();

// Kiírja a konzolra az alkalmazható utasításokat.
if (!global.isEmbedded) {
    console.log("Az épp aktuális panelkonfiguráció, és drillvektor kiíratása: global.getConfig();");
    console.log("A fordítás segítéséhez: global.getUntranslated('lang');");
    console.log("Embedded link kiírása: global.getEmbeddedUrl();");
}