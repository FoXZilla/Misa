"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib/lib");
const Category = require("../model/category");
const Tag = require("../model/tag");
exports.getCategoryAll = async function () {
    var categories = await Category.getInfoAll();
    return {
        errcode: 0 /* Ok */,
        errmsg: 'all categories.',
        category_length: categories.length,
        category_map: lib_1.toIndexMap(categories, 'alias'),
    };
};
exports.getTagAll = async function () {
    var tags = await Tag.getInfoAll();
    return {
        errcode: 0,
        errmsg: 'ok',
        tag_length: tags.length,
        tag_map: lib_1.toIndexMap(tags, 'alias'),
    };
};
