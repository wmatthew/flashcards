// Create an image for each row in the source database.
//
// node converter.js --help       # to see usage information

"use strict";
require('./StringUtils.js');

//==================================================================================================
// First, parse the inputs
var argv = require('../lib/node_modules/minimist')(process.argv.slice(2));
if (argv.vv) console.dir(argv);

if (argv.h || argv.help) {
	console.log("Usage:");
	console.log(" -h or --help                      # display this message");
	console.log(" -v                                # verbose mode");
	console.log(" --vv                              # debug mode (very verbose)");
	console.log(" --overwrite                       # okay to overwrite files");
	console.log(" --csv=path/to/database.csv        # DB of personal info");
	console.log(" --imgs=path/to/imgDir/            # Input image directory");
	console.log(" --svg=path/to/svgDir/             # SVG output directory");
	console.log(" --png=path/to/pngDir/             # PNG output directory");
	console.log(" --suffix=_suffix                  # Output file name suffix");
	return;
}

// TODO: move logging elsewhere
var verbose = argv.v || argv.vv;
var vverbose = argv.vv;
function warn(msg) { console.log("  [WARN] " + msg); }
function info(msg) { if (verbose) { console.log("  [INFO] " + msg); } }
function debug(msg) { if (vverbose) { console.log("  [DEBUG] " + msg); } }

function parse(arg, defaultValue, context) {
	if (arg) {
		info(context + ": set to " + arg);
		return arg;
	} else {
		info(context + ": default to " + defaultValue);
		return defaultValue;
	}
}

var csvFile      = parse(argv.csv,      "input/data/smiths_example.csv", "csv data file");
var imgDir       = parse(argv.imgs,     "input/images/smiths/", "input image dir");
var svgOut       = parse(argv.svg,      "output/smiths/svg/", "svg output dir");
var pngOut       = parse(argv.png,      "output/smiths/png/", "png output dir");
var overwriteOk  = parse(argv.overwrite, false, "okay to overwrite files");
var outputSuffix = parse(argv.suffix, "", "output file name suffix")

// These inputs are hard-coded, for now
var pngDimensions = [822, 1122];
var inkscapeFullPath = "/Applications/Inkscape.app/Contents/Resources/bin/inkscape";

// File System Utils
var sys = require('sys'); // TODO: sys is deprecated. Use util instead.
var exec = require('child_process').exec;
var fs = require('fs');

//==================================================================================================
// Actual Execution
convert();

//==================================================================================================
// Helper Functions

function convert() {
	var sanityResult = sanityChecks();
	if (!sanityResult) {
		console.log("Failed sanity checks. Quitting early.");
		return;
	}

	var familyArray = processCSV(csvFile);
	if (!familyArray) {
		console.log("Failed to process CSV. Quitting early.");
		return;
	}

	familyArray.forEach(rowToSvg);
}

// Confirm files and directories exist before continuing
// Returns true if all checks pass, false otherwise
function sanityChecks() {
	var result = true;

  result &= fileExists(csvFile);
  result &= fileExists(svgOut);
  result &= fileExists(pngOut);

  var nonExistentFile = "abc.def.xyz";
  result &= !fileExists(nonExistentFile);

  result &= ("abbc".replaceAll('b', 'x') == "axxc");

  if (result) {
  	info("Sanity checks passed");
  } else {
  	warn("Sanity checks failed");
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
  var csvData = fs.readFileSync(csvFile, 'utf8');
	var familyArray = csvData.split(/\r?\n/);

	// Drop N (N=1) header rows. TODO: make this an input arg.
	familyArray.shift();

	// Not general.
	// var expectedHeaderRow = "Name,Nickname,Relationship (to John Smith),Birthday,Image";
	// if (headerRow !== expectedHeaderRow) {
	// 	console.log("Unexpected header row. Quitting early.");
	// 	return false;
	// }

	return familyArray;
}

// Convert one row's data to an SVG
function rowToSvg(rowStr) {
	if (!rowStr) {
		debug("Skipping invalid row: [" + rowStr + "]");
		return;
	}

	// Commas mess up CSV files. Rather than adding parsing logic, we just require data to use '^^^' for a comma.
	var rowArr = rowStr.split(',');

	// Disabled: it's more convenient if we do allow extra unused columns off to the right.
	// TODO: add a flag to enable/disable this check?
	// if (rowArr.length !== 5) {
	// 	console.log("Row of unexpected length ("+rowArr.length+"): " + rowStr);
	// 	return;
	// }

	var _fullName = rowArr[0];
	var _nickName = rowArr[1];
	var _relationship = rowArr[2];
	var _inputImage = rowArr[3];
	var _template = rowArr[4];
	var _detail = rowArr[5].replaceAll('^^^', ',').replaceAll('&&&', '"');
	var _uniqueID = rowArr[6];

	var svgFileName = function() {
		var cleanedName = _fullName;
		cleanedName = cleanedName.replaceAll(' ', '_');
		if (cleanedName.length == 0) {
			cleanedName = "_BLANK_" + _template;
		}
		return _uniqueID + '_' + cleanedName + outputSuffix + ".svg";
	}();

  var templateFile = "input/templates/template_" + _template + outputSuffix + ".svg";
  // templateFile = "input/templates/template_master.svg"; // DEV ONLY - REMOVE
	var rowData = fs.readFileSync(templateFile, 'utf8');

	// Add an extra dir level here because svg output dir is deeper than input:
	//   input/templates/
	//   output/smiths/svg/
	var imageWithPath = 'input/images/default_person.png'; // default
	if (_inputImage.length > 0) {
		imageWithPath = "../" + imgDir + _inputImage;
	}

	var detail_long = "";
	var detail_short = "";

	// If it's 1 or 2 lines, bump it down
	if (_detail.length < 94) {
		detail_short = _detail;
	} else {
    detail_long = _detail;
	}

	rowData = rowData.replaceAll('$NICKNAME$', _nickName);
	rowData = rowData.replaceAll('input/images/default_person.png', imageWithPath);
	rowData = rowData.replaceAll('$FULL_NAME$', _fullName);
	rowData = rowData.replaceAll('$RELATIONSHIP$', _relationship);
	rowData = rowData.replaceAll('$DESC_1$', detail_long);
	rowData = rowData.replaceAll('$DESC_2$', detail_short);
	rowData = rowData.replaceAll('$DESC_3$', "");
	rowData = rowData.replaceAll('$DESC_4$', "");

	var svgPath = svgOut + svgFileName;
	if (fileExists(svgPath) && !overwriteOk) {
  	warn("New SVG would overwrite " + svgPath + "; skipping this row. (use --overwrite if this is okay)");
  	return;
	}

	fs.writeFile(svgPath, rowData, 'utf8');
	info("wrote SVG: " + svgFileName);
	svgToPng(svgFileName);
}

// Convert an SVG to a PNG
// TODO: make less hacky
function svgToPng(svgFileName) {
	var pngFileName = svgFileName.replace('.svg', '.png');
	var pngFullPath = __dirname + '/../' + pngOut + pngFileName;
	var svgFullPath = __dirname + '/../' + svgOut + svgFileName;
	if (fileExists(pngFullPath) && !overwriteOk) {
  	warn("New PNG would overwrite " + pngFullPath + "; skipping this PNG. (use --overwrite if this is okay)");
  	return;
	}
	var cmd = inkscapeFullPath + " --export-png " + pngFullPath +
	          " -w " + pngDimensions[0] +
	          " -h " + pngDimensions[1] +
	          " " + svgFullPath;
	debug("Executing: " + cmd);
	exec(cmd);
  info("wrote PNG: " + pngFileName);
}
