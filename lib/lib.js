"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require('fs-extra');
const Path = require('path');
function catchWith(method) {
    return function (req, res, next) {
        method().then(data => {
            res.json(data);
        }, error => { throw error; });
    };
}
exports.catchWith = catchWith;
;
function getBestMatchAvatar(optionMap, expectSize = 40) {
    var options = Object.keys(optionMap).map(Number).filter(i => !Number.isNaN(i)).sort((i1, i2) => i1 - i2);
    for (let option of options) {
        if (option >= expectSize)
            return option;
    }
    ;
    return options.pop() || null;
}
exports.getBestMatchAvatar = getBestMatchAvatar;
function fileExist(...path) {
    try {
        Fs.accessSync(Path.join(...path), Fs.constants.R_OK);
        return true;
    }
    catch (e) {
        return false;
    }
    ;
}
exports.fileExist = fileExist;
async function getNextIdFromPath(...path) {
    var files = await Fs.readdir(Path.join(...path));
    var maxId = Math.max(0, ...files.map(filename => Number(filename.replace('.toml', ''))));
    return maxId + 1;
}
exports.getNextIdFromPath = getNextIdFromPath;
function toIndexMap(array, key) {
    var map = {};
    for (let item of array) {
        map[item[key]] = item;
    }
    ;
    return map;
}
exports.toIndexMap = toIndexMap;
;
function Json2Toml(json) {
    return require('tomlify-j0.4').toToml(json);
}
exports.Json2Toml = Json2Toml;
function Toml2Json(stringOrBuffer) {
    return require('toml-j0.4').parse(stringOrBuffer.toString());
}
exports.Toml2Json = Toml2Json;
