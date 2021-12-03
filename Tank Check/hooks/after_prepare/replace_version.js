#!/usr/bin/env node

/*jshint esnext: true */
const fs = require('fs');
const path = require('path');
const rootDir = process.argv[2];
let platformPath = path.join(rootDir, 'platforms');
const platform = process.env.CORDOVA_PLATFORMS;
const cliCommand = process.env.CORDOVA_CMDLINE;
const isRelease = (cliCommand.indexOf('--release') > -1); // comment the above line and uncomment this line to turn the hook on only for release

function findVersion(config) {
    console.log("Checking version");
    let data = fs.readFileSync(config, 'utf8');

    let result = data.match(/<widget.+\sversion="([^"]+)"/i);
    if (!result || result.length !== 2) {
        throw new Error("could not find version number in config.xml");
    }
    return result[1];
}

function replaceVersion(file) {

    let ext = path.extname(file).toLowerCase();
    if (ext !== ".js" && ext !== ".html") return;

    fs.readFile(file, 'utf8', (err, data) => {
        if (err) throw err;
        let result;
        if (isRelease) {
            result = data.replace(/<!--VERSION-->/g, version);
        } else {
            result = data.replace(/<!--VERSION-->/g, version + "_DBG");
        }
        if (result !== data) {
            fs.writeFile(file, result, 'utf8', (err, data) => {
                if (err) throw err;
            });
        }
    });

}

switch (platform) {
    case 'android':
        platformPath = path.join(platformPath, platform, "app", "src", "main", "assets", "www");
        break;
    case 'ios':
        platformPath = path.join(platformPath, platform, "www");
        break;
    default:
        console.error('Hook currently supports only Android and iOS');
        return;
}

version = findVersion("config.xml");
replaceVersion(path.join(platformPath, 'index.html'));

