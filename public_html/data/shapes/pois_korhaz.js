'use strict';

// Poi-k
var pois = [
	{
		"caption": "Kórházak",
		"description": "Fekvőbeteg ellátó intézmények",
		"color": "yellow",
		"symbol": 0,
		"points": [
			{
				"caption": "Albert Schweitzer Kh.",
				"description": "Albert Schweitzer Kórház-Rendelőintézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.671268,
				"lon": 19.683757
			},
			{
				"caption": "Alkohol - Drogambulancia",
				"description": "Alkohol - Drogambulancia, Noszlop",
				"size": 4,
				"levels": "1234",
				"lat": 47.166293,
				"lon": 17.460029
			},
			{
				"caption": "Állami Szívkh.",
				"description": "Állami Szívkórház Balatonfüred",
				"size": 4,
				"levels": "1234",
				"lat": 46.956271,
				"lon": 17.895862
			},
			{
				"caption": "Almási Balogh Pál Kh.",
				"description": "Almási Balogh Pál Kórház, Ózd",
				"size": 4,
				"levels": "1234",
				"lat": 48.209288,
				"lon": 20.291166
			},
			{
				"caption": "Árpád-házi Szent Erzsébet SZKh.",
				"description": "Árpád-házi Szent Erzsébet SZKh, Tata",
				"size": 4,
				"levels": "1234",
				"lat": 47.6463,
				"lon": 18.316183
			},
			{
				"caption": "Bács-Kiskun Megyei Kh.",
				"description": "Bács-Kiskun Megyei Kh. Kecskemét",
				"size": 4,
				"levels": "1234",
				"lat": 46.910476,
				"lon": 19.674522
			},
			{
				"caption": "Bajai Szent Rókus Kh.",
				"description": "Bajai Szent Rókus Kh.",
				"size": 4,
				"levels": "1234",
				"lat": 46.174612,
				"lon": 18.959485
			},
			{
				"caption": "Bajcsy-Zsilinszky Kh.",
				"description": "Bajcsy-Zsilinszky Kórház és Ri, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.478062,
				"lon": 19.161342
			},
			{
				"caption": "Batthyány Kázmér SZKh.",
				"description": "Batthyány Kázmér SZKh, Kisbér",
				"size": 4,
				"levels": "1234",
				"lat": 47.499704,
				"lon": 18.024034
			},
			{
				"caption": "BAZ M-i Kh. és Egyetemi Okt. Kh.",
				"description": "BAZ M-i Kh. és Egyetemi Okt. Kh. Miskolc",
				"size": 4,
				"levels": "1234",
				"lat": 48.115837,
				"lon": 20.790196
			},
			{
				"caption": "Békés M-i Körös-menti Szoc.",
				"description": "Békés M-i Körös-menti Szoc. C. Szarvas",
				"size": 4,
				"levels": "1234",
				"lat": 46.663035,
				"lon": 20.671487
			},
			{
				"caption": "Békés Megyei Pándy Kálmán Kh.",
				"description": "Békés Megyei Pándy Kálmán Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.642251,
				"lon": 21.276132
			},
			{
				"caption": "Betegápoló Irgalmas Rend",
				"description": "Betegápoló Irgalmas Rend, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.515931,
				"lon": 19.037167
			},
			{
				"caption": "Betegápoló Irgalmasrend Pécsi Háza",
				"description": "Betegápoló Irgalmasrend Pécsi Háza",
				"size": 4,
				"levels": "1234",
				"lat": 46.075049,
				"lon": 18.22869
			},
			{
				"caption": "Bethánia Rehab. Otthon",
				"description": "Bethánia Rehab. Otthon Alapítvány, Pécs",
				"size": 4,
				"levels": "1234",
				"lat": 45.878131,
				"lon": 18.270362
			},
			{
				"caption": "Bethesda Gyermekkh.",
				"description": "Bethesda Gyermekkórház, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.517817,
				"lon": 19.088451
			},
			{
				"caption": "BMSZKI",
				"description": "BMSZKI, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.521663,
				"lon": 19.075908
			},
			{
				"caption": "Bonyhád, Kh.",
				"description": "Bonyhád, Kh. Ri.",
				"size": 4,
				"levels": "1234",
				"lat": 46.298664,
				"lon": 18.526205
			},
			{
				"caption": "Budai Egészségközpont",
				"description": "Budai Egészségközpont Kft., Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.495568,
				"lon": 19.022153
			},
			{
				"caption": "Budapesti Szent Ferenc Kh.",
				"description": "Budapesti Szent Ferenc Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.526519,
				"lon": 18.976166
			},
			{
				"caption": "Bugát Pál Kh.",
				"description": "Bugát Pál Kórház, Gyöngyös",
				"size": 4,
				"levels": "1234",
				"lat": 47.788002,
				"lon": 19.929846
			},
			{
				"caption": "Kemenesaljai Kh.",
				"description": "Celldömölk, Kemenesaljai Kh.",
				"size": 4,
				"levels": "1234",
				"lat": 47.257706,
				"lon": 17.158593
			},
			{
				"caption": "CSMEK",
				"description": "CSMEK Hódmezõvásárhely - Makó",
				"size": 4,
				"levels": "1234",
				"lat": 46.21641,
				"lon": 20.462192
			},
			{
				"caption": "Csolnoky Ferenc Kh.",
				"description": "Csolnoky Ferenc Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.091299,
				"lon": 17.90848
			},
			{
				"caption": "Csornai Margit Kh.",
				"description": "Csornai Margit Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.611042,
				"lon": 17.246955
			},
			{
				"caption": "Deák Jenõ Kh.",
				"description": "Deák Jenõ Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.884922,
				"lon": 17.441472
			},
			{
				"caption": "Debreceni Egyetem",
				"description": "Debreceni Egyetem Klinikai Központ",
				"size": 4,
				"levels": "1234",
				"lat": 47.555894,
				"lon": 21.626426
			},
			{
				"caption": "Diótörés Alap.",
				"description": "Diótörés Alapítvány, Lulla",
				"size": 4,
				"levels": "1234",
				"lat": 46.774971,
				"lon": 18.026922
			},
			{
				"caption": "Szent Lukács Kh.",
				"description": "Dombóvári Szent Lukács Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.383922,
				"lon": 18.145093
			},
			{
				"caption": "Szent Borbála SzKh.",
				"description": "Dorogi Szent Borbála Szakkh. és Szak.Ri.",
				"size": 4,
				"levels": "1234",
				"lat": 47.71913,
				"lon": 18.732678
			},
			{
				"caption": "Dr. Bugyi István Kh.",
				"description": "Dr. Bugyi István Kórház, Szentes",
				"size": 4,
				"levels": "1234",
				"lat": 46.661651,
				"lon": 20.255472
			},
			{
				"caption": "Dr. Réthy Pál Kh.",
				"description": "Dr. Réthy Pál Kórház-Rendelõintézet",
				"size": 4,
				"levels": "1234",
				"lat": 46.682234,
				"lon": 21.104086
			},
			{
				"caption": "Dr. Kenessey Albert Kh.",
				"description": "Dr .Kenessey Albert Kh-Ri, Balassagyarmat",
				"size": 4,
				"levels": "1234",
				"lat": 48.079691,
				"lon": 19.309609
			},
			{
				"caption": "Koch Róbert Kh.",
				"description": "Edelény, Koch Róbert Kh. és Ri.",
				"size": 4,
				"levels": "1234",
				"lat": 48.294457,
				"lon": 20.728775
			},
			{
				"caption": "Egyesített Szt. István Szt. László Kh",
				"description": "Egyesített Szt. István Szt. László Kh Bp",
				"size": 4,
				"levels": "1234",
				"lat": 47.47555,
				"lon": 19.092216
			},
			{
				"caption": "Emberbarát Alapítvány",
				"description": "Emberbarát Alapítvány, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.481223,
				"lon": 19.130837
			},
			{
				"caption": "Felsõ-Szabolcsi Kh.",
				"description": "Felsõ-Szabolcsi Kórház, Kisvárda",
				"size": 4,
				"levels": "1234",
				"lat": 48.213158,
				"lon": 22.088388
			},
			{
				"caption": "FM-i Szent György Kh.",
				"description": "FM-i Szent György Egyetemi Oktató Kh.",
				"size": 4,
				"levels": "1234",
				"lat": 47.192543,
				"lon": 18.439827
			},
			{
				"caption": "GOKI",
				"description": "GOKI, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.477801,
				"lon": 19.086911
			},
			{
				"caption": "Gr. Esterházy Kh.",
				"description": "Gr. Esterházy Kh. és Ri. Pápa",
				"size": 4,
				"levels": "1234",
				"lat": 47.327217,
				"lon": 17.470511
			},
			{
				"caption": "Gróf Tisza István Kh.",
				"description": "Gróf Tisza István Kórház, Berettyóújfalu",
				"size": 4,
				"levels": "1234",
				"lat": 47.224979,
				"lon": 21.542887
			},
			{
				"caption": "Heim Pál Gyermekkh.",
				"description": "Heim Pál Gyermekkórház, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.478155,
				"lon": 19.092213
			},
			{
				"caption": "Hévízgyógyfürdő",
				"description": "Hévízgyógyfürdő és Szent András Reumakh.",
				"size": 4,
				"levels": "1234",
				"lat": 46.787775,
				"lon": 17.189553
			},
			{
				"caption": "Hospice Szeretetszolgálat",
				"description": "Hospice Szeretetszolgálat, Tatabánya",
				"size": 4,
				"levels": "1234",
				"lat": 47.604061,
				"lon": 18.369678
			},
			{
				"caption": "Hospit Kkt.",
				"description": "Hospit Kkt., Hajdúnánás",
				"size": 4,
				"levels": "1234",
				"lat": 47.845041,
				"lon": 21.440877
			},
			{
				"caption": "INDIT Közalapítvány",
				"description": "INDIT Közalapítvány, Pécs",
				"size": 4,
				"levels": "1234",
				"lat": 46.153134,
				"lon": 18.423298
			},
			{
				"caption": "Jahn Ferenc Dél-pesti Kh.",
				"description": "Jahn Ferenc Dél-pesti Kórház, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.423853,
				"lon": 19.13199
			},
			{
				"caption": "Szent Erzsébet Kh.",
				"description": "Jászberényi Szent Erzsébet Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.493784,
				"lon": 19.911172
			},
			{
				"caption": "Hetényi G. Kh.",
				"description": "JNk-Szolnok M-i Hetényi G. Kh-Ri Szolnok",
				"size": 4,
				"levels": "1234",
				"lat": 47.157469,
				"lon": 20.172157
			},
			{
				"caption": "KAÁLI Intézet",
				"description": "KAÁLI Intézet KFT.",
				"size": 4,
				"levels": "1234",
				"lat": 46.246617,
				"lon": 20.147684
			},
			{
				"caption": "Dorottya Kh.",
				"description": "Kanizsai Dorottya Kórház, Nagykanizsa",
				"size": 4,
				"levels": "1234",
				"lat": 46.452018,
				"lon": 16.999272
			},
			{
				"caption": "Karolina Kh.",
				"description": "Karolina Kórház - RI, Mosonmagyaróvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.87278,
				"lon": 17.26869
			},
			{
				"caption": "Károlyi Sándor Kh.",
				"description": "Károlyi Sándor Kórház, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.558291,
				"lon": 19.10359
			},
			{
				"caption": "Kastélypark Klinika",
				"description": "Kastélypark Klinika Eü. Kft, Tata",
				"size": 4,
				"levels": "1234",
				"lat": 47.647954,
				"lon": 18.317286
			},
			{
				"caption": "Kátai Gábor Kh.",
				"description": "Kátai Gábor Kórház, Karcag",
				"size": 4,
				"levels": "1234",
				"lat": 47.325444,
				"lon": 20.915029
			},
			{
				"caption": "Kazincbarcikai Kh.",
				"description": "Kazincbarcikai Kórház Nonprofit Kft.",
				"size": 4,
				"levels": "1234",
				"lat": 48.253713,
				"lon": 20.618114
			},
			{
				"caption": "Kenézy Gyula Kh.",
				"description": "Kenézy Gyula Kórház és Rendelõintézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.53417,
				"lon": 21.611974
			},
			{
				"caption": "Keszthelyi Kh.",
				"description": "Keszthelyi Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.769633,
				"lon": 17.250981
			},
			{
				"caption": "KIMMTA Zsibrik",
				"description": "KIMMTA Zsibrik",
				"size": 4,
				"levels": "1234",
				"lat": 46.237356,
				"lon": 18.582765
			},
			{
				"caption": "Kiskunhalasi Semmelweis Kh.",
				"description": "Kiskunhalasi Semmelweis Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.433044,
				"lon": 19.471555
			},
			{
				"caption": "Komlói Egészségcentrum",
				"description": "Komlói Egészségcentrum",
				"size": 4,
				"levels": "1234",
				"lat": 46.188709,
				"lon": 18.272125
			},
			{
				"caption": "Kunhegyesi Szakorvosi és Áp. Int.",
				"description": "Kunhegyesi Szakorvosi és Ápolási Intézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.368031,
				"lon": 20.62943
			},
			{
				"caption": "LEO AMICI 2002",
				"description": "LEO AMICI 2002 Alapítvány, Pécs",
				"size": 4,
				"levels": "1234",
				"lat": 46.183291,
				"lon": 18.27143
			},
			{
				"caption": "Lumniczer Sándor Kh.",
				"description": "Lumniczer Sándor Kh-RI., Kapuvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.595058,
				"lon": 17.024309
			},
			{
				"caption": "Magyar Hospice Alapítvány",
				"description": "Magyar Hospice Alapítvány, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.53737,
				"lon": 19.036786
			},
			{
				"caption": "Magyar Imre Kh.",
				"description": "Magyar Imre Kórház Ajka",
				"size": 4,
				"levels": "1234",
				"lat": 47.111523,
				"lon": 17.563824
			},
			{
				"caption": "Magyar Kékkereszt Egyesület",
				"description": "Magyar Kékkereszt Egyesület",
				"size": 4,
				"levels": "1234",
				"lat": 47.766807,
				"lon": 18.902571
			},
			{
				"caption": "Margit Kh.",
				"description": "Margit Kórház, Pásztó",
				"size": 4,
				"levels": "1234",
				"lat": 47.918742,
				"lon": 19.692522
			},
			{
				"caption": "Markhot Ferenc OKh.",
				"description": "Markhot Ferenc Oktatókórház és Ri.",
				"size": 4,
				"levels": "1234",
				"lat": 47.903473,
				"lon": 20.375515
			},
			{
				"caption": "Markusovszky Egyetemi Okh.",
				"description": "Markusovszky Egyetemi Oktatókórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.237439,
				"lon": 16.620452
			},
			{
				"caption": "Mátrai Gyógyintézet",
				"description": "Mátrai Gyógyintézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.867747,
				"lon": 19.977082
			},
			{
				"caption": "MAZSIHISZ",
				"description": "MAZSIHISZ, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.517292,
				"lon": 19.098943
			},
			{
				"caption": "Mellkasi Betegségek Szakkórháza",
				"description": "Mellkasi Betegségek Szakkórháza, Deszk",
				"size": 4,
				"levels": "1234",
				"lat": 46.217433,
				"lon": 20.235544
			},
			{
				"caption": "Mérföldkő Egyesület",
				"description": "Mérföldkő Egyesület, Kovácsszénája",
				"size": 4,
				"levels": "1234",
				"lat": 46.170885,
				"lon": 18.108344
			},
			{
				"caption": "Mezõtúri Kh.",
				"description": "Mezõtúri Kórház és Rendelõintézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.002186,
				"lon": 20.629014
			},
			{
				"caption": "MH EK",
				"description": "MH EK",
				"size": 4,
				"levels": "1234",
				"lat": 47.530154,
				"lon": 19.071106
			},
			{
				"caption": "Mindent a Betegekért Alap.",
				"description": "Mindent a Betegekért Alapítvány, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.576759,
				"lon": 19.092698
			},
			{
				"caption": "Miskolci Semmelweis Kh.",
				"description": "Miskolci Semmelweis Kh. Egyetemi Okt.kh.",
				"size": 4,
				"levels": "1234",
				"lat": 48.090429,
				"lon": 20.72364
			},
			{
				"caption": "Misszió Eg. Kp.",
				"description": "Misszió Egészségügyi Központ",
				"size": 4,
				"levels": "1234",
				"lat": 47.662516,
				"lon": 19.273432
			},
			{
				"caption": "MMSz, Miskolc",
				"description": "MMSz, Miskolc",
				"size": 4,
				"levels": "1234",
				"lat": 48.106274,
				"lon": 20.679943
			},
			{
				"caption": "Mohácsi Kh.",
				"description": "Mohácsi Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 45.998001,
				"lon": 18.681728
			},
			{
				"caption": "MPE Hajnalcsillag",
				"description": "MPE Hajnalcsillag, Dunaharaszti",
				"size": 4,
				"levels": "1234",
				"lat": 47.357032,
				"lon": 19.096199
			},
			{
				"caption": "MRE KIMM Drogterápiás Otth.",
				"description": "MRE KIMM Drogterápiás Otth., Ráckeresztúr",
				"size": 4,
				"levels": "1234",
				"lat": 47.282113,
				"lon": 18.8223
			},
			{
				"caption": "Nagyatádi Kh.",
				"description": "Nagyatádi Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.232097,
				"lon": 17.360784
			},
			{
				"caption": "Nagykõrös V. Ö. Rehab. SzKh.",
				"description": "Nagykõrös V. Ö. Rehab. Szakkórház Ri.",
				"size": 4,
				"levels": "1234",
				"lat": 47.022162,
				"lon": 19.79024
			},
			{
				"caption": "Nyírõ Gyula Kh.",
				"description": "Nyírõ Gyula Kórház - OPAI",
				"size": 4,
				"levels": "1234",
				"lat": 47.527547,
				"lon": 19.080242
			},
			{
				"caption": "OKITI",
				"description": "OKITI",
				"size": 4,
				"levels": "1234",
				"lat": 47.518202,
				"lon": 19.098233
			},
			{
				"caption": "OKTPI",
				"description": "OKTPI, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.519528,
				"lon": 18.945633
			},
			{
				"caption": "Oltalom Karitatív Egy.",
				"description": "Oltalom Karitatív Egyesület, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.491036,
				"lon": 19.081884
			},
			{
				"caption": "OORI",
				"description": "OORI, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.522159,
				"lon": 18.935101
			},
			{
				"caption": "ORFI",
				"description": "ORFI, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.517141,
				"lon": 19.036181
			},
			{
				"caption": "Orosházi Kh.",
				"description": "Orosházi Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.55994,
				"lon": 20.659349
			},
			{
				"caption": "Oroszlányi Szakorvosi és Áp. Int.",
				"description": "Oroszlányi Szakorvosi és Ápolási Intézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.479179,
				"lon": 18.322549
			},
			{
				"caption": "Országos Onkológiai Intézet",
				"description": "Országos Onkológiai Intézet, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.499935,
				"lon": 19.02181
			},
			{
				"caption": "OSEI",
				"description": "OSEI, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.49176,
				"lon": 19.02453
			},
			{
				"caption": "Palotahosp Kft.",
				"description": "Palotahosp Kft. Várpalota",
				"size": 4,
				"levels": "1234",
				"lat": 47.202606,
				"lon": 18.142969
			},
			{
				"caption": "Pannon Reprodukciós Int.",
				"description": "Pannon Reprodukciós Intézet Kft., Tapolca",
				"size": 4,
				"levels": "1234",
				"lat": 46.883585,
				"lon": 17.437359
			},
			{
				"caption": "Parádfürdői Állami Kh.",
				"description": "Parádfürdői Állami Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.923646,
				"lon": 20.053354
			},
			{
				"caption": "Pest Megyei Flór Ferenc Kh.",
				"description": "Pest Megyei Flór Ferenc Kh., Kistarcsa",
				"size": 4,
				"levels": "1234",
				"lat": 47.539054,
				"lon": 19.253783
			},
			{
				"caption": "Péterfy S. u. Kh.",
				"description": "Péterfy S. u. Kh-Ri és Baleseti Kp., Bp",
				"size": 4,
				"levels": "1234",
				"lat": 47.501604,
				"lon": 19.078566
			},
			{
				"caption": "Petz Aladár Megyei Okh.",
				"description": "Petz Aladár Megyei Oktató Kórház, Gyõr",
				"size": 4,
				"levels": "1234",
				"lat": 47.669321,
				"lon": 17.646423
			},
			{
				"caption": "Gálfy Béla Kh.",
				"description": "Pomáz, Gálfy Béla K. Nonpr. Kft.",
				"size": 4,
				"levels": "1234",
				"lat": 47.64296,
				"lon": 19.032361
			},
			{
				"caption": "PTE",
				"description": "PTE, Pécs",
				"size": 4,
				"levels": "1234",
				"lat": 46.074399,
				"lon": 18.221118
			},
			{
				"caption": "Sátoraljaújhelyi Erzsébet Kh.",
				"description": "Sátoraljaújhelyi Erzsébet Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 48.397839,
				"lon": 21.652078
			},
			{
				"caption": "Segély Helyett Esély Alap.",
				"description": "Segély Helyett Esély Alapítvány Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.41224,
				"lon": 19.018679
			},
			{
				"caption": "Segítõ Kéz Alap.",
				"description": "Segítõ Kéz Alapítvány, Gödöllő",
				"size": 4,
				"levels": "1234",
				"lat": 47.591697,
				"lon": 19.387029
			},
			{
				"caption": "Selye János Kh.",
				"description": "Selye János KH, Komárom",
				"size": 4,
				"levels": "1234",
				"lat": 47.735155,
				"lon": 18.168415
			},
			{
				"caption": "Semmelweis Egyetem",
				"description": "Semmelweis Egyetem, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.482472,
				"lon": 19.080001
			},
			{
				"caption": "Siklósi Kh.",
				"description": "Siklósi Kórház Nonprofit Kft.",
				"size": 4,
				"levels": "1234",
				"lat": 45.847859,
				"lon": 18.297169
			},
			{
				"caption": "Siófoki Kh.",
				"description": "Siófoki Kórház-Rendelõintézet",
				"size": 4,
				"levels": "1234",
				"lat": 46.900837,
				"lon": 18.043472
			},
			{
				"caption": "Sirály Np. Kft.",
				"description": "Sirály Nonprofit Kft., Kincsesbánya",
				"size": 4,
				"levels": "1234",
				"lat": 47.265012,
				"lon": 18.273801
			},
			{
				"caption": "Somogy Megyei Kaposi Mór Okh.",
				"description": "Somogy Megyei Kaposi Mór Oktató Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.358905,
				"lon": 17.797698
			},
			{
				"caption": "Soproni Gyógyközpont",
				"description": "Soproni Gyógyközpont",
				"size": 4,
				"levels": "1234",
				"lat": 47.675985,
				"lon": 16.598244
			},
			{
				"caption": "Sz-Sz.-B. megyei Kh.",
				"description": "Sz-Sz.-B. megyei Kh.-k és Egyetemi Oktkh",
				"size": 4,
				"levels": "1234",
				"lat": 47.95084,
				"lon": 21.727271
			},
			{
				"caption": "Szarvasi Szakorvosi Kft.",
				"description": "Szarvasi Szakorvosi Kft.",
				"size": 4,
				"levels": "1234",
				"lat": 46.86478,
				"lon": 20.54922
			},
			{
				"caption": "Szegedi Kist. Szoc. Int.",
				"description": "Szegedi Kist. T.T. Egy. Szoc. Int.",
				"size": 4,
				"levels": "1234",
				"lat": 46.243881,
				"lon": 20.160081
			},
			{
				"caption": "Balassa J. Kh.",
				"description": "Szekszárd, Balassa J. Kh.",
				"size": 4,
				"levels": "1234",
				"lat": 46.345691,
				"lon": 18.701106
			},
			{
				"caption": "Szent Borbála Kh.",
				"description": "Szent Borbála KH, Tatabánya",
				"size": 4,
				"levels": "1234",
				"lat": 47.580062,
				"lon": 18.391243
			},
			{
				"caption": "Szent Imre Kh.",
				"description": "Szent Imre Kórház, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.468549,
				"lon": 19.034135
			},
			{
				"caption": "Szent László Kh.",
				"description": "Szent László Kórház, Sárvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.249769,
				"lon": 16.94479
			},
			{
				"caption": "Szent Lázár Megyei Kh.",
				"description": "Szent Lázár Megyei Kórház, Salgótarján",
				"size": 4,
				"levels": "1234",
				"lat": 48.114113,
				"lon": 19.811018
			},
			{
				"caption": "Szent Margit Kh.",
				"description": "Szent Margit Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.539216,
				"lon": 19.031173
			},
			{
				"caption": "Szent Rókus Kh.",
				"description": "Szent Rókus Kórház, Bp.",
				"size": 4,
				"levels": "1234",
				"lat": 47.495535,
				"lon": 19.067387
			},
			{
				"caption": "Szigetvári Kh.",
				"description": "Szigetvári Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 46.054081,
				"lon": 17.787182
			},
			{
				"caption": "Szociális Háló Egy.",
				"description": "Szociális Háló Egyesület, Sellye",
				"size": 4,
				"levels": "1234",
				"lat": 45.872327,
				"lon": 17.845107
			},
			{
				"caption": "Szolnoki MÁV Kh.",
				"description": "Szolnoki MÁV Kórház",
				"size": 4,
				"levels": "1234",
				"lat": 47.174248,
				"lon": 20.20835
			},
			{
				"caption": "SZPK",
				"description": "SZPK Dunaújváros",
				"size": 4,
				"levels": "1234",
				"lat": 46.964661,
				"lon": 18.942839
			},
			{
				"caption": "Szt János Kh.",
				"description": "Szt János Kh és É-budai Egyesített Kh",
				"size": 4,
				"levels": "1234",
				"lat": 47.508331,
				"lon": 19.006149
			},
			{
				"caption": "Szt Kozma és Damján Rehab.",
				"description": "Szt Kozma és Damján Rehab. SZKH Visegrád",
				"size": 4,
				"levels": "1234",
				"lat": 47.759353,
				"lon": 18.943101
			},
			{
				"caption": "SZTE",
				"description": "SZTE Szent-Györgyi A. Klinikai Kp Szeged",
				"size": 4,
				"levels": "1234",
				"lat": 46.245293,
				"lon": 20.147165
			},		
			{
				"caption": "Toldy Ferenc Kh.",
				"description": "Toldy Ferenc Kórház és Rendelõintézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.172085,
				"lon": 19.816263
			},
			{
				"caption": "Tüdőgyógyintézet",
				"description": "Tüdőgyógyintézet Törökbálint",
				"size": 4,
				"levels": "1234",
				"lat": 47.429445,
				"lon": 18.914448
			},
			{
				"caption": "Uzsoki utcai Kh.",
				"description": "Uzsoki utcai Kórház, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.518532,
				"lon": 19.102158
			},
			{
				"caption": "Jávorszky Ödön Kh.",
				"description": "Vác, Jávorszky Ödön Városi Kh.",
				"size": 4,
				"levels": "1234",
				"lat": 47.783385,
				"lon": 19.145904
			},
			{
				"caption": "Vadaskert Alap.",
				"description": "Vadaskert Alapítvány, Budapest",
				"size": 4,
				"levels": "1234",
				"lat": 47.529955,
				"lon": 18.976573
			},
			{
				"caption": "Vasútegészségügyi Np. Kft.",
				"description": "Vasútegészségügyi Np.Kiem.Közhaszn.Kft.",
				"size": 4,
				"levels": "1234",
				"lat": 46.790567,
				"lon": 17.189822
			},
			{
				"caption": "Vaszary Kolos Kh.",
				"description": "Vaszary Kolos Kh., Esztergom",
				"size": 4,
				"levels": "1234",
				"lat": 47.79095,
				"lon": 18.744959
			},
			{
				"caption": "Veszprém M. Tüdőgyógyi.",
				"description": "Veszprém M. Tüdőgyógyintézet Farkasgyepû",
				"size": 4,
				"levels": "1234",
				"lat": 47.212209,
				"lon": 17.621165
			},
			{
				"caption": "Zala Megyei Kh.",
				"description": "Zala Megyei Kórház, Zalaegerszeg",
				"size": 4,
				"levels": "1234",
				"lat": 46.834587,
				"lon": 16.846842
			},
			{
				"caption": "Zirc Városi Erzsébet Kh.t",
				"description": "Zirc Városi Erzsébet Kh-rendelõintézet",
				"size": 4,
				"levels": "1234",
				"lat": 47.26089,
				"lon": 17.867834
			},
			{
				"caption": "Zsigmondy V. Harkányi Gyógyf.Kh.",
				"description": "Zsigmondy V. Harkányi Gyógyf.Kh. Np. Kft",
				"size": 4,
				"levels": "1234",
				"lat": 45.849448,
				"lon": 18.238236
			}
		]
	}
];
