"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_reader_1 = require("../lib/path-reader");
const lib_1 = require("../lib/lib");
const Fs = require('fs-extra');
const Path = require('path');
const DATA_PATH = path_reader_1.categoryPath();
// Getter
async function getRawAll() {
    return (await (Promise.all((await Fs.readdir(DATA_PATH))
        .map(fileName => Path.join(DATA_PATH, fileName))
        .map(filePath => Fs.readFile(filePath)))))
        .map(lib_1.Toml2Json);
}
exports.getRawAll = getRawAll;
exports.getInfoAll = getRawAll;
