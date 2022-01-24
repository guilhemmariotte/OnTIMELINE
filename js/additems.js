// OnTIMELINE - ontimeline.guilhemmariotte.com
//
// JavaScript application to display historical timelines
// Based on Wikipedia data and vis-timeline.js library
//
// Author: Guilhem Mariotte
// Date: Jan 2022
// 
//-----------------------------------------------------------------------------------


// DOM element where the Timeline will be attached
const requesttext = document.getElementById("txt_request");
const selectedlangbtn = document.getElementById("selected_lang");
const resultstable = document.getElementById("results_table");
const resultslist = document.getElementById("results_list");
const resultsmsg = document.getElementById("results_msg");
const submitbtn = document.getElementById("submit_request");
const additemsbtn = document.getElementById("add_items");
const confirmmsg = document.getElementById("add_confirm");






//-----------------------------------------------------------------------------------
// Wikipedia request
function submitRequest(evt) {
	evt.preventDefault(); // Prevent default behavior of submit button
	submitbtn.disabled = "disabled";
	submitbtn.style.cursor = "wait";
	
	// Launch request
	var request = new XMLHttpRequest();
	var lang = selectedlangbtn.innerHTML.toLowerCase();
	//var url = "https://fr.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=5&gsrsearch='" + requesttext.value + "'";
	var url = "https://api.wikimedia.org/core/v1/wikipedia/" + lang + "/search/page?q='" + requesttext.value + "'&limit=5";
	request.open('GET', url, true);
	
	// Once request has loaded...
	request.onload = function() {
		submitbtn.disabled = "";
		submitbtn.style.cursor = "pointer";
		resultstable.parentNode.style.visibility = "visible";
		// Results of the request
		var data = JSON.parse(this.response);
		data_request = [...data["pages"]];
		console.log(data_request)
		// Clear list of results
		while (resultslist.hasChildNodes()) {
			resultslist.removeChild(resultslist.lastChild);
		}
		
		// Check if results
		if (data_request.length == 0 | requesttext.value == "") {
			resultsmsg.innerHTML = "Aucun résultat trouvé";
		} else {
			resultsmsg.innerHTML = "Cliquer sur un résultat pour l'ajouter au tableau";
			// Append list of results
			for (var i = 0 ; i < data_request.length; i++) {
				var listitem = document.createElement("li");
				listitem.id = "item_" + String(i);
				listitem.name = "result_item";
				listitem.className = "tooltip";
				listitem.innerHTML = data_request[i]["title"];
				var tooltip = document.createElement("p");
				tooltip.className = "tooltiptext";
				tooltip.innerHTML = data_request[i]["description"];
				listitem.appendChild(tooltip);
				// Add to table on click
				listitem.addEventListener("click", function () {
					var ind = Number(this.id.split("_")[1]);
					getPageLanguage(ind, (key_en, i) => {
						addToTable(key_en, i);
					});
				});
				resultslist.appendChild(listitem);
			}
		}
	}
	// Send request to the server asynchronously
	request.send();
}


// Select language for request
function selectLang(evt) {
	evt.preventDefault();
	var lang = evt.target.innerHTML;
	selectedlangbtn.innerHTML = lang;
}


// Get EN page key (used to access DBpedia)
function getPageLanguage(ind, callback) {
	var request = new XMLHttpRequest();
	var lang = selectedlangbtn.innerHTML.toLowerCase();
	var key = data_request[ind]["key"];
	var url = "https://api.wikimedia.org/core/v1/wikipedia/" + lang + "/page/" + key + "/links/language";
	request.open('GET', url, true);
	
	// Once request has loaded...
	request.onload = function() {
		var data = JSON.parse(this.response);
		var key_en = "";
		for (var i = 0 ; i < data.length ; i++) {
			if (data[i]["code"] == "en") {
				key_en = data[i]["key"];
			}
		}
		if (lang == "en") {
			key_en = key;
		}
		callback(key_en, ind);
	}
	// Send request to the server asynchronously
	request.send();
}


