#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioUrl = function(url,checksfile){
    rest.get(url).on('complete', function(result) {
			$ =  cheerio.load(result); 
			var out = checkFunction($,checksfile);
			printJSON(out);
    });
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(sourceName, checksfile) {
    
    $ = cheerioHtmlFile(sourceName);
	return checkFunction($,checksfile);
};

var checkFunction = function(data,checksfile){
	var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
}

var printJSON = function(checkJson)
{
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json')
        .option('-f, --file <html_file>', 'Path to index.html')
        .option('-u, --url <url>', 'url to index.html' )
        .parse(process.argv);
		
    if(program.file && program.url)
        console.log("Cannot parse two source");
    else
    {
        if(program.file)
		{
            var checkJson = checkHtmlFile(program.file, program.checks);
			printJSON(checkJson);
		}
        if(program.url)
            var checkJson = cheerioUrl(program.url,program.checks);
    }	
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
