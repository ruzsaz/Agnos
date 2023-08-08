'use strict';

// Poi-k
var pois = [
	{
		"caption": "Mentőállomások",
		"description": "Mentőállomások",
		"color": "red",
		"symbol": 1,
		"points": [
			{
				"caption": "Központ",
				"description": "(101) Központ",
				"size": 4,
				"levels": "1234",
				"lat": 47.508995,
				"lon": 19.053973
			},
			{
				"caption": "Buda + Micu",
				"description": "(103) Buda + (123) Micu",
				"size": 4,
				"levels": "1234",
				"lat": 47.489593,
				"lon": 19.027874
			},
			{
				"caption": "Újpest",
				"description": "(104) Újpest",
				"size": 4,
				"levels": "1234",
				"lat": 47.563625,
				"lon": 19.097192
			},
			{
				"caption": "Rákospalota",
				"description": "(105) Rákospalota",
				"size": 4,
				"levels": "1234",
				"lat": 47.539239,
				"lon": 19.122429
			},
			{
				"caption": "Kispest",
				"description": "(106) Kispest",
				"size": 4,
				"levels": "1234",
				"lat": 47.452772,
				"lon": 19.151318
			},
			{
				"caption": "Pestlőrinc",
				"description": "(107) Pestlőrinc",
				"size": 4,
				"levels": "1234",
				"lat": 47.446161,
				"lon": 19.181997
			},
			{
				"caption": "Pesterzsébet",
				"description": "(108) Pesterzsébet",
				"size": 4,
				"levels": "1234",
				"lat": 47.424936,
				"lon": 19.122373
			},
			{
				"caption": "Csepel",
				"description": "(109) Csepel",
				"size": 4,
				"levels": "1234",
				"lat": 47.423839,
				"lon": 19.070492
			},
			{
				"caption": "Budafok",
				"description": "(110) Budafok",
				"size": 4,
				"levels": "1234",
				"lat": 47.422255,
				"lon": 19.041079
			},
			{
				"caption": "Csillaghegy",
				"description": "(111) Csillaghegy",
				"size": 4,
				"levels": "1234",
				"lat": 47.585574,
				"lon": 19.051466
			},
			{
				"caption": "Rákoskeresztúr",
				"description": "(112) Rákoskeresztúr",
				"size": 4,
				"levels": "1234",
				"lat": 47.478961,
				"lon": 19.254316
			},
			{
				"caption": "Bázis",
				"description": "(113) Bázis",
				"size": 4,
				"levels": "1234",
				"lat": 47.523245,
				"lon": 19.07883
			},
			{
				"caption": "Mátyásföld",
				"description": "(114) Mátyásföld",
				"size": 4,
				"levels": "1234",
				"lat": 47.520468,
				"lon": 19.187227
			},
			{
				"caption": "Pesthidegkút",
				"description": "(115) Pesthidegkút",
				"size": 4,
				"levels": "1234",
				"lat": 47.548846,
				"lon": 18.952391
			},
			{
				"caption": "Pécs 1.",
				"description": "(201) Pécs 1.",
				"size": 4,
				"levels": "1234",
				"lat": 46.066701,
				"lon": 18.208121
			},
			{
				"caption": "Pécs 2.",
				"description": "(202) Pécs 2.",
				"size": 4,
				"levels": "1234",
				"lat": 46.069709,
				"lon": 18.218221
			},
			{
				"caption": "Komló",
				"description": "(203) Komló",
				"size": 4,
				"levels": "1234",
				"lat": 46.193867,
				"lon": 18.263553
			},
			{
				"caption": "Mohács",
				"description": "(204) Mohács",
				"size": 4,
				"levels": "1234",
				"lat": 45.996317,
				"lon": 18.674075
			},
			{
				"caption": "Sellye",
				"description": "(205) Sellye",
				"size": 4,
				"levels": "1234",
				"lat": 45.869307,
				"lon": 17.853477
			},
			{
				"caption": "Siklós",
				"description": "(206) Siklós",
				"size": 4,
				"levels": "1234",
				"lat": 45.847599,
				"lon": 18.297199
			},
			{
				"caption": "Szigetvár",
				"description": "(207) Szigetvár",
				"size": 4,
				"levels": "1234",
				"lat": 46.054047,
				"lon": 17.785959
			},
			{
				"caption": "Kecskemét",
				"description": "(301) Kecskemét",
				"size": 4,
				"levels": "1234",
				"lat": 46.90963,
				"lon": 19.670988
			},
			{
				"caption": "Baja",
				"description": "(302) Baja",
				"size": 4,
				"levels": "1234",
				"lat": 46.174739,
				"lon": 18.961389
			},
			{
				"caption": "Bácsalmás",
				"description": "(303) Bácsalmás",
				"size": 4,
				"levels": "1234",
				"lat": 46.125401,
				"lon": 19.333937
			},
			{
				"caption": "Dunavecse",
				"description": "(304) Dunavecse",
				"size": 4,
				"levels": "1234",
				"lat": 46.917394,
				"lon": 18.973505
			},
			{
				"caption": "Kalocsa",
				"description": "(305) Kalocsa",
				"size": 4,
				"levels": "1234",
				"lat": 46.533097,
				"lon": 18.983819
			},
			{
				"caption": "Kiskőrös",
				"description": "(306) Kiskőrös",
				"size": 4,
				"levels": "1234",
				"lat": 46.620142,
				"lon": 19.283068
			},
			{
				"caption": "Kiskunfélegyháza",
				"description": "(307) Kiskunfélegyháza",
				"size": 4,
				"levels": "1234",
				"lat": 46.710067,
				"lon": 19.845637
			},
			{
				"caption": "Kiskunhalas",
				"description": "(308) Kiskunhalas",
				"size": 4,
				"levels": "1234",
				"lat": 46.428601,
				"lon": 19.46575
			},
			{
				"caption": "Szabadszállás",
				"description": "(309) Szabadszállás",
				"size": 4,
				"levels": "1234",
				"lat": 46.870928,
				"lon": 19.226241
			},
			{
				"caption": "Tiszakécske",
				"description": "(310) Tiszakécske",
				"size": 4,
				"levels": "1234",
				"lat": 46.931221,
				"lon": 20.094479
			},
			{
				"caption": "Kiskunmajsa",
				"description": "(311) Kiskunmajsa",
				"size": 4,
				"levels": "1234",
				"lat": 46.494928,
				"lon": 19.729091
			},
			{
				"caption": "Kunszentmiklós",
				"description": "(312) Kunszentmiklós",
				"size": 4,
				"levels": "1234",
				"lat": 47.024552,
				"lon": 19.126009
			},
			{
				"caption": "Békéscsaba",
				"description": "(401) Békéscsaba",
				"size": 4,
				"levels": "1234",
				"lat": 46.68075,
				"lon": 21.107822
			},
			{
				"caption": "Gyomaendrőd",
				"description": "(402) Gyomaendrőd",
				"size": 4,
				"levels": "1234",
				"lat": 46.936212,
				"lon": 20.834149
			},
			{
				"caption": "Gyula",
				"description": "(403) Gyula",
				"size": 4,
				"levels": "1234",
				"lat": 47.53277,
				"lon": 21.643992
			},
			{
				"caption": "Mezőkovácsháza",
				"description": "(404) Mezőkovácsháza",
				"size": 4,
				"levels": "1234",
				"lat": 46.406657,
				"lon": 20.922232
			},
			{
				"caption": "Orosháza",
				"description": "(405) Orosháza",
				"size": 4,
				"levels": "1234",
				"lat": 46.558696,
				"lon": 20.660961
			},
			{
				"caption": "Szarvas",
				"description": "(406) Szarvas",
				"size": 4,
				"levels": "1234",
				"lat": 46.864931,
				"lon": 20.548509
			},
			{
				"caption": "Szeghalom",
				"description": "(407) Szeghalom",
				"size": 4,
				"levels": "1234",
				"lat": 47.017815,
				"lon": 21.176761
			},
			{
				"caption": "Zsadány",
				"description": "(408) Zsadány",
				"size": 4,
				"levels": "1234",
				"lat": 46.922661,
				"lon": 21.488573
			},
			{
				"caption": "Sarkad",
				"description": "(409) Sarkad",
				"size": 4,
				"levels": "1234",
				"lat": 46.747114,
				"lon": 21.383923
			},
			{
				"caption": "Kunágota",
				"description": "(410) Kunágota",
				"size": 4,
				"levels": "1234",
				"lat": 46.42671,
				"lon": 21.055374
			},
			{
				"caption": "Miskolc",
				"description": "(501) Miskolc",
				"size": 4,
				"levels": "1234",
				"lat": 48.102913,
				"lon": 20.772039
			},
			{
				"caption": "Encs",
				"description": "(503) Encs",
				"size": 4,
				"levels": "1234",
				"lat": 48.306119,
				"lon": 21.10825
			},
			{
				"caption": "Izsófalva",
				"description": "(504) Izsófalva",
				"size": 4,
				"levels": "1234",
				"lat": 48.304093,
				"lon": 20.654447
			},
			{
				"caption": "Kazincbarcika",
				"description": "(505) Kazincbarcika",
				"size": 4,
				"levels": "1234",
				"lat": 48.253713,
				"lon": 20.618114
			},
			{
				"caption": "Tiszaújváros",
				"description": "(506) Tiszaújváros",
				"size": 4,
				"levels": "1234",
				"lat": 47.930228,
				"lon": 21.043828
			},
			{
				"caption": "Mezőcsát",
				"description": "(507) Mezőcsát",
				"size": 4,
				"levels": "1234",
				"lat": 47.822751,
				"lon": 20.897472
			},
			{
				"caption": "Mezőkövesd",
				"description": "(508) Mezőkövesd",
				"size": 4,
				"levels": "1234",
				"lat": 47.804279,
				"lon": 20.566869
			},
			{
				"caption": "Ózd",
				"description": "(509) Ózd",
				"size": 4,
				"levels": "1234",
				"lat": 48.215849,
				"lon": 20.296582
			},
			{
				"caption": "Sajószentpéter",
				"description": "(510) Sajószentpéter",
				"size": 4,
				"levels": "1234",
				"lat": 48.218796,
				"lon": 20.703092
			},
			{
				"caption": "Sátoraljaújhely",
				"description": "(511) Sátoraljaújhely",
				"size": 4,
				"levels": "1234",
				"lat": 48.398747,
				"lon": 21.652137
			},
			{
				"caption": "Szendrő",
				"description": "(512) Szendrő",
				"size": 4,
				"levels": "1234",
				"lat": 48.404991,
				"lon": 20.728148
			},
			{
				"caption": "Szerencs",
				"description": "(513) Szerencs",
				"size": 4,
				"levels": "1234",
				"lat": 48.163839,
				"lon": 21.208399
			},
			{
				"caption": "Szikszó",
				"description": "(514) Szikszó",
				"size": 4,
				"levels": "1234",
				"lat": 48.205041,
				"lon": 20.93595
			},
			{
				"caption": "Edelény",
				"description": "(515) Edelény",
				"size": 4,
				"levels": "1234",
				"lat": 48.292338,
				"lon": 20.724132
			},
			{
				"caption": "Ricse",
				"description": "(516) Ricse",
				"size": 4,
				"levels": "1234",
				"lat": 48.327435,
				"lon": 21.970844
			},
			{
				"caption": "Tokaj",
				"description": "(517) Tokaj",
				"size": 4,
				"levels": "1234",
				"lat": 48.14091,
				"lon": 21.39786
			},
			{
				"caption": "Gönc",
				"description": "(518) Gönc",
				"size": 4,
				"levels": "1234",
				"lat": 48.473594,
				"lon": 21.275427
			},
			{
				"caption": "Tiszalúc",
				"description": "(519) Tiszalúc",
				"size": 4,
				"levels": "1234",
				"lat": 48.034358,
				"lon": 21.072002
			},
			{
				"caption": "Hidvégardó",
				"description": "(520) Hidvégardó",
				"size": 4,
				"levels": "1234",
				"lat": 48.557289,
				"lon": 20.838912
			},
			{
				"caption": "Putnok",
				"description": "(521) Putnok",
				"size": 4,
				"levels": "1234",
				"lat": 48.293695,
				"lon": 20.437668
			},
			{
				"caption": "Emőd",
				"description": "(522) Emőd",
				"size": 4,
				"levels": "1234",
				"lat": 47.942174,
				"lon": 20.813739
			},
			{
				"caption": "Szeged",
				"description": "(601) Szeged",
				"size": 4,
				"levels": "1234",
				"lat": 46.25712,
				"lon": 20.146264
			},
			{
				"caption": "Csongrád",
				"description": "(602) Csongrád",
				"size": 4,
				"levels": "1234",
				"lat": 46.718415,
				"lon": 20.133572
			},
			{
				"caption": "Hódmezővásárhely",
				"description": "(603) Hódmezővásárhely",
				"size": 4,
				"levels": "1234",
				"lat": 46.414081,
				"lon": 20.312937
			},
			{
				"caption": "Kistelek",
				"description": "(604) Kistelek",
				"size": 4,
				"levels": "1234",
				"lat": 46.471475,
				"lon": 19.978247
			},
			{
				"caption": "Makó",
				"description": "(605) Makó",
				"size": 4,
				"levels": "1234",
				"lat": 46.231385,
				"lon": 20.501641
			},
			{
				"caption": "Ruzsa",
				"description": "(606) Ruzsa",
				"size": 4,
				"levels": "1234",
				"lat": 46.288087,
				"lon": 19.747656
			},
			{
				"caption": "Szentes",
				"description": "(607) Szentes",
				"size": 4,
				"levels": "1234",
				"lat": 46.66131,
				"lon": 20.255857
			},
			{
				"caption": "Mórahalom",
				"description": "(608) Mórahalom",
				"size": 4,
				"levels": "1234",
				"lat": 46.213475,
				"lon": 19.893958
			},
			{
				"caption": "Székesfehérvár",
				"description": "(701) Székesfehérvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.192544,
				"lon": 18.440283
			},
			{
				"caption": "Bicske",
				"description": "(702) Bicske",
				"size": 4,
				"levels": "1234",
				"lat": 47.494758,
				"lon": 18.632984
			},
			{
				"caption": "Dunaújváros",
				"description": "(703) Dunaújváros",
				"size": 4,
				"levels": "1234",
				"lat": 46.963179,
				"lon": 18.942389
			},
			{
				"caption": "Enying",
				"description": "(704) Enying",
				"size": 4,
				"levels": "1234",
				"lat": 46.946607,
				"lon": 18.22997
			},
			{
				"caption": "Martonvásár",
				"description": "(705) Martonvásár",
				"size": 4,
				"levels": "1234",
				"lat": 47.312484,
				"lon": 18.794735
			},
			{
				"caption": "Mór",
				"description": "(706) Mór",
				"size": 4,
				"levels": "1234",
				"lat": 47.36953,
				"lon": 18.216184
			},
			{
				"caption": "Sárbogárd",
				"description": "(707) Sárbogárd",
				"size": 4,
				"levels": "1234",
				"lat": 46.891941,
				"lon": 18.616941
			},
			{
				"caption": "Velence",
				"description": "(708) Velence",
				"size": 4,
				"levels": "1234",
				"lat": 47.222755,
				"lon": 18.656548
			},
			{
				"caption": "Ercsi",
				"description": "(709) Ercsi",
				"size": 4,
				"levels": "1234",
				"lat": 47.250074,
				"lon": 18.894277
			},
			{
				"caption": "Pusztaszabolcs",
				"description": "(710) Pusztaszabolcs",
				"size": 4,
				"levels": "1234",
				"lat": 47.137036,
				"lon": 18.757338
			},
			{
				"caption": "Csákvár",
				"description": "(711) Csákvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.393331,
				"lon": 18.463068
			},
			{
				"caption": "Győr",
				"description": "(801) Győr",
				"size": 4,
				"levels": "1234",
				"lat": 47.688035,
				"lon": 17.637665
			},
			{
				"caption": "Csorna",
				"description": "(802) Csorna",
				"size": 4,
				"levels": "1234",
				"lat": 47.606154,
				"lon": 17.244808
			},
			{
				"caption": "Kapuvár",
				"description": "(803) Kapuvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.59227,
				"lon": 17.029077
			},
			{
				"caption": "Mosonmagyaróvár",
				"description": "(804) Mosonmagyaróvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.872292,
				"lon": 17.269733
			},
			{
				"caption": "Sopron",
				"description": "(805) Sopron",
				"size": 4,
				"levels": "1234",
				"lat": 47.678594,
				"lon": 16.599469
			},
			{
				"caption": "Tét",
				"description": "(806) Tét",
				"size": 4,
				"levels": "1234",
				"lat": 47.517074,
				"lon": 17.517037
			},
			{
				"caption": "Pannonhalma",
				"description": "(807) Pannonhalma",
				"size": 4,
				"levels": "1234",
				"lat": 47.547691,
				"lon": 17.747522
			},
			{
				"caption": "Lövő",
				"description": "(808) Lövő",
				"size": 4,
				"levels": "1234",
				"lat": 47.502257,
				"lon": 16.777938
			},
			{
				"caption": "Debrecen",
				"description": "(901) Debrecen",
				"size": 4,
				"levels": "1234",
				"lat": 47.524325,
				"lon": 21.622373
			},
			{
				"caption": "Berettyóújfalu",
				"description": "(902) Berettyóújfalu",
				"size": 4,
				"levels": "1234",
				"lat": 47.211479,
				"lon": 21.547247
			},
			{
				"caption": "Egyek",
				"description": "(903) Egyek",
				"size": 4,
				"levels": "1234",
				"lat": 47.615706,
				"lon": 20.875451
			},
			{
				"caption": "Hajdúböszörmény",
				"description": "(904) Hajdúböszörmény",
				"size": 4,
				"levels": "1234",
				"lat": 47.671967,
				"lon": 21.512944
			},
			{
				"caption": "Hajdúnánás",
				"description": "(905) Hajdúnánás",
				"size": 4,
				"levels": "1234",
				"lat": 47.847054,
				"lon": 21.428624
			},
			{
				"caption": "Hajdúszoboszló",
				"description": "(906) Hajdúszoboszló",
				"size": 4,
				"levels": "1234",
				"lat": 47.447656,
				"lon": 21.399765
			},
			{
				"caption": "Püspökladány",
				"description": "(907) Püspökladány",
				"size": 4,
				"levels": "1234",
				"lat": 47.313635,
				"lon": 21.117052
			},
			{
				"caption": "Derecske",
				"description": "(908) Derecske",
				"size": 4,
				"levels": "1234",
				"lat": 47.350185,
				"lon": 21.564406
			},
			{
				"caption": "Létavértes",
				"description": "(909) Létavértes",
				"size": 4,
				"levels": "1234",
				"lat": 47.382508,
				"lon": 21.890169
			},
			{
				"caption": "Balmazújváros",
				"description": "(910) Balmazújváros",
				"size": 4,
				"levels": "1234",
				"lat": 47.61453,
				"lon": 21.341733
			},
			{
				"caption": "Biharkeresztes",
				"description": "(911) Biharkeresztes",
				"size": 4,
				"levels": "1234",
				"lat": 47.130659,
				"lon": 21.716506
			},
			{
				"caption": "Nyĺrábrány",
				"description": "(912) Nyĺrábrány",
				"size": 4,
				"levels": "1234",
				"lat": 47.548641,
				"lon": 22.019531
			},
			{
				"caption": "Komádi",
				"description": "(913) Komádi",
				"size": 4,
				"levels": "1234",
				"lat": 47.004755,
				"lon": 21.484548
			},
			{
				"caption": "Polgár",
				"description": "(914) Polgár",
				"size": 4,
				"levels": "1234",
				"lat": 47.871698,
				"lon": 21.114122
			},
			{
				"caption": "Eger",
				"description": "(1001) Eger",
				"size": 4,
				"levels": "1234",
				"lat": 47.913485,
				"lon": 20.363289
			},
			{
				"caption": "Gyöngyös",
				"description": "(1002) Gyöngyös",
				"size": 4,
				"levels": "1234",
				"lat": 47.778701,
				"lon": 19.917627
			},
			{
				"caption": "Hatvan",
				"description": "(1003) Hatvan",
				"size": 4,
				"levels": "1234",
				"lat": 47.527055,
				"lon": 21.636763
			},
			{
				"caption": "Heves",
				"description": "(1004) Heves",
				"size": 4,
				"levels": "1234",
				"lat": 47.608801,
				"lon": 20.286173
			},
			{
				"caption": "Petőfibánya",
				"description": "(1005) Petőfibánya",
				"size": 4,
				"levels": "1234",
				"lat": 47.76584,
				"lon": 19.698319
			},
			{
				"caption": "Pétervására",
				"description": "(1006) Pétervására",
				"size": 4,
				"levels": "1234",
				"lat": 48.021857,
				"lon": 20.09889
			},
			{
				"caption": "Kompolt",
				"description": "(1007) Kompolt",
				"size": 4,
				"levels": "1234",
				"lat": 47.743147,
				"lon": 20.254204
			},
			{
				"caption": "Poroszló",
				"description": "(1008) Poroszló",
				"size": 4,
				"levels": "1234",
				"lat": 47.644371,
				"lon": 20.655014
			},
			{
				"caption": "Bélapátfalva",
				"description": "(1009) Bélapátfalva",
				"size": 4,
				"levels": "1234",
				"lat": 48.057866,
				"lon": 20.350054
			},
			{
				"caption": "Recsk",
				"description": "(1010) Recsk",
				"size": 4,
				"levels": "1234",
				"lat": 47.935677,
				"lon": 20.109448
			},
			{
				"caption": "Tatabánya",
				"description": "(1101) Tatabánya",
				"size": 4,
				"levels": "1234",
				"lat": 47.587321,
				"lon": 18.387341
			},
			{
				"caption": "Dorog",
				"description": "(1102) Dorog",
				"size": 4,
				"levels": "1234",
				"lat": 47.720603,
				"lon": 18.741906
			},
			{
				"caption": "Esztergom",
				"description": "(1103) Esztergom",
				"size": 4,
				"levels": "1234",
				"lat": 47.785403,
				"lon": 18.740579
			},
			{
				"caption": "Kisbér",
				"description": "(1104) Kisbér",
				"size": 4,
				"levels": "1234",
				"lat": 47.503134,
				"lon": 18.027828
			},
			{
				"caption": "Komárom",
				"description": "(1105) Komárom",
				"size": 4,
				"levels": "1234",
				"lat": 47.735425,
				"lon": 18.168437
			},
			{
				"caption": "Oroszlány",
				"description": "(1106) Oroszlány",
				"size": 4,
				"levels": "1234",
				"lat": 47.480404,
				"lon": 18.314007
			},
			{
				"caption": "Tata",
				"description": "(1107) Tata",
				"size": 4,
				"levels": "1234",
				"lat": 47.649968,
				"lon": 18.310364
			},
			{
				"caption": "Nyergesújfalu",
				"description": "(1108) Nyergesújfalu",
				"size": 4,
				"levels": "1234",
				"lat": 47.760356,
				"lon": 18.551474
			},
			{
				"caption": "Salgótarján",
				"description": "(1201) Salgótarján",
				"size": 4,
				"levels": "1234",
				"lat": 48.10433,
				"lon": 19.801074
			},
			{
				"caption": "Balassagyarmat",
				"description": "(1202) Balassagyarmat",
				"size": 4,
				"levels": "1234",
				"lat": 48.079121,
				"lon": 19.307528
			},
			{
				"caption": "Bátonyterenye",
				"description": "(1203) Bátonyterenye",
				"size": 4,
				"levels": "1234",
				"lat": 47.986893,
				"lon": 19.828661
			},
			{
				"caption": "Bercel",
				"description": "(1204) Bercel",
				"size": 4,
				"levels": "1234",
				"lat": 47.874574,
				"lon": 19.401851
			},
			{
				"caption": "Pásztó",
				"description": "(1205) Pásztó",
				"size": 4,
				"levels": "1234",
				"lat": 47.921374,
				"lon": 19.70134
			},
			{
				"caption": "Szécsény",
				"description": "(1206) Szécsény",
				"size": 4,
				"levels": "1234",
				"lat": 48.081576,
				"lon": 19.514678
			},
			{
				"caption": "Rétság",
				"description": "(1207) Rétság",
				"size": 4,
				"levels": "1234",
				"lat": 47.929354,
				"lon": 19.137329
			},
			{
				"caption": "Héhalom",
				"description": "(1208) Héhalom",
				"size": 4,
				"levels": "1234",
				"lat": 47.781632,
				"lon": 19.583705
			},
			{
				"caption": "Aszód",
				"description": "(1302) Aszód",
				"size": 4,
				"levels": "1234",
				"lat": 47.65338,
				"lon": 19.484342
			},
			{
				"caption": "Cegléd",
				"description": "(1303) Cegléd",
				"size": 4,
				"levels": "1234",
				"lat": 47.168255,
				"lon": 19.795361
			},
			{
				"caption": "Dabas",
				"description": "(1304) Dabas",
				"size": 4,
				"levels": "1234",
				"lat": 47.187934,
				"lon": 19.321239
			},
			{
				"caption": "Érd",
				"description": "(1305) Érd",
				"size": 4,
				"levels": "1234",
				"lat": 47.383606,
				"lon": 18.934226
			},
			{
				"caption": "Gödöllő",
				"description": "(1306) Gödöllő",
				"size": 4,
				"levels": "1234",
				"lat": 47.59198,
				"lon": 19.353105
			},
			{
				"caption": "Monor",
				"description": "(1307) Monor",
				"size": 4,
				"levels": "1234",
				"lat": 47.351404,
				"lon": 19.440802
			},
			{
				"caption": "Nagykáta",
				"description": "(1308) Nagykáta",
				"size": 4,
				"levels": "1234",
				"lat": 47.41403,
				"lon": 19.738057
			},
			{
				"caption": "Nagykőrös",
				"description": "(1309) Nagykőrös",
				"size": 4,
				"levels": "1234",
				"lat": 47.033246,
				"lon": 19.778953
			},
			{
				"caption": "Ráckeve",
				"description": "(1310) Ráckeve",
				"size": 4,
				"levels": "1234",
				"lat": 47.160353,
				"lon": 18.94162
			},
			{
				"caption": "Százhalombatta",
				"description": "(1311) Százhalombatta",
				"size": 4,
				"levels": "1234",
				"lat": 47.323352,
				"lon": 18.900475
			},
			{
				"caption": "Szentendre",
				"description": "(1312) Szentendre",
				"size": 4,
				"levels": "1234",
				"lat": 47.671467,
				"lon": 19.078596
			},
			{
				"caption": "Szigetszentmiklós",
				"description": "(1313) Szigetszentmiklós",
				"size": 4,
				"levels": "1234",
				"lat": 47.337997,
				"lon": 19.034276
			},
			{
				"caption": "Szob",
				"description": "(1314) Szob",
				"size": 4,
				"levels": "1234",
				"lat": 47.817473,
				"lon": 18.872159
			},
			{
				"caption": "Vác",
				"description": "(1315) Vác",
				"size": 4,
				"levels": "1234",
				"lat": 47.785259,
				"lon": 19.146
			},
			{
				"caption": "Pilisvörösvár",
				"description": "(1316) Pilisvörösvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.614664,
				"lon": 18.899579
			},
			{
				"caption": "Dunakeszi",
				"description": "(1317) Dunakeszi",
				"size": 4,
				"levels": "1234",
				"lat": 47.635423,
				"lon": 19.130064
			},
			{
				"caption": "Albertirsa",
				"description": "(1318) Albertirsa",
				"size": 4,
				"levels": "1234",
				"lat": 47.245327,
				"lon": 19.612755
			},
			{
				"caption": "Gyömrő",
				"description": "(1319) Gyömrő",
				"size": 4,
				"levels": "1234",
				"lat": 47.42056,
				"lon": 19.39105
			},
			{
				"caption": "Zsámbék",
				"description": "(1320) Zsámbék",
				"size": 4,
				"levels": "1234",
				"lat": 47.55691,
				"lon": 18.727146
			},
			{
				"caption": "Örkény",
				"description": "(1321) Örkény",
				"size": 4,
				"levels": "1234",
				"lat": 47.130325,
				"lon": 19.436529
			},
			{
				"caption": "Vámosmikola",
				"description": "(1322) Vámosmikola",
				"size": 4,
				"levels": "1234",
				"lat": 47.978945,
				"lon": 18.786911
			},
			{
				"caption": "Budaörs",
				"description": "(1323) Budaörs",
				"size": 4,
				"levels": "1234",
				"lat": 47.460309,
				"lon": 18.934474
			},
			{
				"caption": "Tápiószele",
				"description": "(1324) Tápiószele",
				"size": 4,
				"levels": "1234",
				"lat": 47.332874,
				"lon": 19.876102
			},
			{
				"caption": "Kaposvár",
				"description": "(1401) Kaposvár",
				"size": 4,
				"levels": "1234",
				"lat": 46.367909,
				"lon": 17.789355
			},
			{
				"caption": "Barcs",
				"description": "(1403) Barcs",
				"size": 4,
				"levels": "1234",
				"lat": 45.959475,
				"lon": 17.470999
			},
			{
				"caption": "Balatonlelle",
				"description": "(1404) Balatonlelle",
				"size": 4,
				"levels": "1234",
				"lat": 46.809836,
				"lon": 17.770207
			},
			{
				"caption": "Csurgó",
				"description": "(1405) Csurgó",
				"size": 4,
				"levels": "1234",
				"lat": 46.253226,
				"lon": 17.097886
			},
			{
				"caption": "Fonyód",
				"description": "(1406) Fonyód",
				"size": 4,
				"levels": "1234",
				"lat": 46.733263,
				"lon": 17.536677
			},
			{
				"caption": "Lengyeltóti",
				"description": "(1407) Lengyeltóti",
				"size": 4,
				"levels": "1234",
				"lat": 46.667814,
				"lon": 17.640189
			},
			{
				"caption": "Marcali",
				"description": "(1408) Marcali",
				"size": 4,
				"levels": "1234",
				"lat": 46.584277,
				"lon": 17.423365
			},
			{
				"caption": "Nagyatád",
				"description": "(1409) Nagyatád",
				"size": 4,
				"levels": "1234",
				"lat": 46.23408,
				"lon": 17.35969
			},
			{
				"caption": "Siófok",
				"description": "(1410) Siófok",
				"size": 4,
				"levels": "1234",
				"lat": 46.903306,
				"lon": 18.057013
			},
			{
				"caption": "Tab",
				"description": "(1411) Tab",
				"size": 4,
				"levels": "1234",
				"lat": 46.727846,
				"lon": 18.025747
			},
			{
				"caption": "Nyĺregyháza",
				"description": "(1501) Nyĺregyháza",
				"size": 4,
				"levels": "1234",
				"lat": 47.950787,
				"lon": 21.727425
			},
			{
				"caption": "Baktalórántháza",
				"description": "(1502) Baktalórántháza",
				"size": 4,
				"levels": "1234",
				"lat": 48.007092,
				"lon": 22.075987
			},
			{
				"caption": "Csenger",
				"description": "(1503) Csenger",
				"size": 4,
				"levels": "1234",
				"lat": 47.835981,
				"lon": 22.680081
			},
			{
				"caption": "Fehérgyarmat",
				"description": "(1504) Fehérgyarmat",
				"size": 4,
				"levels": "1234",
				"lat": 47.995464,
				"lon": 22.511426
			},
			{
				"caption": "Kemecse",
				"description": "(1505) Kemecse",
				"size": 4,
				"levels": "1234",
				"lat": 48.068105,
				"lon": 21.80019
			},
			{
				"caption": "Kisvárda",
				"description": "(1506) Kisvárda",
				"size": 4,
				"levels": "1234",
				"lat": 48.207071,
				"lon": 22.088933
			},
			{
				"caption": "Mátészalka",
				"description": "(1507) Mátészalka",
				"size": 4,
				"levels": "1234",
				"lat": 47.953758,
				"lon": 22.31862
			},
			{
				"caption": "Nyĺrbátor",
				"description": "(1508) Nyĺrbátor",
				"size": 4,
				"levels": "1234",
				"lat": 47.836811,
				"lon": 22.135628
			},
			{
				"caption": "Tiszalök",
				"description": "(1509) Tiszalök",
				"size": 4,
				"levels": "1234",
				"lat": 47.972483,
				"lon": 21.556279
			},
			{
				"caption": "Vásárosnamény",
				"description": "(1510) Vásárosnamény",
				"size": 4,
				"levels": "1234",
				"lat": 48.123648,
				"lon": 22.318039
			},
			{
				"caption": "Ibrány",
				"description": "(1511) Ibrány",
				"size": 4,
				"levels": "1234",
				"lat": 48.123619,
				"lon": 21.71018
			},
			{
				"caption": "Nyĺrlugos",
				"description": "(1512) Nyĺrlugos",
				"size": 4,
				"levels": "1234",
				"lat": 47.689757,
				"lon": 22.036686
			},
			{
				"caption": "Rakamaz",
				"description": "(1513) Rakamaz",
				"size": 4,
				"levels": "1234",
				"lat": 48.123537,
				"lon": 21.472282
			},
			{
				"caption": "Balkány",
				"description": "(1514) Balkány",
				"size": 4,
				"levels": "1234",
				"lat": 47.771576,
				"lon": 21.86316
			},
			{
				"caption": "Záhony",
				"description": "(1515) Záhony",
				"size": 4,
				"levels": "1234",
				"lat": 48.399052,
				"lon": 22.178558
			},
			{
				"caption": "Újfehértó",
				"description": "(1516) Újfehértó",
				"size": 4,
				"levels": "1234",
				"lat": 47.79068,
				"lon": 21.678483
			},
			{
				"caption": "Szolnok",
				"description": "(1601) Szolnok",
				"size": 4,
				"levels": "1234",
				"lat": 47.189352,
				"lon": 20.194718
			},
			{
				"caption": "Jászberény",
				"description": "(1602) Jászberény",
				"size": 4,
				"levels": "1234",
				"lat": 47.49409,
				"lon": 19.912278
			},
			{
				"caption": "Karcag",
				"description": "(1603) Karcag",
				"size": 4,
				"levels": "1234",
				"lat": 47.326602,
				"lon": 20.914121
			},
			{
				"caption": "Kisújszállás",
				"description": "(1604) Kisújszállás",
				"size": 4,
				"levels": "1234",
				"lat": 47.215504,
				"lon": 20.757133
			},
			{
				"caption": "Kunhegyes",
				"description": "(1605) Kunhegyes",
				"size": 4,
				"levels": "1234",
				"lat": 47.371006,
				"lon": 20.627102
			},
			{
				"caption": "Kunszentmárton",
				"description": "(1606) Kunszentmárton",
				"size": 4,
				"levels": "1234",
				"lat": 46.830214,
				"lon": 20.282469
			},
			{
				"caption": "Mezőtúr",
				"description": "(1607) Mezőtúr",
				"size": 4,
				"levels": "1234",
				"lat": 47.003537,
				"lon": 20.621961
			},
			{
				"caption": "Tiszafüred",
				"description": "(1608) Tiszafüred",
				"size": 4,
				"levels": "1234",
				"lat": 47.620118,
				"lon": 20.756766
			},
			{
				"caption": "Törökszentmiklós",
				"description": "(1609) Törökszentmiklós",
				"size": 4,
				"levels": "1234",
				"lat": 47.178605,
				"lon": 20.408984
			},
			{
				"caption": "Túrkeve",
				"description": "(1610) Túrkeve",
				"size": 4,
				"levels": "1234",
				"lat": 47.108806,
				"lon": 20.741003
			},
			{
				"caption": "Martfű",
				"description": "(1611) Martfű",
				"size": 4,
				"levels": "1234",
				"lat": 47.01863,
				"lon": 20.2957
			},
			{
				"caption": "Jászkisér",
				"description": "(1612) Jászkisér",
				"size": 4,
				"levels": "1234",
				"lat": 47.460244,
				"lon": 20.213425
			},
			{
				"caption": "Jászapáti",
				"description": "(1613) Jászapáti",
				"size": 4,
				"levels": "1234",
				"lat": 47.513047,
				"lon": 20.13764
			},
			{
				"caption": "Jászárokszállás",
				"description": "(1614) Jászárokszállás",
				"size": 4,
				"levels": "1234",
				"lat": 47.645086,
				"lon": 19.980408
			},
			{
				"caption": "Szekszárd",
				"description": "(1701) Szekszárd",
				"size": 4,
				"levels": "1234",
				"lat": 46.34446,
				"lon": 18.706507
			},
			{
				"caption": "Dombóvár",
				"description": "(1702) Dombóvár",
				"size": 4,
				"levels": "1234",
				"lat": 46.374058,
				"lon": 18.131631
			},
			{
				"caption": "Bonyhád",
				"description": "(1703) Bonyhád",
				"size": 4,
				"levels": "1234",
				"lat": 46.294896,
				"lon": 18.527691
			},
			{
				"caption": "Paks",
				"description": "(1704) Paks",
				"size": 4,
				"levels": "1234",
				"lat": 46.605847,
				"lon": 18.847978
			},
			{
				"caption": "Tamási",
				"description": "(1705) Tamási",
				"size": 4,
				"levels": "1234",
				"lat": 46.642984,
				"lon": 18.278118
			},
			{
				"caption": "Simontornya",
				"description": "(1706) Simontornya",
				"size": 4,
				"levels": "1234",
				"lat": 46.752086,
				"lon": 18.555143
			},
			{
				"caption": "Hőgyész",
				"description": "(1707) Hőgyész",
				"size": 4,
				"levels": "1234",
				"lat": 46.496956,
				"lon": 18.416575
			},
			{
				"caption": "Dunaföldvár",
				"description": "(1708) Dunaföldvár",
				"size": 4,
				"levels": "1234",
				"lat": 46.807006,
				"lon": 18.92204
			},
			{
				"caption": "Szombathely",
				"description": "(1801) Szombathely",
				"size": 4,
				"levels": "1234",
				"lat": 47.240741,
				"lon": 16.618188
			},
			{
				"caption": "Celldömölk",
				"description": "(1802) Celldömölk",
				"size": 4,
				"levels": "1234",
				"lat": 47.254275,
				"lon": 17.157695
			},
			{
				"caption": "Körmend",
				"description": "(1803) Körmend",
				"size": 4,
				"levels": "1234",
				"lat": 47.009668,
				"lon": 16.59239
			},
			{
				"caption": "Kőszeg",
				"description": "(1804) Kőszeg",
				"size": 4,
				"levels": "1234",
				"lat": 47.390212,
				"lon": 16.536961
			},
			{
				"caption": "Sárvár",
				"description": "(1805) Sárvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.24984,
				"lon": 16.941787
			},
			{
				"caption": "Szentgotthárd",
				"description": "(1806) Szentgotthárd",
				"size": 4,
				"levels": "1234",
				"lat": 46.952599,
				"lon": 16.275722
			},
			{
				"caption": "Vasvár",
				"description": "(1807) Vasvár",
				"size": 4,
				"levels": "1234",
				"lat": 47.051129,
				"lon": 16.797745
			},
			{
				"caption": "Bük",
				"description": "(1808) Bük",
				"size": 4,
				"levels": "1234",
				"lat": 47.384457,
				"lon": 16.752291
			},
			{
				"caption": "Répcelak",
				"description": "(1809) Répcelak",
				"size": 4,
				"levels": "1234",
				"lat": 47.421661,
				"lon": 17.017151
			},
			{
				"caption": "Őriszentpéter",
				"description": "(1810) Őriszentpéter",
				"size": 4,
				"levels": "1234",
				"lat": 46.840127,
				"lon": 16.423198
			},
			{
				"caption": "Veszprém",
				"description": "(1901) Veszprém",
				"size": 4,
				"levels": "1234",
				"lat": 47.084982,
				"lon": 17.920176
			},
			{
				"caption": "Ajka",
				"description": "(1902) Ajka",
				"size": 4,
				"levels": "1234",
				"lat": 47.105067,
				"lon": 17.566929
			},
			{
				"caption": "Balatonfüred",
				"description": "(1903) Balatonfüred",
				"size": 4,
				"levels": "1234",
				"lat": 46.948765,
				"lon": 17.871227
			},
			{
				"caption": "Balatonfűzfő",
				"description": "(1904) Balatonfűzfő",
				"size": 4,
				"levels": "1234",
				"lat": 47.020133,
				"lon": 18.155291
			},
			{
				"caption": "Pápa",
				"description": "(1905) Pápa",
				"size": 4,
				"levels": "1234",
				"lat": 47.325724,
				"lon": 17.469475
			},
			{
				"caption": "Sümeg",
				"description": "(1906) Sümeg",
				"size": 4,
				"levels": "1234",
				"lat": 46.975781,
				"lon": 17.284296
			},
			{
				"caption": "Tapolca",
				"description": "(1907) Tapolca",
				"size": 4,
				"levels": "1234",
				"lat": 46.883079,
				"lon": 17.422677
			},
			{
				"caption": "Várpalota",
				"description": "(1908) Várpalota",
				"size": 4,
				"levels": "1234",
				"lat": 47.200879,
				"lon": 18.141194
			},
			{
				"caption": "Zirc",
				"description": "(1909) Zirc",
				"size": 4,
				"levels": "1234",
				"lat": 47.26089,
				"lon": 17.867834
			},
			{
				"caption": "Nagyvázsony",
				"description": "(1910) Nagyvázsony",
				"size": 4,
				"levels": "1234",
				"lat": 46.981226,
				"lon": 17.700036
			},
			{
				"caption": "Tüskevár",
				"description": "(1911) Tüskevár",
				"size": 4,
				"levels": "1234",
				"lat": 47.11746,
				"lon": 17.311774
			},
			{
				"caption": "Zalaegerszeg",
				"description": "(2001) Zalaegerszeg",
				"size": 4,
				"levels": "1234",
				"lat": 46.838151,
				"lon": 16.843601
			},
			{
				"caption": "Keszthely",
				"description": "(2002) Keszthely",
				"size": 4,
				"levels": "1234",
				"lat": 46.769295,
				"lon": 17.250638
			},
			{
				"caption": "Lenti",
				"description": "(2003) Lenti",
				"size": 4,
				"levels": "1234",
				"lat": 46.622608,
				"lon": 16.543527
			},
			{
				"caption": "Nagykanizsa",
				"description": "(2004) Nagykanizsa",
				"size": 4,
				"levels": "1234",
				"lat": 46.45048,
				"lon": 17.000455
			},
			{
				"caption": "Zalaszentgrót",
				"description": "(2005) Zalaszentgrót",
				"size": 4,
				"levels": "1234",
				"lat": 46.938275,
				"lon": 17.107961
			},
			{
				"caption": "Letenye",
				"description": "(2006) Letenye",
				"size": 4,
				"levels": "1234",
				"lat": 46.435856,
				"lon": 16.72289
			},
			{
				"caption": "Pacsa",
				"description": "(2007) Pacsa",
				"size": 4,
				"levels": "1234",
				"lat": 46.719267,
				"lon": 17.013404
			},
			{
				"caption": "Zalakaros",
				"description": "(2008) Zalakaros",
				"size": 4,
				"levels": "1234",
				"lat": 46.556043,
				"lon": 17.124623
			}
		]

	},
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
