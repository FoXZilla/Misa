"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const lib_1 = require("../lib/lib");
const Article = require("../model/article");
const Fs = require('fs-extra');
const Path = require('path');
const DATA_PATH = config_reader_1.tagPath();
// Getter
async function getRawAll() {
    return (await (Promise.all((await Fs.readdir(DATA_PATH))
        .map(fileName => Path.join(DATA_PATH, fileName))
        .map(filePath => Fs.readFile(filePath)))))
        .map(lib_1.Toml2Json);
}
exports.getRawAll = getRawAll;
async function getInfoAll() {
    var tagList = (await getRawAll()).map(i => Object.assign(i, { count: 0 }));
    // count comment
    for (let article of await Article.getInfoAll()) {
        if (!article.tag_list)
            continue;
        article.tag_list.forEach(tagAlias => tagList.find(tag => tag.alias === tagAlias).count++);
    }
    ;
    return tagList;
}
exports.getInfoAll = getInfoAll;
;
