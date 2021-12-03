#!/usr/bin/env node

/*jshint esnext: true */
var fs = require('fs-extra'),
    path = require('path'),
    rootDir = process.argv[2],
    platformPath = path.join(rootDir, 'platforms'),
    platform = process.env.CORDOVA_PLATFORMS,
    cliCommand = process.env.CORDOVA_CMDLINE,
    debug = false,
    doMinify = false,
    isRelease = true;

isRelease = (cliCommand.indexOf('--release') > -1); // comment the above line and uncomment this line to turn the hook on only for release
doMinify = (cliCommand.indexOf('--minify') > -1); // comment the above line and uncomment this line to turn the hook on only for release

console.log('before_prepare script');

function findVersion(config)
{
    console.log("Checking version");
    var data = fs.readFileSync(config, 'utf8');
        
    var result = data.match(/<widget.+\sversion="([^"]+)"/i);
    if (!result || result.length !== 2) {
        throw new Error("could not find version number in config.xml");
    }
    return result[1];            
}

function findName(config)
{
    console.log("Checking name");
    var data = fs.readFileSync(config, 'utf8');
        
    var result = data.match(/<name>(.+)<\/name>/i);
    if (!result || result.length !== 2) {
        throw new Error("could not find <name> in config.xml");
    }
    return result[1];            
}

var version = findVersion("config.xml");
if (!isRelease) {
    version = version + "_DBG";
}

var name = findName("config.xml");

switch (platform) {
    case 'android':
        var apk;
        // platforms\android\app\build\outputs\apk\debug\app-debug.apk
        if (isRelease) {
            apk = "platforms/android/app/build/outputs/apk/release/app-release.apk";
			if (!fs.existsSync(apk)) {
				apk = "platforms/android/build/outputs/apk/app-release.apk";
			}
        } else {
            apk = "platforms/android/app/build/outputs/apk/debug/app-debug.apk";
			if (!fs.existsSync(apk)) {
				apk = "platforms/android/build/outputs/apk/app-debug.apk";
			}
        }
        var fout = "releases/" + name + "_" + version + ".apk";
        console.log("Copying output file " + apk + " to " + fout);
        fs.copySync(apk, fout);
        break;
    case 'ios':
        var ipa = "platforms/ios/build/device/" + name + ".ipa";
        var fout = "releases/" + name + "_" + version + ".ipa";
        console.log("Copying output file to " + fout);
        fs.copySync(ipa, fout);
        break;
    default:
        console.error('Hook currently supports only Android and iOS');
        return;
}
