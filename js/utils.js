// MyTIMELINE - mytimeline.guilhemmariotte.com
//
// JavaScript application to display historical timelines
// Based on Wikipedia data and vis-timeline.js library
//
// Author: Guilhem Mariotte
// Date: Jan 2022
// 
//-----------------------------------------------------------------------------------



// Transform an incomplete date to ISO date format yyyy-mm-dd
function toISODate(date, format) {
	if (typeof format == "undefined") {
		format = "yyyy-mm-dd";
	}
	var date_res = "0001-01-01";
	if (typeof date === "string" || date instanceof String) {
		var date_arr = date.split("-");
		var format_arr = format.split("-");
		date_res = "";
		for (var i = 0; i < format_arr.length; i++) {
			var width = Number(format_arr[i].length);
			var num = "1";
			if (i < date_arr.length) {
				num = date_arr[i];
			}
			num = ("00000000" + num).slice(-width);
			date_res = date_res + num + "-";
		}
		date_res = date_res.slice(0,-1); // remove last "-"
		//date_res = new Date(date_res).toISOString().split("T")[0];
	}
	return date_res;
}

// Get the year number of a date yyyy-mm-dd
function getYear(date) {
	if (typeof date === "string" || date instanceof String) {
		var date_arr = date.split("-");
		return Number(date_arr[0]);
	} else {
		return 0;
	}
}

// Break lines for a long string containing words (blank spaces)
function breaklines(input_string, max_width, linebreak_marker) {
	if (typeof max_width == "undefined") {
		max_width = 30;
	}
	if (typeof linebreak_marker == "undefined") {
		linebreak_marker = "</br>";
	}
	var words = input_string.split(" ");
	var output_string = words[0];
	var current_width = words[0].length;
	for (var i = 1; i < words.length; i++) {
		if (current_width <= max_width) {
			output_string = output_string + " " + words[i];
			current_width = current_width + 1 + words[i].length;
		} else {
			output_string = output_string + linebreak_marker + words[i];
			current_width = words[i].length;
		}
	}
	return output_string;
}

// String trim
function trim(input_string) {
	input_string = input_string.replace(/^\s+/g, ""); // left trim
	input_string = input_string.replace(/\s+$/g, ""); // right trim
	return input_string;
}

// String to array
function string2array(input_string) {
	var elems = input_string.split(",");
	var elems2 = [];
	for (var i = 0; i < elems.length; i++) {
		elems2.push(trim(elems[i]));
	}
	return elems2;
}

// Convert an HEX color to an RGBA color
function hex2rgb(color, alpha) {
	color = color.split("#")[1]
	var aRgbHex = color.match(/.{1,2}/g);
	var aRgb = [parseInt(aRgbHex[0], 16), parseInt(aRgbHex[1], 16), parseInt(aRgbHex[2], 16)];
	var color0 = "rgba(" + [aRgb[0], aRgb[1], aRgb[2], alpha].join(',') +")";
	return color0;
}


