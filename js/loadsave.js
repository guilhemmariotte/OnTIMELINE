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
// Input file
const input = document.getElementById("load");

input.addEventListener('change', loadTimeline);


// On page load
//document.addEventListener("DOMContentLoaded", updateTimeline);


// Load default
const load_default = document.getElementById("load_default");

load_default.addEventListener('click', loadTimeline);


// Save file
const save = document.getElementById("save");

save.addEventListener('click', saveTimeline);


// Export PDF
const export_pdf = document.getElementById("export_pdf");

export_pdf.addEventListener('click', exportTimeline);


// Drag and drop
function dragenter(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	timelinediv.style.backgroundColor = "#ddddff";
	timelinediv.style.border = "4px dashed black";
}

function dragover(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

function drop(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	timelinediv.style.backgroundColor = null;
	timelinediv.style.border = null;
	// Get file
	var dt = evt.dataTransfer;
	droppedfiles = [...dt.files];
	// Load timeline
	loadTimeline();
}

timelinediv.addEventListener("dragenter", dragenter, false);
timelinediv.addEventListener("dragover", dragover, false);
timelinediv.addEventListener("drop", drop, false);



//-----------------------------------------------------------------------------------
// Download data
function saveTimeline() {
	if (data_timeline.length > 0) {
		groups.forEach(function (group) {
			for (var i = 0; i < data_timeline.length; i++) {
				if (data_timeline[i]["start date"] == "group" & data_timeline[i]["subject"] == group.id) {
					data_timeline[i]["color"] = group.color;
				}
			}
		});
		console.log(data_timeline)
		var filecontents = Papa.unparse(data_timeline, {delimiter:";"});
		var filename = "frise_chrono.csv";
		savefile(filecontents, filename, 'text/plain;charset=utf-8');
	}
}

function savefile(data, filename, type) {
	var file = new Blob([data], {type: type});
	if (window.navigator.msSaveOrOpenBlob) // IE10+
		window.navigator.msSaveOrOpenBlob(file, filename);
	else { // Others
		var a = document.createElement("a"), url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);  
		}, 0); 
	}
}



//-----------------------------------------------------------------------------------
// Export PDF
function exportTimeline() {
	if (data_timeline.length > 0) {
		export_pdf.disabled = "disabled";
		export_pdf.style.cursor = "wait";
		// Get the LaTeX source file and send it to the server via POST
		var loadtext = new Promise(function(resolve, reject) {
			// Generate LaTeX code
			var result = generateLatexCode();
			// Load source file and update it with LaTeX code
			getTextFromUrl(filetex_source, (text) => {
				text = text.replace("MINYEAR", result["minyear"]);
				text = text.replace("MAXYEAR", result["maxyear"]);
				text = text.replace("TEXTCONTENT", result["text"]);
				text = text.replace(/\+/g, "PLUS"); // otherwise, plus sign is replaced by a space through the POST request, because url encoded
				console.log(text)
				resolve(text);
			});
		});
		loadtext.then((text) => {sendTextToUrl("process_pdf.php", text)});
		
		// Get the LaTeX updated file and compile it with latexonline.cc
		setTimeout(() => {
			export_pdf.disabled = "";
			export_pdf.style.cursor = "pointer";
			filetex = filetex.replace("https", "http");
			var url = "https://latexonline.cc/compile?url=" + filetex;
			window.open(url);
		}, 1000);
		//var uri = "https://latexonline.cc/compile?text=" + encodeURIComponent(text);
		//window.open(uri); // not working, too long URL...
	}
}

function exportTimeline0() {
	if (data_timeline.length > 0) {
		var result = generateLatexCode();
		console.log(result)
		var win = window.open();
		win.document.write(result["text"]);
	}
}

// Read text from URL location
function getTextFromUrl(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
	console.log(request)
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var type = request.getResponseHeader("Content-Type");
            if (type.indexOf("text") !== 1) {
				callback(request.responseText);
            }
        }
    }
}

// Send text to URL location (server)
function sendTextToUrl(url, text) {
	var request = new XMLHttpRequest();
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	//request.setRequestHeader("Content-Type", "application/json");
	request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	console.log(request)
	//request.send({data: text}); // not working...
	request.send("data="+text);
	request.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
			console.log("Le PDF va être généré !");
		}
	}
	request.onload = () => {
		console.log(request.responseText);
	}
}

// Generate the LaTeX code for visible items
function generateLatexCode() {
	var result_str = "";
	var minyear = 3000;
	var maxyear = -10000;
	var height_tot = container.offsetHeight;
	// Get visible items info
	var itemtypes = ["range", "point", "background"];
	for (type of itemtypes) {
		var itemsdiv = document.getElementsByClassName("vis-item vis-"+type);
		for (var i = 0; i < itemsdiv.length; i++) {
			var name = itemsdiv[i].getElementsByTagName("a")[0].innerHTML;
			// Get vertical position in px
			var height = 5;
			if (type == "range") {
				height = Number(itemsdiv[i].style.top.replace("px", ""));
			} else if (type == "point") {
				var elem = itemsdiv[i].style.transform.split(",");
				height = Number(elem[1].replace("px)", ""));
			} else if (type == "background") {
				height = 15;
			}
			// Get years and group color
			var color = "#cccccc";
			for (var j = 0; j < data_timeline.length; j++) {
				if (data_timeline[j]["title"] == name) {
					var startyear = toISODate(data_timeline[j]["start date"]);
					startyear = getYear(startyear);
					var groupid = data_timeline[j]["subject"];
					if (startyear < minyear) {
						minyear = startyear;
					}
					if (type != "point") {
						var endyear = toISODate(data_timeline[j]["end date"]);
						endyear = getYear(endyear);
						if (endyear > maxyear) {
							maxyear = endyear;
						}
					}
					groups.forEach(function (group) {
						if (groupid == group.id) {
							color = group.color;
						}
					});
					color = color.replace("#", "");
					var color_str = "\\definecolor{mycolor}{HTML}{" + color + "}";
					var pos = String(-height / height_tot * 120) + "mm";
					var data_str = "";
					if (type == "range") {
						data_str = color_str + "\\chronosperiod[color=mycolor]{" + startyear + "}{" + endyear +  "}{" + name + "}(" + pos + ") ";
					} else if (type == "point") {
						data_str = color_str + "\\chronosevent{" + startyear + "}[draw=mycolor]{" + name + "}(" + pos + ") ";
					} else if (type == "background") {
						pos = String(height / height_tot * 120) + "mm";
						data_str = color_str + "\\chronosbigperiod[color=mycolor]{" + startyear + "}{" + endyear +  "}{" + name + "}(" + pos + ") ";
					}
					result_str = result_str + data_str;
				}
			}
		}
	}
	result = {text: result_str, minyear: minyear-50, maxyear: maxyear+50};
	return result;
}

