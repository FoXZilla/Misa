"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const form_dictator_1 = require("../lib/form-dictator");
const lib_1 = require("../lib/lib");
const Bluebird = require('bluebird');
const Toml2Json = require('toml').parse;
const Json2Toml = require('json2toml');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');
const DATA_PATH = config_reader_1.commentPath();
;
;
async function raw2CommentInfo(obj) {
    return new form_dictator_1.default(obj)
        .pick(['id', 'date', 'posts_id', 'author', 'md_content', 'reply_to'])
        .data;
}
exports.raw2CommentInfo = raw2CommentInfo;
;
async function create(input) {
    var raw = new form_dictator_1.default({
        id: await lib_1.getNextIdFromPath(config_reader_1.commentPath()),
        ip: input.ip,
        date: new Date().toISOString(),
        posts_id: input.posts_id,
        author: input.author,
        md_content: input.md_content,
        reply_to: input.reply_to,
    }).noUndefined().noNull().data; //todo: https://github.com/KenanY/json2toml/issues/29
    await Fs.writeFileAsync(Path.join(DATA_PATH, `${raw.id}.toml`), Json2Toml(raw));
    return raw2CommentInfo(raw);
}
exports.create = create;
;
async function remove(commentId) {
    var raw = Toml2Json(await Fs.readFileAsync(Path.join(DATA_PATH, `${commentId}.toml`)));
    raw.deleted = true;
    await Fs.writeFileAsync(Path.join(DATA_PATH, `${raw.id}.toml`), Json2Toml(raw));
    return raw2CommentInfo(raw);
}
exports.remove = remove;
;
async function getById(commentId) {
    return raw2CommentInfo(Toml2Json(await Fs.readFileAsync(Path.join(DATA_PATH, `${commentId}.toml`))));
}
exports.getById = getById;
async function getAll() {
    return Promise.all(((await Promise.all((await Fs.readdirAsync(DATA_PATH))
        .map(fileName => Path.join(DATA_PATH, fileName))
        .map(filePath => Fs.readFileAsync(filePath))))
        .map(Toml2Json))
        .filter(c => !c.deleted)
        .map(raw2CommentInfo));
}
exports.getAll = getAll;
;
async function isExist(commentId) {
    return lib_1.fileExist(DATA_PATH, `${commentId}.toml`);
}
exports.isExist = isExist;
;
async function canBeReply(commentId) {
    var comment = await getById(commentId);
    if (!comment)
        return false;
    return comment.reply_to ? false : true;
}
exports.canBeReply = canBeReply;
;
