"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require('bluebird');
const Fs = Bluebird.promisifyAll(require('fs'));
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
    return new Promise(resolve => Fs.access(Path.join(...path), Fs.constants.R_OK, (err) => err ? resolve(false) : resolve(true)));
}
exports.fileExist = fileExist;
async function getNextIdFromPath(...path) {
    var files = await Fs.readdirAsync(Path.join(...path));
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
