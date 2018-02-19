"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const Bluebird = require('bluebird');
const Toml2Json = require('toml').parse;
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');
function dataPath() {
    return Path.join(__dirname, '../data');
}
exports.dataPath = dataPath;
;
function commentPath() {
    return Path.join(dataPath(), 'comment/');
}
exports.commentPath = commentPath;
;
function postsPath() {
    return Path.join(dataPath(), 'posts/');
}
exports.postsPath = postsPath;
;
function categoryPath() {
    return Path.join(dataPath(), 'category/');
}
exports.categoryPath = categoryPath;
;
function tagPath() {
    return Path.join(dataPath(), 'tag/');
}
exports.tagPath = tagPath;
;
async function config() {
    return Toml2Json(await Fs.readFileAsync(Path.join(await dataPath(), 'config.toml')));
}
exports.config = config;
;
async function clintUrl() {
    return (await config())['clint_url'];
}
exports.clintUrl = clintUrl;
;
async function serverUrl() {
    return (await config())['server_url'];
}
exports.serverUrl = serverUrl;
;
async function tokenAgeMs() {
    return (await config())['token_age'] * 1000;
}
exports.tokenAgeMs = tokenAgeMs;
;
async function defaultAvatar(size) {
    var options = (await config())['default_avatar'];
    var bestMatch = lib_1.getBestMatchAvatar(options, size);
    return Path.join(dataPath(), options[bestMatch]);
}
exports.defaultAvatar = defaultAvatar;
;
