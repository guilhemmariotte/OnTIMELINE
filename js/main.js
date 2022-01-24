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
const container = document.getElementById("visualization");
const contentdiv = document.getElementsByName("maincontent")[0];
const timelinediv = document.getElementById("Timeline");
const showhidediv = document.getElementById("showhide_div");
const colordiv = document.getElementById("color_div");
const showhideCountriesdiv = document.getElementById("showhide_countries_div");
const navbardiv = document.getElementById("navbar");

// Current page info
var currentpath = window.location.href; //window.location.pathname;
var currentpage = currentpath.substring(currentpath.lastIndexOf("/") + 1); // current_page.html
var pagename = currentpage.split(".")[0]; // current_page
var pageroot = currentpath.substring(0, currentpath.lastIndexOf("/")+1); // http://www.mysite.com/mypage/
//var filename_default = pageroot + pagename + "/frise_chrono.csv"
var filename_default = pageroot + "frise_chrono.csv";
var filetex = pageroot + "main.tex";
var filetex_source = pageroot + "main_source.tex";

document.getElementById("tab_timeline").click();

// Variables in the CSS
var root_css = document.querySelector(":root");

// Initialize global variables
var data_timeline = [];
var data_timeline_add = [];
var data_request = [];
var timeline = [];
var groups = [];
var countries = [];
var items = [];
var items_updated = [];
var defaultOptions = {};
var droppedfiles = [];







//-----------------------------------------------------------------------------------
// Convert from CSV formatted timeline data to a list of items (for DataVis data)
function convertTimelineData(data) {
	var data_items = [];
	for (var i = 0; i < data.length; i++) {
		if (data[i]["start date"] != "" & data[i]["start date"] != "group") {
			data[i]["id"] = String(i);
			var date_start = toISODate(data[i]["start date"]);
			var date_content = "<a target='_blank' href='" + data[i]["wikipedia link"] + "'>" + breaklines(data[i]["title"], 20) + "</a>";
			var date_title = "<div style='max-width:200px; display:inline-block; color:black;'>" + breaklines(data[i]["description"], 40) + "</div>";
			var date_class = "class" + String(groups.get(data[i]["subject"]).index);
			var date_style = "padding:0px; margin:0px; top:5px; visibility:visible";
			var date_countries = string2array(data[i]["country"]);
			
			if (data[i]["end date"] != "") {
				var date_end = toISODate(data[i]["end date"]);
				var item = {
					id: i,
					content: date_content,
					title: date_title,
					group: data[i]["subject"],
					country: date_countries,
					className: date_class,
					style: date_style,
					groupVisible: true,
					countryVisible: true,
					start: date_start,
					end: date_end,
					type: "range"
				};
			} else {
				var item = {
					id: i,
					content: date_content,
					title: date_title,
					group: data[i]["subject"],
					country: date_countries,
					className: date_class,
					style: date_style,
					groupVisible: true,
					countryVisible: true,
					start: date_start,
					type: "point"
				};
			}
			
			if (data[i]["type"] == "ère" | data[i]["type"] == "era") {
				item["type"] = "background";
				item["content"] = "<b>" + item["content"] + "</b>";
				// item["className"] = "classX";
			}
			
			data_items.push(item);
		}
	}
	return data_items;
}



//-----------------------------------------------------------------------------------
// Load the timeline when a data file is chosen
function loadTimeline() {
	var timeline_file = null;
	if (input.files.length > 0) {
		timeline_file = input.files[0];
		input.value = null; // clear file path to be able to reload the same file
	} else if (droppedfiles.length > 0) {
		timeline_file = droppedfiles[0];
	} else {
		timeline_file = filename_default;
	}
	Papa.parse(timeline_file, {
		header: true,
		download: true,
		complete: function(results) {
			
			// Timeline groups
			results.data = setTimelineGroups(results.data, []);
			
			// Timeline countries
			setTimelineCountries(results.data, []);
			
			// Timeline data
			data_timeline = results.data;
			
			// Create the timeline
			createTimeline(data_timeline);
		}
	});
}



