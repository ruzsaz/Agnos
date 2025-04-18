'use strict';

// Changelog
var changelog = [
    {
        "language": "hu",
        "history": [
            {"entity": "Agnos", "date": "2025-04-13", "change": "Buborék térkép."},
            {"entity": "Agnos", "date": "2025-03-20", "change": "Kontrol ábrázolható dimenzióként."},
            {"entity": "Agnos", "date": "2025-03-12", "change": "Pontszórás- és buborékdiagram."},
            {"entity": "Agnos", "date": "2025-03-08", "change": "Kontrol elemek és számított mutatók."},
            {"entity": "Agnos", "date": "2025-01-14", "change": "Mutatók opcionális szín meghatározása."},
            {"entity": "AgnosServer", "date": "2025-01-12", "change": "Memória-korlátozás és cache-mentés."},
            {"entity": "Agnos", "date": "2024-12-02", "change": "Kártyás report-elrendezés."},
            {"entity": "Agnos", "date": "2024-10-23", "change": "Mobil- és tabletbarát kialakítás."},
            {"entity": "Agnos", "date": "2024-08-23", "change": "Csv-ként mentés megtiltásának lehetősége."},
            {"entity": "Agnos", "date": "2024-06-18", "change": "Beágyazott Agnos működés."},
            {"entity": "Agnos", "date": "2024-05-28", "change": "Új diagram: szalagdiagram."},
            {"entity": "Agnos", "date": "2024-05-14", "change": "A panelek diagramjai sorbarendezhetőek az értékek szerint is."},
            {"entity": "Agnos", "date": "2024-05-08", "change": "Dimenzió kiírás a paneleken; dimenzió útvonal a fejlécben."},
            {"entity": "Agnos", "date": "2024-04-09", "change": "Panel becsukó gomb a panelek jobb felső sarkában."},
            {"entity": "Agnos", "date": "2023-12-01", "change": "Dimenzió értékek többnyelvűsítése."},
            {"entity": "AgnosServer", "date": "2023-11-27", "change": "Count distinct típusú lekérdezést lehetővé tevő adatkocka integrálása."},
            {"entity": "AgnosServer", "date": "2023-11-16", "change": "Lekérdezés egyszerre több adatkockából."},
            {"entity": "AgnosServer", "date": "2023-09-05", "change": "Keycloak integráció."},
            {"entity": "Agnos", "date": "2023-07-23", "change": "Új térkép: Magyarország, járás réteg"},
            {"entity": "Agnos", "date": "2020-04-08", "change": "Új térképek: Világ, EU, Kína, USA, Ausztrália, Kanada."},
            {"entity": "Agnos", "date": "2020-02-07", "change": "További színsémák hozzáadása."},
            {"entity": "Agnos", "date": "2020-01-29", "change": "Szín és stílusválasztás."},
            {"entity": "Agnos", "date": "2018-11-11", "change": "A help oldalak angol fordítása."},
            {"entity": "Agnos", "date": "2018-05-24", "change": "Egy kiválasztott panel duplájára nagyítható."},
            {"entity": "Agnos", "date": "2018-05-02", "change": "Új panel: 2 dimenziós vonaldiagram."},
            {"entity": "AgnosServer", "date": "2018-04-20", "change": "Áttérés Wildfly alkalmazáskonténerre a biztonságosabb autentikáció érdekében."},
            {"entity": "Agnos", "date": "2018-01-18", "change": "Apróbb javítások."},
            {"entity": "Agnos, AgnosServer", "date": "2018-01-10", "change": "A kétnyelvű xml-ek refaktorálása."},
            {"entity": "Agnos", "date": "2018-01-02", "change": "A 0-val osztás kezelése."},
            {"entity": "Agnos", "date": "2017-12-13", "change": "A panelek húzással áthelyezhetőek."},
            {"entity": "AgnosServer", "date": "2017-12-01", "change": "A szerver felkészítése több nyelv támogatására."},
            {"entity": "AgnosCSVImporter", "date": "2017-10-24", "change": "Rögzített formájú .xls és .xlsx fájlok automatikus betöltése."},
            {"entity": "Agnos", "date": "2017-11-02", "change": "Panelek képként mentése elérhető."}
        ],
        "updated": "2025-03-14"
    },
    {
        "language": "en",
        "history": [
            {"entity": "Agnos", "date": "2025-04-13", "change": "Bubble map added."},
            {"entity": "Agnos", "date": "2025-03-20", "change": "Controls can be drawn as dimensions."},
            {"entity": "Agnos", "date": "2025-03-12", "change": "Scatter and bubble chart."},
            {"entity": "Agnos", "date": "2025-03-08", "change": "Control elements and calculated measures."},
            {"entity": "Agnos", "date": "2025-01-14", "change": "Optional color for indicators."},
            {"entity": "AgnosServer", "date": "2025-01-12", "change": "Memory-restriction and cache preserving."},
            {"entity": "Agnos", "date": "2024-12-02", "change": "Show available reports as cards."},
            {"entity": "Agnos", "date": "2024-10-23", "change": "Mobile and touch friendly solution."},
            {"entity": "Agnos", "date": "2024-08-23", "change": "Disable 'save as csv' on demand."},
            {"entity": "Agnos", "date": "2024-06-18", "change": "Embedded Agnos mechanism introduced."},
            {"entity": "Agnos", "date": "2024-05-28", "change": "New diagram: sankey."},
            {"entity": "Agnos", "date": "2024-05-14", "change": "Diagrams can be sorted by the shown values."},
            {"entity": "Agnos", "date": "2024-05-08", "change": "Display of dimensions on the panels, dimension path on the top panel."},
            {"entity": "Agnos", "date": "2024-04-09", "change": "Close button added to the panels."},
            {"entity": "Agnos", "date": "2023-12-01", "change": "Localization of dimension values."},
            {"entity": "AgnosServer", "date": "2023-11-27", "change": "New type of data cube to allow count distinct type queries."},
            {"entity": "AgnosServer", "date": "2023-11-16", "change": "Parallel queries from separate data cubes."},
            {"entity": "AgnosServer", "date": "2023-09-05", "change": "Keycloak integration."},
            {"entity": "Agnos", "date": "2023-07-23", "change": "New map added: Hungary with járás layer"},
            {"entity": "Agnos", "date": "2020-04-08", "change": "New maps added: World, EU, China, USA, Australia, Canada."},
            {"entity": "Agnos", "date": "2020-02-07", "change": "Additional styles added."},
            {"entity": "Agnos", "date": "2020-01-29", "change": "Color and style selector."},
            {"entity": "Agnos", "date": "2018-11-11", "change": "English translation of the help pages."},
            {"entity": "Agnos", "date": "2018-05-24", "change": "A selected panel can be magnified to 2x."},
            {"entity": "Agnos", "date": "2018-05-02", "change": "New panel: 2-dimensional line chart."},
            {"entity": "AgnosServer", "date": "2018-04-20", "change": "Migration to Wildfly application server to increase security."},
            {"entity": "Agnos", "date": "2018-01-18", "change": "Minor bugfixes."},
            {"entity": "Agnos, AgnosServer", "date": "2018-01-10", "change": "Refactoring of internationalization of the xml files."},
            {"entity": "Agnos", "date": "2018-01-02", "change": "Division by zero allowed. (Hmmm...)"},
            {"entity": "Agnos", "date": "2017-12-13", "change": "Panels can be rearranged."},
            {"entity": "AgnosServer", "date": "2017-12-01", "change": "Localization supported in the server."},
            {"entity": "AgnosCSVImporter", "date": "2017-10-24", "change": "Automatic processing of .xls and .xlsx files."},
            {"entity": "Agnos", "date": "2017-11-02", "change": "Save panels as pictures."}
            
        ],
        "updated": "2025-03-14"
    }
];
