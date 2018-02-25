"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const lib_1 = require("../lib/lib");
const Fs = require('fs-extra');
const Path = require('path');
const DATA_PATH = config_reader_1.categoryPath();
// Getter
async function getRawAll() {
    return (await (Promise.all((await Fs.readdir(DATA_PATH))
        .map(fileName => Path.join(DATA_PATH, fileName))
        .map(filePath => Fs.readFile(filePath)))))
        .map(lib_1.Toml2Json);
}
exports.getRawAll = getRawAll;
exports.getInfoAll = getRawAll;
