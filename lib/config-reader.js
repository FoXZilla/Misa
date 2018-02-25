"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const Fs = require('fs-extra');
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
function articlePath() {
    return Path.join(dataPath(), 'article/');
}
exports.articlePath = articlePath;
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
function attachmentPath() {
    return Path.join(dataPath(), 'attachment/');
}
exports.attachmentPath = attachmentPath;
;
async function config() {
    return lib_1.Toml2Json(await Fs.readFile(Path.join(await dataPath(), 'config.toml')));
}
exports.config = config;
;
async function frontUrl() {
    return (await config())['front_url'];
}
exports.frontUrl = frontUrl;
;
async function apiUrl() {
    return (await config())['api_url'];
}
exports.apiUrl = apiUrl;
;
async function tokenAgeMs() {
    return ((await config())['token_age_s'] || 60 * 60 * 24 * 7) * 1000;
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
async function getOAuthConfig(OAuthId) {
    var options = (await config())['oauth'];
    if (!options)
        return null;
    if (!options[OAuthId])
        return null;
    return options[OAuthId];
}
exports.getOAuthConfig = getOAuthConfig;
;
