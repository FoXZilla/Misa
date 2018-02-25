"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const form_dictator_1 = require("../lib/form-dictator");
const lib_1 = require("../lib/lib");
const Fs = require('fs-extra');
const Path = require('path');
const DATA_PATH = config_reader_1.commentPath();
;
// Transfer
function raw2CommentRaw(raw) {
    delete raw.ip;
    return raw;
}
;
function commentRaw2CommentInfo(raw) {
    return new form_dictator_1.default(raw).pick([
        'id', 'date', 'article_id', 'author', 'md_content', 'reply_to',
    ]).data;
}
;
// Getter
async function getRawById(commentId) {
    return raw2CommentRaw(lib_1.Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${commentId}.toml`))));
}
exports.getRawById = getRawById;
;
async function getInfoById(commentId) {
    return commentRaw2CommentInfo(await getRawById(commentId));
}
exports.getInfoById = getInfoById;
async function getRawAll() {
    return (await Promise.all((await Fs.readdir(DATA_PATH))
        .map(function (fileName) { return Path.join(DATA_PATH, fileName); })
        .map(function (filePath) { return Fs.readFile(filePath); })))
        .map(function (fileData) { return lib_1.Toml2Json(fileData); })
        .map(raw2CommentRaw)
        .sort((c1, c2) => new Date(c1.date).getTime() - new Date(c2.date).getTime());
}
exports.getRawAll = getRawAll;
async function getInfoAll() {
    return (await getRawAll())
        .filter(raw => raw.deleted !== true)
        .map(commentRaw2CommentInfo);
}
exports.getInfoAll = getInfoAll;
async function isExist(commentId) {
    return lib_1.fileExist(DATA_PATH, `${commentId}.toml`);
}
exports.isExist = isExist;
;
async function canBeReply(commentId) {
    var comment = await getRawById(commentId);
    return comment.reply_to ? false : true;
}
exports.canBeReply = canBeReply;
;
// Setter
async function create(input) {
    var raw = new form_dictator_1.default({
        id: await lib_1.getNextIdFromPath(config_reader_1.commentPath()),
        ip: input.ip,
        date: new Date().toISOString(),
        article_id: input.article_id,
        author: input.author,
        md_content: input.md_content,
        reply_to: input.reply_to,
    }).noUndefined().noNull().data; //todo: https://github.com/KenanY/json2toml/issues/29
    await Fs.writeFile(Path.join(DATA_PATH, `${raw.id}.toml`), lib_1.Json2Toml(raw));
    return commentRaw2CommentInfo(raw2CommentRaw(raw));
}
exports.create = create;
;
async function remove(commentId) {
    var raw = await getRawById(commentId);
    raw.deleted = true;
    await Fs.writeFile(Path.join(DATA_PATH, `${raw.id}.toml`), lib_1.Json2Toml(raw));
    return commentRaw2CommentInfo(raw2CommentRaw(raw));
}
exports.remove = remove;
;
