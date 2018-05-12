"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const Path = require('path');
const Fs = require('fs-extra');
exports.RootPath = Path.join(__dirname, '../');
var _dataPath = Path.join(exports.RootPath, 'data');
function setDataPath(newValue) {
    _dataPath = newValue.replace(/\/$/, '');
}
exports.setDataPath = setDataPath;
function dataPath() {
    return _dataPath;
}
exports.dataPath = dataPath;
;
function initPath() {
    [
        dataPath,
        staticPath,
        attachmentPath,
        privateStaticPath,
        commentPath,
        articlePath,
        categoryPath,
        tagPath,
        userPath,
    ].forEach(function (path) {
        if (!lib_1.fileExist(path()))
            Fs.mkdirSync(path());
    });
}
exports.initPath = initPath;
function staticPath() {
    return Path.join(dataPath(), 'static/');
}
exports.staticPath = staticPath;
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
    return Path.join(staticPath(), 'attachment/');
}
exports.attachmentPath = attachmentPath;
;
function userPath() {
    return Path.join(dataPath(), 'user/');
}
exports.userPath = userPath;
;
function privateStaticPath() {
    return Path.join(staticPath(), '_misa/');
}
exports.privateStaticPath = privateStaticPath;
function defalutAvatarPath() {
    return {
        40: Path.join(exports.RootPath, 'lib/image/akkarin-40x40.gif'),
        100: Path.join(exports.RootPath, 'lib/image/akkarin-100x100.gif'),
    };
}
exports.defalutAvatarPath = defalutAvatarPath;
function faviconPath() {
    return Path.join(exports.RootPath, 'lib/image/foxzilla-64x64.ico');
}
exports.faviconPath = faviconPath;
