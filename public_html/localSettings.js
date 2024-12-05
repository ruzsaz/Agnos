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

//const baseUrl = "http://192.168.1.2:9091/ars"; // Local, azonos alháló, mobil teszteléshez
const baseUrl = "http://localhost:9091/ars";  // For local & prod

var agnosConfig = {};
agnosConfig.keycloakSettings = {url: 'http://localhost:8082/auth', realm: 'AgnosRealm', clientId: 'agnos'};  // For local & prod
//agnosConfig.keycloakSettings = {url: 'http://192.168.1.2:8082/auth', realm: 'AgnosRealm', clientId: 'agnos'};  // Local, azonos alháló, mobil teszteléshez
agnosConfig.url = {
    auth: baseUrl + "/auth/login",
    superMeta: baseUrl + "/reports",
    meta: baseUrl + "/report_meta",
    fact: baseUrl + "/report"};

agnosConfig.i18nRequired = true;
agnosConfig.saveToBookmarkRequired = true;
