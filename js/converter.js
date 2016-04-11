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
// TODO: confirm files and directories exist before continuing

var fs = require('fs');
var templateData = fs.readFileSync(templateFile, 'utf8');
processCSV(csvFile);

function processCSV(csvFile) {
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

function svgToPng(svgFileName) {
	var pngFileName = svgFileName.replace('.svg', '.png');
  // TODO
}

console.log('done.');
