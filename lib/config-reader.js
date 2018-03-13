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
exports.config = lib_1.Toml2Json(Fs.readFileSync(Path.join(dataPath(), 'config.toml')));
function frontUrl() {
    return exports.config['front_url'];
}
exports.frontUrl = frontUrl;
;
async function apiUrl() {
    return exports.config['api_url'];
}
exports.apiUrl = apiUrl;
;
async function tokenAgeMs() {
    return (exports.config['token_age_s'] || 60 * 60 * 24 * 7) * 1000;
}
exports.tokenAgeMs = tokenAgeMs;
;
async function defaultAvatar(size) {
    var options = exports.config['default_avatar'];
    var bestMatch = lib_1.getBestMatchAvatar(options, size);
    return Path.join(dataPath(), options[bestMatch]);
}
exports.defaultAvatar = defaultAvatar;
;
async function getOAuthConfig(OAuthId) {
    var options = exports.config['oauth'];
    if (!options)
        return null;
    if (!options[OAuthId])
        return null;
    return options[OAuthId];
}
exports.getOAuthConfig = getOAuthConfig;
;
