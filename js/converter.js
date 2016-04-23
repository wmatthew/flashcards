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
	console.log(" --template=path/to/template.svg   # flashcard template");
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

var templateFile = parse(argv.template, "input/templates/template_front.svg", "template file");
var csvFile      = parse(argv.csv,      "input/data/smiths_example.csv", "csv data file");
var imgDir       = parse(argv.imgs,     "input/images/smiths/", "input image dir");
var svgOut       = parse(argv.svg,      "output/smiths/svg/", "svg output dir");
var pngOut       = parse(argv.png,      "output/smiths/png/", "png output dir");
var overwriteOk  = parse(argv.overwrite, false, "okay to overwrite files");
var outputSuffix = parse(argv.suffix, "", "output file name suffix")

// These inputs are hard-coded, for now
var pngDimensions = [750, 1125];
var inkscapeFullPath = "/Applications/Inkscape.app/Contents/Resources/bin/inkscape";

// File System Utils
var sys = require('sys'); // TODO: sys is deprecated. Use util instead.
var exec = require('child_process').exec;
var fs = require('fs');

//==================================================================================================
// Actual Execution
var templateData = fs.readFileSync(templateFile, 'utf8');
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
  result &= fileExists(templateFile);
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
	var headerRow = familyArray.shift();
	var expectedHeaderRow = "Name,Nickname,Relationship (to John Smith),Birthday,Image";
	if (headerRow !== expectedHeaderRow) {
		console.log("Unexpected header row. Quitting early.");
		return false;
	}

	return familyArray;
}

// Convert one row's data to an SVG
function rowToSvg(rowStr) {
	if (!rowStr) {
		debug("Skipping invalid row: [" + rowStr + "]");
		return;
	}
	var rowArr = rowStr.split(',');
	if (rowArr.length !== 5) {
		console.log("Row of unexpected length ("+rowArr.length+"): " + rowStr);
		return;
	}

	var cleanedName = rowArr[0];
	var cleanedName = cleanedName.replaceAll(' ', '_');
	var svgFileName = cleanedName + outputSuffix + ".svg";

	var rowData = templateData;

	var fullName = rowArr[0];
	var nickName = rowArr[1];
	if (nickName == "none") {
		nickName = fullName;
	}

	// Add an extra dir level here because svg output dir is deeper than input:
	//   input/templates/
	//   output/smiths/svg/
	var imageWithPath = "../" + imgDir + rowArr[4];

	rowData = rowData.replaceAll('$FULL_NAME$', fullName);
	rowData = rowData.replaceAll('$NICKNAME$', nickName);
	rowData = rowData.replaceAll('$DESC_1$', "");
	rowData = rowData.replaceAll('$DESC_2$', rowArr[2]);
	rowData = rowData.replaceAll('$DESC_3$', "");
	rowData = rowData.replaceAll('$DESC_4$', "");
	rowData = rowData.replaceAll('$BIRTHDAY$', rowArr[3]);
	rowData = rowData.replaceAll('input/images/default_person.png', imageWithPath);

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
