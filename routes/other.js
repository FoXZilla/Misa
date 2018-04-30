"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib/lib");
const Category = require("../model/category");
const Tag = require("../model/tag");
const path_reader_1 = require("../lib/path-reader");
const form_dictator_1 = require("../lib/form-dictator");
const runtime_1 = require("../lib/runtime");
const Fs = require('fs-extra');
const Path = require('path');
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
exports.getFireBlogVersion = async function () {
    var packageJson = require('../package.json');
    return {
        errcode: 0,
        errmsg: 'ok',
        version: packageJson.dependencies['@foxzilla/fireblog'],
    };
};
exports.getBlogInfo = async function () {
    var raw = lib_1.Toml2Json(await Fs.readFile(Path.join(path_reader_1.dataPath(), 'config.toml')));
    return {
        errcode: 0,
        errmsg: 'ok',
        name: raw.name,
        version: raw.version,
        ...new form_dictator_1.default(raw.meta).pick([
            'api_url',
            'front_url',
            'publish_date',
            'description',
            'language',
            'token_age_s',
            'copyright',
            'nav',
            'blogroll',
        ]).data,
        oauth: function (optionMap) {
            var newMap = {};
            for (let id in optionMap) {
                newMap[id] = {};
                Object.assign(newMap[id], optionMap[id]);
                delete newMap[id].client_secret;
            }
            ;
            return newMap;
        }(raw.meta.oauth),
        favicon: runtime_1.pathMap2urlMap(raw.meta.favicon),
        default_avatar: runtime_1.pathMap2urlMap(raw.meta.default_avatar),
        author: {
            ...raw.meta.author,
            ...raw.meta.author.avatar ? { avatar: runtime_1.path2url(raw.meta.author.avatar) } : {},
        },
    };
};