// Add page info to table (get info from DBpedia request)
function addToTable(key_en, ind) {
	var request = new XMLHttpRequest();
	var lang = selectedlangbtn.innerHTML.toLowerCase();
	//var url = "https://api.wikimedia.org/core/v1/wikipedia/fr/page/" + key; // wikipedia source, key in FR
	var url = "https://dbpedia.org/data/" + key_en + ".json"; // dbpedia parsed data, key in EN
	request.open('GET', url, true);
	
	// Once request has loaded...
	request.onload = function() {
		var data = JSON.parse(this.response);
		var data = data["http://dbpedia.org/resource/" + key_en];
		var startdate = "";
		var enddate = "";
		var title = data_request[ind]["title"];
		var descr = data_request[ind]["description"];
		var subject = "unknown";
		var type = "";
		var country = lang;
		var link = "https://" + lang + ".wikipedia.org/wiki/" + data_request[ind]["key"];
		
		// Get dates
		if (data["http://dbpedia.org/ontology/date"]) {
			startdate = data["http://dbpedia.org/ontology/date"][0].value;
			if (data["http://dbpedia.org/ontology/date"].length > 1) {
				enddate = data["http://dbpedia.org/ontology/date"][1].value;
			}
		}
		if (data["http://dbpedia.org/ontology/birthYear"]) {
			var date = data["http://dbpedia.org/ontology/birthYear"][0].value;
			if (date != "") {
				startdate = date;
			}
		}
		if (data["http://dbpedia.org/ontology/deathYear"]) {
			var date = data["http://dbpedia.org/ontology/deathYear"][0].value;
			if (date != "") {
				enddate = date;
			}
		}
		if (data["http://dbpedia.org/property/birthDate"]) {
			var dates = data["http://dbpedia.org/property/birthDate"];
			var i = 0;
			while (i < dates.length & dates[i].value == "") {
				i++;
			}
			if (i < dates.length) {
				startdate = dates[i].value;
			}
		}
		if (data["http://dbpedia.org/property/deathDate"]) {
			var dates = data["http://dbpedia.org/property/deathDate"];
			var i = 0;
			while (i < dates.length & dates[i].value == "") {
				i++;
			}
			if (i < dates.length) {
				enddate = dates[i].value;
			}
		}
		if (data["http://www.w3.org/2000/01/rdf-schema#label"]) {
			// names in other lang
		}
		
		// Get subject
		if (data["http://dbpedia.org/property/wikiPageUsesTemplate"]) {
			var props = data["http://dbpedia.org/property/wikiPageUsesTemplate"];
			var subject0 = "";
			for (var i = 0; i < props.length; i++) {
				var subj = props[i].value.split("Template:Infobox_");
				if (subj.length > 1) {
					subject0 = subject0 + ", " + subj[1];
				}
			}
			if (subject0 != "") {
				subject = subject0.slice(2, subject0.length);
			}
		}
		
		// Fill the table
		var itemcontents = [
			startdate,
			enddate,
			title, //"<a target='_blank' href='" + link + "'>" + breaklines(title, 20) + "</a>",
			descr,
			subject,
			country,
			"<a target='_blank' href='" + link + "'>" + "<i class='fa fa-external-link w3-hover-opacity w3-xlarge w3-padding-small' style='cursor: pointer'></i>" + "</a>",
			"<i class='fa fa-times w3-hover-opacity w3-xlarge w3-padding-small' style='cursor: pointer'></i>"
		];
		var tabrow = document.createElement("tr");
		// tabrow.setAttribute("dataid", id);
		for (var i = 0 ; i < itemcontents.length ; i++) {
			var tabitem = document.createElement("td");
			if (i == 6) {
				tabitem.innerHTML = itemcontents[i]; // link, not editable
			} else if (i == 7) {
				tabitem.innerHTML = itemcontents[i]; // delete row, not editable
				// Delete row on click
				tabitem.addEventListener("click", function () {
					// Delete row
					var i_row = this.parentNode.rowIndex;
					resultstable.deleteRow(i_row);
				});
			} else {
				tabitem.innerHTML = itemcontents[i];
				tabitem.setAttribute("contenteditable", "");
			}
			tabrow.appendChild(tabitem);
		}
		resultstable.appendChild(tabrow);
	}
	// Send request to the server asynchronously
	request.send();
	
	// resultstable.empty();
	// var apiUrl = api + "%27" + searchBar.value.replace(/[\s]/g, '_') + "%27";
}


// Clear the table
function clearTable(evt) {
	var numrows = resultstable.rows.length - 1;
	for (i = 0; i < numrows; i++) {
		resultstable.deleteRow(1);
	}
}


// Add items from the table
function addTableItems(evt) {
	additemsbtn.disabled = "disabled";
	additemsbtn.style.cursor = "wait";
	data_timeline_add = [];
	for (i = 1; i < resultstable.rows.length; i++) {
		var cells = resultstable.rows.item(i).cells;
		// Append to timeline data to add
		if (data_timeline_add.length > 0) {
			var i0 = data_timeline_add.length - 1;
			var id = data_timeline_add[i0]["id"] + 1;
		} else {
			var id = 1;
		}
		data_timeline_add.push({
			"id": id,
			"start date": cells[0].innerHTML,
			"end date": cells[1].innerHTML,
			"title": cells[2].innerHTML,
			"description": cells[3].innerHTML,
			"country": cells[5].innerHTML,
			"type": "",
			"subject": cells[4].innerHTML,
			"wikipedia link": cells[6].childNodes[0].href,
			"color": ""
		});
	}

	groups.forEach(function (group) {
		for (var i = 0; i < data_timeline.length; i++) {
			if (data_timeline[i]["start date"] == "group" & data_timeline[i]["subject"] == group.id) {
				data_timeline[i]["color"] = group.color;
			}
		}
	});
	
	// Timeline data
	data_timeline = [...data_timeline, ...data_timeline_add];

	// Timeline groups
	var groupids = [];
	// if (groups) {
		// groupids = groups.getIds();
	// }
	data_timeline = setTimelineGroups(data_timeline, groupids);
	
	// Timeline countries
	var countryids = [];
	// if (countries) {
		// countryids = countries.getIds();
	// }
	setTimelineCountries(data_timeline, countryids);
	
	// Create the timeline
	createTimeline(data_timeline);
	
	additemsbtn.disabled = "";
	additemsbtn.style.cursor = "pointer";
	confirmmsg.style.display = "block";
	setTimeout(() => {
		confirmmsg.style.display = "none";
	}, 3000);
}

