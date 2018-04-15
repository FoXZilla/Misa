"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const form_dictator_1 = require("../lib/form-dictator");
const lib_1 = require("../lib/lib");
const Comment = require("../model/comment");
const User = require("../model/user");
const Fs = require('fs-extra');
const Path = require('path');
const DATA_PATH = config_reader_1.articlePath();
// Transfer
function raw2Info(raw) {
    return {
        ...new form_dictator_1.default(raw).pick([
            'id', 'title', 'description', 'cover', 'state', 'tag_list', 'category_list', 'update_time', 'create_time', 'view_count'
        ]).data,
        require_password: Boolean(raw.meta && raw.meta.password),
        no_comment: Boolean(raw.meta && raw.meta.no_comment),
        comment_count: 0,
    };
}
async function raw2ArticleRaw(raw) {
    return {
        ...raw,
        md_content: (await Fs.readFile(Path.join(DATA_PATH, `${raw.id}.md`))).toString(),
    };
}
;
async function articleRaw2ArticleInfo(raw) {
    return {
        ...new form_dictator_1.default(raw).pick([
            'id', 'title', 'description', 'cover', 'state', 'tag_list', 'category_list', 'update_time', 'create_time', 'view_count', 'md_content'
        ]).data,
        comment_count: 0,
        comment_list: [],
        require_password: Boolean(raw.meta && raw.meta.password),
        no_comment: Boolean(raw.meta && raw.meta.no_comment),
    };
}
;
// Getter
async function getRawById(articleId) {
    return raw2ArticleRaw(lib_1.Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${articleId}.toml`))));
}
exports.getRawById = getRawById;
async function getInfoById(articleId) {
    var info = await articleRaw2ArticleInfo(await getRawById(articleId));
    var transferData = function (info) {
        return {
            id: info.id,
            date: info.date,
            md_content: info.md_content,
            author_id: info.author,
        };
    };
    var allCommentInfo = await Comment.getInfoAll();
    for (let commentInfo of allCommentInfo) {
        if (commentInfo.article_id !== articleId)
            continue;
        if (commentInfo.reply_to)
            continue;
        info.comment_list.push({
            ...transferData(commentInfo),
            author_nickname: (await User.getInfoById(commentInfo.author)).nickname,
            comment_list: await Promise.all(allCommentInfo
                .filter(c => c.reply_to && c.reply_to === commentInfo.id)
                .map(async (c) => ({
                ...transferData(c),
                author_nickname: (await User.getInfoById(c.author)).nickname,
            }))),
        });
    }
    ;
    info.comment_list.sort(function (comment1, comment2) {
        var lastUpdate1 = Math.max(new Date(comment1.date).getTime(), ...comment1.comment_list.map(c => new Date(c.date).getTime()));
        var lastUpdate2 = Math.max(new Date(comment2.date).getTime(), ...comment2.comment_list.map(c => new Date(c.date).getTime()));
        return lastUpdate2 - lastUpdate1;
    });
    info.comment_count = info.comment_list.length;
    return info;
}
exports.getInfoById = getInfoById;
async function getRawAll() {
    return (await (Promise.all((await Fs.readdir(DATA_PATH))
        .filter(fileName => /.toml$/.test(fileName))
        .map(fileName => Path.join(DATA_PATH, fileName))
        .map(filePath => Fs.readFile(filePath)))))
        .map(lib_1.Toml2Json);
}
exports.getRawAll = getRawAll;
async function getInfoAll() {
    var articleList = (await getRawAll())
        .filter(article => !(article.meta && article.meta.hide_in_list))
        .map(raw2Info)
        .filter(article => article.state === 0 /* Publish */);
    // count comment
    for (let comment of await Comment.getInfoAll()) {
        let article = articleList.find(article => article.id === comment.article_id);
        if (!article)
            continue;
        article.comment_count++;
    }
    ;
    //todo: generate description if description is empty
    return articleList;
}
exports.getInfoAll = getInfoAll;
;
async function isExist(articleId) {
    return lib_1.fileExist(DATA_PATH, `${articleId}.toml`);
}
exports.isExist = isExist;
;
async function canBeReply(articleId) {
    var article = await getRawById(articleId);
    if (!article)
        return false;
    if (!article.meta)
        return true;
    return !article.meta.no_comment;
}
exports.canBeReply = canBeReply;
;
async function accessTo(articleId, { password } = {}) {
    if (!await lib_1.fileExist(DATA_PATH, `${articleId}.toml`))
        return {
            errcode: 201 /* ArticleNotFound */,
            errmsg: 'Could not found this article.',
        };
    var raw = lib_1.Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${articleId}.toml`)));
    if (raw.state !== 0 /* Publish */)
        return {
            errcode: 403 /* AccessDeny */,
            errmsg: 'unaddressable article.',
        };
    if (raw.meta && raw.meta.password && raw.meta.password !== password)
        return new form_dictator_1.default({
            errcode: 404 /* IncorrectPassword */,
            errmsg: 'incorrect password.',
            password_hint: raw.meta.password_hint,
        }).noNull().noUndefined().data;
    return {
        errcode: 0 /* Ok */,
        errmsg: 'ok',
    };
}
exports.accessTo = accessTo;
async function growViewCount(articleId) {
    var raw = lib_1.Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${articleId}.toml`)));
    raw.view_count++;
    await Fs.writeFile(Path.join(DATA_PATH, `${articleId}.toml`), lib_1.Json2Toml(raw));
    return raw.view_count;
}
exports.growViewCount = growViewCount;
