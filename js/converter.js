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

var sys = require('sys'); // TODO: sys is deprecated. Use util instead.
var exec = require('child_process').exec;

var fs = require('fs');
var templateData = fs.readFileSync(templateFile, 'utf8');

processCSV(csvFile);
console.log('done.');

// Confirm files and directories exist before continuing
// Returns true if all checks pass, false otherwise
function sanityChecks() {
	var result = true;

  result &= fileExists(csvFile);
  result &= fileExists(templateFile);
  result &= fileExists(svgOut);
  result &= fileExists(pngOut);

  var nonExistentFile = "abc.def.xyz";
  result &= !fileExists(nonExistentFile);

  if (result) {
  	console.log("Sanity checks passed");
  } else {
  	console.log("Sanity checks failed");
  }

	return result;
}

// True if file/dir exists, false otherwise.
function fileExists(relativePath) {
	try {
		fs.statSync(relativePath);
		return true;
	} catch (e) {
		return false;
	}
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

	var cleanedName = rowArr[0];
	var cleanedName = cleanedName.replace(' ', '_');
	var cleanedName = cleanedName.replace(' ', '_'); // TODO: replaceAll
	var svgFileName = cleanedName + ".svg";

	var rowData = templateData;

	var fullName = rowArr[0];
	var nickName = rowArr[1];
	if (nickName == "none") {
		nickName = fullName;
	}

	rowData = rowData.replace('$FULL_NAME$', fullName);
	rowData = rowData.replace('$NICKNAME$', nickName);
	rowData = rowData.replace('$DESC_1$', "");
	rowData = rowData.replace('$DESC_2$', rowArr[2]);
	rowData = rowData.replace('$DESC_3$', "");
	rowData = rowData.replace('$DESC_4$', "");
	rowData = rowData.replace('$BIRTHDAY$', rowArr[3]);
	rowData = rowData.replace('default_person.png', rowArr[4]); // TODO: replaceAll
	rowData = rowData.replace('default_person.png', rowArr[4]);

	var svgPath = svgOut + svgFileName;
	if (fileExists(svgPath)) {
  	console.log("  warning: overwriting SVG: " + svgPath);
	}
	fs.writeFile(svgPath, rowData, 'utf8');
	console.log("wrote SVG: " + svgFileName);

	svgToPng(svgFileName);
}

// Convert an SVG to a PNG
// TODO: make less hacky
function svgToPng(svgFileName) {
	var pngFileName = svgFileName.replace('.svg', '.png');
	var pngFullPath = __dirname + '/../' + pngOut + pngFileName;
	var svgFullPath = __dirname + '/../' + svgOut + svgFileName;
	if (fileExists(pngFullPath)) {
  	console.log("  warning: overwriting PNG: " + pngFullPath);
	}
	var cmd = inkscapeFullPath + " --export-png " + pngFullPath +" -w 750 -h 1125 " + svgFullPath
	console.log("Executing: " + cmd);
	exec(cmd);
}