//-----------------------------------------------------------------------------------
// Set the groups
function setTimelineGroups(results_data, groupids) {
	// Clear containers
	while (showhidediv.hasChildNodes()) {
		showhidediv.removeChild(showhidediv.lastChild);
	}
	while (colordiv.hasChildNodes()) {
		colordiv.removeChild(colordiv.lastChild);
	}
	
	// Timeline groups
	// var default_colors = ['#3CA25B', '#CB7179', '#cad750', '#7850a1', '#a1ca5a', '#f2273b', '#f2ca5a', '#78a1d7', '#a1a15a', '#ca5aca', '#ca783b', '#3b3b5a'];
	// var groupcolors = [];
	var results_data0 = results_data;
	var data = [];
	var ind = 0;
	for (var i = 0; i < results_data.length; i++) {
		if (results_data[i]["start date"] != "") {
			var groupid = results_data[i]["subject"];
			if (results_data[i]["start date"] == "group") { // groups must be at the top in data_timeline
				if (!groupids.includes(groupid)) {
					var item = {
						id: groupid,
						content: results_data[i]["title"],
						className: groupid,
						index: ind,
						visible: true,
						color: results_data[i]["color"]
					}
					data.push(item);
					groupids.push(groupid);
					ind++;
				}
			} else {
				if (!groupids.includes(groupid)) {
					var item = {
						id: groupid,
						content: groupid[0].toUpperCase() + groupid.slice(1,groupid.length),
						className: groupid,
						index: ind,
						visible: true,
						color: "#cccccc"
					}
					data.push(item);
					groupids.push(groupid);
					// add the group info to the timeline data
					var elem = {};
					elem["start date"] = "group";
					elem["end date"] = "";
					elem["title"] = item.content;
					elem["description"] = "";
					elem["country"] = "";
					elem["type"] = "";
					elem["subject"] = item.id;
					elem["wikipedia link"] = "";
					elem["color"] = item.color;
					results_data0.splice(ind, 0, elem); // insert at the top
					ind++;
				}
			}
		}
	}
	results_data = results_data0;
	groups = new vis.DataSet(data);
	
	
	// Checkboxes to hide/show groups
	groups.forEach(function (group) {
		var groupdiv = document.createElement("div");
		var checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "showhide";
		checkbox.value = group.id;
		checkbox.className = "w3-check";
		checkbox.id = "cb " + group.id;
		checkbox.checked = group.visible;
		// add event on change function
		checkbox.addEventListener("change", function () {
			// get items of current group
			var items_filtered = items.get({
				filter: function (item) {
					return item.group == group.id;
				}
			});
			if (checkbox.checked) {
				// show the group and its corresponding items
				groups.update({ id: group.id, visible: true });
				for (var i = 0; i < items_filtered.length; i++) {
					//var itemStyle = items.get(items_filtered[i].id).style;
					//itemStyle = itemStyle.split("visibility:")[0] + "visibility:visible";
					//items.update({ id: items_filtered[i].id, style: itemStyle });
					items.update({ id: items_filtered[i].id, groupVisible: true });
					if (!items_updated.getIds().includes(items_filtered[i].id) & items_filtered[i].countryVisible) {
						items_updated.add(items_filtered[i]);
					}
				}
			} else {
				// hide the group and its corresponding items
				groups.update({ id: group.id, visible: false });
				for (var i = 0; i < items_filtered.length; i++) {
					//var itemStyle = items.get(items_filtered[i].id).style;
					//itemStyle = itemStyle.split("visibility:")[0] + "visibility:hidden";
					//items.update({ id: items_filtered[i].id, style: itemStyle });
					items.update({ id: items_filtered[i].id, groupVisible: false });
					if (items_updated.getIds().includes(items_filtered[i].id)) {
						items_updated.remove(items_filtered[i].id);
					}
				}
			}
			timeline.setItems(items_updated);
			refreshTimeline();
			//timeline.redraw();
			//timeline.fit();
		});
		groupdiv.insertAdjacentElement("afterBegin", checkbox);
		var label = document.createElement("label");
		label.innerHTML = " " + group.content;
		label.for = checkbox.id;
		groupdiv.insertAdjacentElement("beforeEnd", label);
		showhidediv.appendChild(groupdiv);
	});
	
	// Check/uncheck all
	var groupdiv = document.createElement("div");
	var checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.name = "checkall";
	checkbox.value = "checkall";
	checkbox.className = "w3-check";
	checkbox.id = "cb checkall";
	checkbox.checked = false;
	// add event on change function
	checkbox.addEventListener("change", function () {
		const cbs = document.querySelectorAll('input[name="showhide"]');
		if (checkbox.checked) {
			cbs.forEach((cb) => {
				cb.checked = true;
				triggerEvent(cb, "change");
			});
		} else {
			cbs.forEach((cb) => {
				cb.checked = false;
				triggerEvent(cb, "change");
			});
		}
	});
	groupdiv.insertAdjacentElement("afterBegin", checkbox);
	var label = document.createElement("label");
	label.innerHTML = " (tout sélectionner)";
	label.for = checkbox.id;
	groupdiv.insertAdjacentElement("beforeEnd", label);
	showhidediv.appendChild(groupdiv);
	
	function triggerEvent(element, eventName) {
		var event = document.createEvent("HTMLEvents");
		event.initEvent(eventName, false, true);
		element.dispatchEvent(event);
	}
	
	
	// Color picker for groups
	groups.forEach(function (group) {
		var groupdiv = document.createElement("div");
		var colorpicker = document.createElement("input");
		colorpicker.type = "color";
		colorpicker.name = "colorpicker";
		colorpicker.value = group.color;
		colorpicker.className = "classic-color";
		colorpicker.id = "cp " + group.id;
		// set colors
		var color = colorpicker.value;
		var color0 = hex2rgb(color, 0.5);
		root_css.style.setProperty("--color"+String(group.index), color);
		root_css.style.setProperty("--color0"+String(group.index), color0);
		// add event on change function
		colorpicker.addEventListener("change", function () {
			var color = colorpicker.value;
			var color0 = hex2rgb(color, 0.5);
			var index = group.index;
			root_css.style.setProperty("--color"+String(index), color);
			root_css.style.setProperty("--color0"+String(index), color0);
			groups.update({ id: group.id, color: color });
		});
		groupdiv.insertAdjacentElement("afterBegin", colorpicker);
		
		var label = document.createElement("label");
		label.innerHTML = " " + group.content;
		label.for = colorpicker.id;
		groupdiv.insertAdjacentElement("beforeEnd", label);
		colordiv.appendChild(groupdiv);
	});
	
	return results_data;
}



