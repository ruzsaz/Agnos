/* Lokális értékek beállítása */

'use strict';

// Az adatok beszerzési url-je
// Lokális gép
//var baseUrl = "https://localhost:8443/ARS/";
//var baseUrl = "http://localhost:8080/AgnosReportingServer/";
//var baseUrl = "http://192.168.32.184:8080/ReportingServer";
//var baseUrl = "http://agnos.hu/AgnosReportingServer";
//var baseUrl = "http://10.64.4.21:7979/AgnosReportingServer";  // Zsolt gépe
//var baseUrl = "http://agnos:9091/ars";
//var baseUrl = "http://192.168.1.2:9091/ars";
const baseUrl = "http://localhost:9091/ars";
//const baseUrl = "http://localhost:7979/ars";

var agnosConfig = {};
//agnosConfig.keycloakSettings = {url: 'http://localhost:8080', realm: 'AgnosRealm', clientId: 'agnos'};
agnosConfig.keycloakSettings = {url: 'http://localhost:8082/auth', realm: 'AgnosRealm', clientId: 'agnos'};
//agnosConfig.keycloakSettings = {url: 'http://192.168.1.2:8082/auth', realm: 'AgnosRealm', clientId: 'agnos'};
agnosConfig.url = {
    auth: baseUrl + "/auth/login",
    superMeta: baseUrl + "/meta/cubes",
    meta: baseUrl + "/meta/cube",
    fact: baseUrl + "/cube"};

agnosConfig.i18nRequired = true;
agnosConfig.saveToBookmarkRequired = true;
