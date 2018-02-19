"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib/lib");
const config_reader_1 = require("../lib/config-reader");
const Bluebird = require('bluebird');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');
const Toml2Json = require('toml').parse;
exports.getCategoryAll = async function () {
    var files = await Fs.readdirAsync(await config_reader_1.categoryPath());
    var categories = [];
    for (let fileName of files) {
        let filePath = Path.join(await config_reader_1.categoryPath(), fileName);
        let fileContent = await Fs.readFileAsync(filePath);
        categories.push(Toml2Json(fileContent));
    }
    ;
    return {
        errcode: 0 /* Ok */,
        errmsg: 'all categories.',
        category_length: categories.length,
        category_map: lib_1.toIndexMap(categories, 'alias'),
    };
};
exports.getTagAll = async function () {
    var files = await Fs.readdirAsync(await config_reader_1.tagPath());
    var tags = [];
    for (let fileName of files) {
        let filePath = Path.join(await config_reader_1.tagPath(), fileName);
        let fileContent = await Fs.readFileAsync(filePath);
        tags.push(Toml2Json(fileContent));
    }
    ;
    return {
        errcode: 0,
        errmsg: 'ok',
        tag_length: tags.length,
        tag_map: lib_1.toIndexMap(tags, 'alias'),
    };
};