//-----------------------------------------------------------------------------------
// Set the countries
function setTimelineCountries(results_data, countryids) {
	// Clear container
	while (showhideCountriesdiv.hasChildNodes()) {
		showhideCountriesdiv.removeChild(showhideCountriesdiv.lastChild);
	}
	
	// Timeline countries
	var data = [];
	var ind = 0;
	for (var i = 0; i < results_data.length; i++) {
		if (results_data[i]["start date"] != "" && results_data[i]["country"] != "") {
			var date_countries = string2array(results_data[i]["country"]);
			for (var j = 0; j < date_countries.length; j++) {
				var countryid = date_countries[j];
				if (!countryids.includes(countryid)) {
					var item = {
						id: countryid,
						content: countryid,
						className: countryid,
						index: ind,
						visible: true
					}
					data.push(item);
					countryids.push(countryid);
					ind++;
				}
			}
		}
	}
	countries = new vis.DataSet(data);
	
	// Checkboxes to hide/show countries
	countries.forEach(function (country) {
		var groupdiv = document.createElement("div");
		var checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "showhide_countries";
		checkbox.value = country.id;
		checkbox.className = "w3-check";
		checkbox.id = "cb " + country.id;
		checkbox.checked = country.visible;
		// add event on change function
		checkbox.addEventListener("change", function () {
			// get items of current country
			var items_filtered = items.get({
				filter: function (item) {
					return item.country.includes(country.id);
				}
			});
			if (checkbox.checked) {
				// show the country and its corresponding items
				countries.update({ id: country.id, visible: true });
				for (var i = 0; i < items_filtered.length; i++) {
					//var itemStyle = items.get(items_filtered[i].id).style;
					//itemStyle = itemStyle.split("visibility:")[0] + "visibility:visible";
					//items.update({ id: items_filtered[i].id, style: itemStyle });
					items.update({ id: items_filtered[i].id, countryVisible: true });
					if (!items_updated.getIds().includes(items_filtered[i].id) & items_filtered[i].groupVisible) {
						items_updated.add(items_filtered[i]);
					}
				}
			} else {
				// hide the country and its corresponding items
				countries.update({ id: country.id, visible: false });
				for (var i = 0; i < items_filtered.length; i++) {
					//var itemStyle = items.get(items_filtered[i].id).style;
					//itemStyle = itemStyle.split("visibility:")[0] + "visibility:hidden";
					//items.update({ id: items_filtered[i].id, style: itemStyle });
					items.update({ id: items_filtered[i].id, countryVisible: false });
					if (items_updated.getIds().includes(items_filtered[i].id)) {
						items_updated.remove(items_filtered[i].id);
					}
				}
			}
			timeline.setItems(items_updated);
			refreshTimeline();
		});
		groupdiv.insertAdjacentElement("afterBegin", checkbox);
		var label = document.createElement("label");
		label.innerHTML = " " + country.content;
		label.for = checkbox.id;
		groupdiv.insertAdjacentElement("beforeEnd", label);
		showhideCountriesdiv.appendChild(groupdiv);
	});
	
	// Check/uncheck all
	var groupdiv = document.createElement("div");
	var checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.name = "checkall";
	checkbox.value = "checkall";
	checkbox.className = "w3-check";
	checkbox.id = "cb countries checkall";
	checkbox.checked = false;
	// add event on change function
	checkbox.addEventListener("change", function () {
		const cbs = document.querySelectorAll('input[name="showhide_countries"]');
		if (checkbox.checked) {
			cbs.forEach((cb) => {
				cb.checked = true;
				triggerEvent(cb, 'change');
			});
		} else {
			cbs.forEach((cb) => {
				cb.checked = false;
				triggerEvent(cb, 'change');
			});
		}
	});
	groupdiv.insertAdjacentElement("afterBegin", checkbox);
	var label = document.createElement("label");
	label.innerHTML = " (tout sélectionner)";
	label.for = checkbox.id;
	groupdiv.insertAdjacentElement("beforeEnd", label);
	showhideCountriesdiv.appendChild(groupdiv);
}



