"use strict";
var Rkis = Rkis || {};
Rkis.Designer = Rkis.Designer || {};

function FetchImage(url) {
	return new Promise(resolve => {
		chrome.runtime.sendMessage({about: "getImageRequest", url: url}, 
		function(data) {
			resolve(data)
		})
	})
}

Rkis.Designer.GetPageTheme = function() {

	var wholedata = Rkis.wholeData || {};
	wholedata.Designer = wholedata.Designer || {};
	wholedata.Designer.Theme = wholedata.Designer.Theme || {};
	wholedata.Designer.Themes = wholedata.Designer.Themes || [];

	if (wholedata.Designer.Theme.id == null) return null;
	if (wholedata.Designer.Theme.isDefaultTheme == false && wholedata.Designer.Themes.length - 1 < wholedata.Designer.Theme.id) return null;

	return {
		isDefaultTheme: wholedata.Designer.Theme.isDefaultTheme,
		themeId: wholedata.Designer.Theme.id
	};
}

Rkis.Designer.SetupTheme = async function() {

	if (Rkis.generalLoaded != true) {
		document.addEventListener("rk-general-loaded", () => {
			Rkis.Designer.SetupTheme();
		}, {once: true});
		return;
	}

	let mainStyle = null;

	const addStyle = url => {
		const cssRule = `@import url("${url}")`;
		const ruleIndex = mainStyle.insertRule(cssRule, mainStyle.cssRules.length);
		
		return mainStyle.cssRules[ruleIndex];
	}

	Rkis.Designer.addCSS = (paths) => {
		if(window.ContextScript != true) return console.error("Not Context Script");
		if(typeof paths == "string") paths = [paths];

		if(!mainStyle) {
			const style = document.createElement("style");

			const parent = document.head || document.documentElement;
			parent.append(style);

			mainStyle = style.sheet;
		}
		
		paths.forEach((path) => {
			addStyle(Rkis.fileLocation + path);
		})
	}

	var putCSS = Rkis.Designer.addCSS; //shorter form
	putCSS(["js/Theme/Extras/features.css"]);

	if(Rkis.IsSettingEnabled("ExtraShadows", {
	id: "ExtraShadows",
	type: "switch",
	value: { switch: false },
	details: {
		default: "en",
		translate: {
			name: "sectionExtraS",
			description: "sectionExtraS1"
		},
		"en": {
			name: "Extra Shadows",
			description: "Adds a shadow effect under or around some elements.",
		}
	}
	}))
		putCSS(["js/Theme/Pages/shadows.css"]);

	if(Rkis.IsSettingDisabled("UseThemes", {
	id: "UseThemes",
	type: "switch",
	value: { switch: true },
	details: {
		default: "en",
		translate: {
			name: "sectionUThemes",
			description: "sectionUThemes1"
		},
		"en": {
			name: "Use Themes",
			description: "Disabling this will disable Styles and Themes!",
		}
	}
	})) {
		putCSS(["js/Theme/Extras/extensions.css"]);
		document.$watch("body", (e) => {e.classList.add("Roblokis-no-themes")});
		return;
	}

	var allCssFiles = [
		{match: ".com/home", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/home.css" ]},
		{match: ".com/discover", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/discover.css" ]},
		{match: ".com/users/", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/profile.css" ]},
		{match: ".com/games/", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/games.css" ]},
		{match: ".com/groups/", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/groups.css" ]},
		
		{match: ".com/catalog", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/catalog.css" ]},
		{match: ".com/upgrades/", paths: [ "js/Theme/Pages/all.css" ]},

		{match: ".com/transactions", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/transactions.css" ]},
		{match: ".com/trades", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/trades.css" ]},
		{match: ".com/my/messages", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/messages.css" ]},
		{match: ".com/my/avatar", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/avatar.css" ]},
		{match: ".com/my/account", paths: [ "js/Theme/Pages/all.css", "js/Theme/Pages/settings.css" ]}
	];

	let loadedStyleFile = false;
	allCssFiles.forEach((e) => {
		if(!window.location.href.toLowerCase().includes(e.match)) return;

		putCSS(e.paths);
		loadedStyleFile = true;
	});

	if (loadedStyleFile == false) {
		return;
	}

	var pagetheme = Rkis.Designer.GetPageTheme();

	if(pagetheme == null) {
		var continueloading = true;
		document.$watch("body", (bodyElement) => {
			if(bodyElement.classList.contains("light-theme") == Rkis.wholeData.isUsingLightTheme) return;

			Rkis.wholeData.isUsingLightTheme = bodyElement.classList.contains("light-theme");
			localStorage.setItem("Roblokis", JSON.stringify(Rkis.wholeData));
			Rkis.Designer.SetupTheme();
			continueloading = false;
		});

		if (continueloading == false) return;

		if(Rkis.wholeData.isUsingLightTheme == true) {
			await fetch(Rkis.fileLocation + "js/Theme/DefaultLight.Roblokis")
			.then(response => response.json())
			.then(theme => {Rkis.Designer.currentTheme = theme;})
			.catch(err => {console.error(err);})
		}
		else {
			await fetch(Rkis.fileLocation + "js/Theme/DefaultDark.Roblokis")
			.then(response => response.json())
			.then(theme => {Rkis.Designer.currentTheme = theme;})
			.catch(err => {console.error(err);})
		}
	}
	else if(pagetheme.isDefaultTheme == false) {
		//load custom theme
		Rkis.Designer.currentTheme = Rkis.wholeData.Designer.Themes[pagetheme.themeId];
	}
	else {
		if(pagetheme.themeId == 1) {
			//load other theme
			await fetch(Rkis.fileLocation + "js/Theme/DefaultLight.Roblokis")
			.then(response => response.json())
			.then(theme => {Rkis.Designer.currentTheme = theme;})
			.catch(err => {console.error(err);})
		}
		else {
			await fetch(Rkis.fileLocation + "js/Theme/DefaultDark.Roblokis")
			.then(response => response.json())
			.then(theme => {Rkis.Designer.currentTheme = theme;})
			.catch(err => {console.error(err);})
		}
	}
	
	var theme = Rkis.Designer.currentTheme;
	if(theme == null) return;

	let isModified = theme.pages != null;

	if (isModified == false) {
		theme.pages = theme.pages || {};

		for (let page in theme) {
			if (theme[page].css == null) continue;
			
			isModified = true;
			theme.pages[page] = theme[page].css;
			delete theme[page];
		}
	}
	
	if(isModified == false) return;

	var tamplate0 = null;
	var tamplate05 = "";
	var tamplate1 = "";
	var tamplate2 = "";
	var tamplate3 = "";


	tamplate0 = await fetch(Rkis.fileLocation + "js/Theme/DefaultTamplate.css")
	.then(response => response.text())
	.catch(err => {return null;})
	if(tamplate0 == null) return;

	// Format
		/*>|REPLACE WITH STUFF|.value<*/
	/* Result
		stuff1.value
		stuff2.value
		...
	*/
	
	//auto complete
	tamplate0.split("/*>").forEach((e, i) => {
		if(i == 0) return tamplate05 += e;

		var n = e.split("<*/");
		if(n.length < 2) return tamplate05 += e;

		var completecode = "";

		if(n[0].includes("|CORNERS|")) {
			var alltheelements = ["all","top-left","top-right","bottom-right","bottom-left"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|CORNERS|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}
		if(n[0].includes("|CORNER|")) {
			var alltheelements = ["top-left","top-right","bottom-right","bottom-left"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|CORNER|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}
		if(n[0].includes("|SIDES|")) {
			var alltheelements = ["all","top","left","bottom","right"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|SIDES|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}
		if(n[0].includes("|SIDE|")) {
			var alltheelements = ["top","right","bottom","left"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|SIDE|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}
		if(n[0].includes("|IMAGE|")) {
			var alltheelements = ["size","repeat","position","attachment"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|IMAGE|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}
		if(n[0].includes("|IMG|")) {
			var alltheelements = ["repeat","position","attachment"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|IMG|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += " "; //make them look good
			})
		}

		if(completecode == "") return tamplate05 += n[1];

		tamplate05 += completecode + n[1];
	});

	/* Format
		--loopstart: 0;
			dummy: "hi";
			|replace with stuff|.value
		--loopend: 0;
	// Result
		dummy: "hi";
		stuff1.value
		dummy: "hi";
		stuff2.value
		...
	*/
	tamplate05.split("--loopstart: 0;").forEach((e, i) => {
		if(i == 0) return tamplate1 += e;

		var n = e.split("--loopend: 0;");
		if(n.length < 2) return tamplate1 += e;

		var completecode = "";

		if(n[0].includes("|server|")) {
			var alltheelements = ["publicserver","smallserver","friendsserver","privateserver"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|server|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}
		if(n[0].includes("|fullpack|")) {
			var alltheelements = ["pagenav","badge","content","menu","profile","group"];

			alltheelements.forEach((element, elementnumber) => {
				completecode += n[0].split("|fullpack|").join(element);
				if(elementnumber != alltheelements.length - 1) completecode += "\n"; //make them look good
			})
		}

		if(completecode == "") return tamplate1 += n[1];

		tamplate1 += completecode + n[1];
	});

	//--rk-something: %variable%;
	//--rk-something: $value&default#;

	//auto variable
	tamplate1.split("{").forEach((selector, selectorIndex) => {
		if(selectorIndex == 0) return tamplate2 += selector; //don't change start

		let afterit = "}" + selector.split('}').slice(1).join("}");
		let beforeit = "{";
		let propertiesPart = selector.split("}")[0];

		tamplate2 += beforeit;

		propertiesPart.split(":").forEach((codepart, i) => {
			if(i == 0) return tamplate2 += codepart; //don't change start
			let afterit = ";" + codepart.split(';').slice(1).join(";");
			let beforeit = ":";
			codepart = codepart.split(';')[0]; //keep the cutted part

			var fill = ""; //values
			var filled = false; //check if css used

			if(!codepart.includes("$") && !codepart.includes("%")) return tamplate2 += codepart; //no variable detection
			var all_values = codepart.split("$"); //collect variables

			for (var dollar_num = 0; dollar_num < all_values.length; dollar_num++) {
				if(dollar_num == 0) {fill += all_values[0]; continue;} //don't change start
				
				//no end detection
				var raw_value = all_values[dollar_num].split("#");
				if(raw_value.length < 2) {fill += "$" + all_values[dollar_num]; continue;}

				var raw_multiple_value = raw_value[0].split("&")[0].split("/"); //multiple value detection

				var val = null; //value

				var checkvalue = function(check_value, allcheck) {
					var tryval = theme.pages[Rkis.pageName];
					if (allcheck == true) tryval = theme.pages.all;
					if (tryval == null) return null;

					var value_dots = check_value.split(".");

					for(var doti = 0; doti < value_dots.length && tryval != null; doti++) {
						var dot = value_dots[doti];
						tryval = tryval[dot];
					}

					return tryval;
				}

				for(var checking_num = 0; checking_num < raw_multiple_value.length && val == null; checking_num++) {
					var to_check_value = raw_multiple_value[checking_num];

					val = checkvalue(to_check_value);

					if(val != null) continue;

					val = checkvalue(to_check_value, true);
				}

				if(val == null && raw_value[0].split("&").length > 1) {
					val = raw_value[0].split("&")[1];
				}

				if(val == null) {fill += raw_value[1]; continue;}

				fill += val + raw_value[1];
				filled = true;

			}

			if(codepart.includes("%") && codepart.split("%").length > 2) {
				var prts = codepart.split("%");

				var val = null;
				if(Rkis.wholeData[prts[1]] != true) val = "disabled";

				if(val != null) {
					fill += prts[0];

					fill += val;

					fill += prts[2];

					filled = true;
				}
			}

			if (filled == false) {
				let variableKey = propertiesPart.split(":")[i-1].split("\n").slice(-1)[0];
				tamplate2 = tamplate2.slice(0, -1 * variableKey.length) + afterit.slice(1);
				return;
			}

			return tamplate2 += beforeit + fill + afterit;
		});
		
		tamplate2 += afterit;
	});

	//url replacer
	var splittenTemplate2 = tamplate2.split("url(https://");
	for (var i = 0; i < splittenTemplate2.length; i++) {
		var codepart = splittenTemplate2[i];
		if(i == 0){tamplate3 += codepart; continue;} //don't change start
		codepart = "url(https://" + codepart; //keep the cutted part

		var fill = ""; //values

		if(codepart.split(")").length < 2) {tamplate3 += codepart; continue;} //no variable detection
		var url = codepart.split("url(")[1].split(")")[0];

		fill = await FetchImage(url);

		//console.log(url, fill);

		tamplate3 += 'url(' + fill + ')' + codepart.split(")").slice(1).join(')');
	};

	var styl = document.createElement("style");
	styl.id = "rk-theme-loaded";
	styl.innerHTML = tamplate3;
	document.$watch("head", (e) => {
		e.append(styl);
	});
	document.$watch(".light-theme, .dark-theme", (e) => {
		let isDark = theme.isDark != false;
		if (pagetheme == null) isDark = !Rkis.wholeData.isUsingLightTheme;

		changeRobloxTheme(isDark ? 'Dark' : 'Light');
	});

}

Rkis.Designer.SetupTheme();