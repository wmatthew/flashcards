// Create an image for each row in the source database.
//
// usage: node converter.js
"use strict";

console.log('Starting converter.');

// Configuration
var templateFile = "input/templates/template.svg";
var csvFile = "input/data/example.csv";
var svgOut = "output/svg/";
var pngOut = "output/png/";
var pngDimensions = [600, 600];
var inkscapeFullPath = "/Applications/Inkscape.app/Contents/Resources/bin/inkscape";

// TODO: is this the right way to do this?
var sys = require('sys')
var exec = require('child_process').exec;

var fs = require('fs');
var templateData = fs.readFileSync(templateFile, 'utf8');

processCSV(csvFile);
console.log('done.');

// Returns true if all checks pass, false otherwise
function sanityChecks() {
  // TODO: confirm files and directories exist before continuing

	return true;
}

// Process the input CSV file
function processCSV(csvFile) {
	if (!sanityChecks()) {
		console.log("Failed sanity checks. Quitting early.");
		return;
	}

  var csvData = fs.readFileSync(csvFile, 'utf8');
	var familyArray = csvData.split(/\r?\n/);
	var headerRow = familyArray.shift();
	var expectedHeaderRow = "Name,Nickname,Relationship (to John Doe),Birthday,Image";
	if (headerRow !== expectedHeaderRow) {
		console.log("Unexpected header row. Quitting early.");
		return;
	}

	familyArray.forEach(rowToSvg);
}

// Convert one row's data to an SVG
function rowToSvg(rowStr) {
	if (!rowStr) {
		// console.log("Skipping invalid row: [" + rowStr + "]");
		return;
	}
	var rowArr = rowStr.split(',');
	if (rowArr.length !== 5) {
		console.log("Row of unexpected length ("+rowArr.length+"): " + rowStr);
		return;
	}

	// ok, row is good.
	var cleanedName = rowArr[0].replace(' ', '_')
	var svgFileName = cleanedName + ".svg";

	var rowData = templateData;
	rowData = rowData.replace('$FULL_NAME$', rowArr[0]);
	rowData = rowData.replace('$NICKNAME$', rowArr[1]);
	rowData = rowData.replace('$RELATIONSHIP$', rowArr[2]);
	// TODO: replace image

	// TODO: warn when overwriting existing files
	fs.writeFile(svgOut + svgFileName, rowData, 'utf8');
	console.log("wrote SVG: " + svgFileName);

	svgToPng(svgFileName);
}

// Convert an SVG to a PNG
// TODO: make less hacky
function svgToPng(svgFileName) {
	var pngFileName = svgFileName.replace('.svg', '.png');
	var pngFullPath = __dirname + '/../' + pngOut + pngFileName;
	var svgFullPath = __dirname + '/../' + svgOut + svgFileName;
	var cmd = inkscapeFullPath + " --export-png " + pngFullPath +" -w 600 -h 600 " + svgFullPath
	console.log("Executing: " + cmd);
	exec(cmd);
}