//-----------------------------------------------------------------------------------
// Create the timeline
function createTimeline(data_timeline) {
	// Clear container
	while (container.hasChildNodes()) {
		container.removeChild(container.lastChild);
	}
	
	// Timeline data
	var data = convertTimelineData(data_timeline);
	items = new vis.DataSet(data);
	items_updated = new vis.DataSet(data);
	//items_updated.add(items.get());
	
	// Update timeline data callback
	function updateData(item, callback) {
		var data_timeline0 = data_timeline;
		for (var i = 0; i < data_timeline0.length; i++) {
			if (data_timeline0[i]["id"] == item.id) {
				data_timeline.splice(i, 1);
			}
		}
		callback(item);
	}
	
	// Configuration for the Timeline
	const timelineHeight = window.innerHeight - navbardiv.offsetHeight - 1;
	defaultOptions = {
		orientation: "top",
		stack: true,
		editable: {remove: true},
		height: timelineHeight,
		maxHeight: 2600,
		//groupHeightMode: "fitItems", // "auto"
		min: "0000-01-01",
		max: "3000-01-01",
		zoomMin: 86400000,
		showMajorLabels: false,
		showCurrentTime: false,
		//verticalScroll: true,
		order: () => {},
		onRemove: updateData,
		loadingScreenTemplate: function () {
			return "<h1>Chargement...</h1>";
		},
		tooltip: {
			followMouse: true,
			overflowMethod: "cap"
		},
		template: (itemData, element, data) => {
			if (data.isCluster) {
				//return `<span class="cluster-header">Cluster</span><div>containg ${data.items.length} items </div>`;
				data.start = data.items[0].start;
				data.end = data.items[0].end;
				data.title = data.items[0].title;
				data.className = data.items[0].className;
				if (data.items[0].type == "point") {
					data.className = data.className + " vis-point";
				}
				return data.items[0].content;
			} else {
				//return `<div>${data.content}</div>`;
				return data.content;
			}
		},
	};
	
	// Create a Timeline
	timeline = new vis.Timeline(container, items, groups, defaultOptions);
	
	// add event listener
	//timeline.on('rangechanged', onRangeChanged);
	
	console.log("Loading timeline complete!");
}

