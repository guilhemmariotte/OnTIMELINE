// OnTIMELINE - ontimeline.guilhemmariotte.com
//
// JavaScript application to display historical timelines
// Based on Wikipedia data and vis-timeline.js library
//
// Author: Guilhem Mariotte
// Date: Jan 2022
// 
//-----------------------------------------------------------------------------------




//-----------------------------------------------------------------------------------
// Open tabs
function openTab(evt, tabId) {
	// Declare all variables
	var i, tabcontent, tablinks;
	// Get all elements with class="tabcontent" and hide them
	tabcontent = document.getElementsByClassName("tabcontent");
	for (var i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	// Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementsByClassName("tablinks");
	for (var i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	// Show the current tab, and add an "active" class to the button that opened the tab
	document.getElementById(tabId).style.display = "block";
	evt.currentTarget.className += " active";
}



//-----------------------------------------------------------------------------------
// Callback on zoom change (not used)
function onRangeChanged(props) {
	const num_items_max = 20;
	var minyear = props.start.getUTCFullYear();
	var maxyear = props.end.getUTCFullYear();
	var items_filtered = items.get({
		filter: function (item) {
			return getYear(item.start) < maxyear & getYear(item.end) > minyear & item.groupVisible & item.countryVisible & item.type != "background";
		}
	});
	var num_items = 0;
	for (var i = 0; i < items_filtered.length; i++) {
		if (num_items < num_items_max) {
			if (!items_updated.getIds().includes(items_filtered[i].id)) {
				items_updated.add(items_filtered[i]);
			}
		} else {
			if (items_updated.getIds().includes(items_filtered[i].id)) {
				items_updated.remove(items_filtered[i]);
			}
		}
		num_items = num_items + 1;
	}
	timeline.setItems(items_updated);
	refreshTimeline();
	
	//var items_visible = timeline.getVisibleItems();
	//console.log(items_visible)
}


//-----------------------------------------------------------------------------------
// Options
function refreshTimeline() {
	const enableGroupsBtn = document.getElementById("enable_groups");
	if (enableGroupsBtn.checked) {
		timeline.setGroups(null);
		timeline.setGroups(groups);
	} else {
		timeline.setGroups(groups);
		timeline.setGroups(null);
	}
	saveToLocalStorage();
}

function enableGroups(evt) {
	if (evt.currentTarget.checked) {
		timeline.setGroups(groups);
	} else {
		timeline.setGroups(null);
	}
}

function enableClusters(evt) {
	var options = {};
	if (evt.currentTarget.checked) {
		var clusterOpts = {
			cluster: {
				titleTemplate: "{count} éléments regroupés, double-cliquer pour afficher",
				showStipes: false,
				maxItems: 1,
				clusterCriteria: (firstItem, secondItem) => {
					if (Math.abs(getYear(firstItem.start) - getYear(secondItem.start)) < 5) {
						return true;
					} else {
						return false;
					}
				},
			},
		};
		timeline.setOptions(clusterOpts);
		//Object.assign(options, defaultOptions, clusterOpts);
	} else {
		timeline.setOptions({cluster: false});
		//Object.assign(options, defaultOptions);
	}
	refreshTimeline();
	//timeline.setOptions(options);
}

function enableOrdering(evt) { // not used yet
	if (evt.currentTarget.checked) {
		timeline.setOptions({order: (firstItem, secondItem) => {
			// order by rank
			return firstItem.rank - secondItem.rank;
		}});
	} else {
		timeline.setOptions({order: () => {}});
	}
}

function enableEdition(evt) {
	if (evt.currentTarget.checked) {
		timeline.setOptions({editable: {remove: true}, selectable: true});
	} else {
		timeline.setOptions({editable: false, selectable: false});
	}
}

function enablePopup(evt) {
	if (evt.currentTarget.checked) {
		timeline.setOptions({showTooltips: true});
	} else {
		timeline.setOptions({showTooltips: false});
	}
}

function enableStack(evt) {
	if (evt.currentTarget.checked) {
		timeline.setOptions({stack: true});
	} else {
		timeline.setOptions({stack: false});
	}
}

function enableOverflow(evt) {
	if (evt.currentTarget.checked) {
		root_css.style.setProperty("--overflowtype", "visible");
	} else {
		root_css.style.setProperty("--overflowtype", "hidden");
	}
}

function changeFontsize(evt) {
	var fontsize = String(evt.currentTarget.value) + "px";
	root_css.style.setProperty("--itemfontsize", fontsize);
	refreshTimeline();
}

