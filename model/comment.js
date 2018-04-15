"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const form_dictator_1 = require("../lib/form-dictator");
const lib_1 = require("../lib/lib");
const User = require("../model/user");
const Article = require("../model/article");
const runtime_1 = require("../lib/runtime");
const pea_script_1 = require("../lib/pea-script");
const Fs = require('fs-extra');
const Path = require('path');
const URL = require('url');
const DATA_PATH = config_reader_1.commentPath();
;
// Transfer
function raw2CommentRaw(raw) {
    delete raw.ip;
    return raw;
}
;
async function commentRaw2CommentInfo(raw) {
    return new form_dictator_1.default({
        ...new form_dictator_1.default(raw).pick([
            'id', 'date', 'article_id', 'author', 'md_content', 'reply_to'
        ]).data,
        inform_list: raw.inform_list ? await Promise.all(raw.inform_list.map(User.getInfoById)) : undefined,
    }).noUndefined().data;
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
    return await Promise.all((await getRawAll())
        .filter(raw => raw.deleted !== true)
        .map(commentRaw2CommentInfo));
}
exports.getInfoAll = getInfoAll;
async function isExist(commentId) {
    return lib_1.fileExist(DATA_PATH, `${commentId}.toml`);
}
exports.isExist = isExist;
;
async function canBeReply(commentId) {
    var comment = await getRawById(commentId);
    return !comment.reply_to && !comment.deleted;
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
        inform_list: input.inform_list,
    }).noUndefined().noNull().data; //todo: https://github.com/KenanY/json2toml/issues/29
    var info = await commentRaw2CommentInfo(raw2CommentRaw(raw));
    if (info.reply_to && (await getRawById(info.reply_to)).author !== info.author)
        informReply(info).then(console.log, console.error);
    if (info.inform_list && info.inform_list.length !== 0) {
        if (info.reply_to) { // It will not inform user when the user has bean informed on reply.
            let index = info.inform_list.findIndex(i => i.id === info.reply_to);
            if (index !== -1)
                info.inform_list.splice(index, 1);
        }
        informUser(info).then(console.log, console.error);
    }
    ;
    await Fs.writeFile(Path.join(DATA_PATH, `${raw.id}.toml`), lib_1.Json2Toml(raw));
    return info;
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
async function informReply(info) {
    var beRepliedComment = await getRawById(info.reply_to);
    var beRepliedUser = await User.getRawById(beRepliedComment.author);
    if (!beRepliedUser.mail)
        return 'User has not mail address.';
    var commitUser = await User.getRawById(info.author);
    var articleRaw = await Article.getRawById(info.article_id);
    return runtime_1.sendMail({
        to: beRepliedUser.mail,
        title: `[#${articleRaw.id}/#${beRepliedComment.id}] Your comment receive a reply in article "${articleRaw.title}".`,
        md_content: pea_script_1.o_0 `
                ${commitUser.nickname}:
                
                ${info.md_content.split('\n').map(i => '> ' + i).join('\n')}
                
                &nbsp;
                
                ---
                
                - [view this reply](${config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
            _version: runtime_1.FireBlogVersion,
            _type: "go_comment" /* goComment */,
            ...new form_dictator_1.default(info).pick(['id', 'article_id', 'author', 'reply_to']).noUndefined().data,
        }))})
                - [view your comment](${config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
            _version: runtime_1.FireBlogVersion,
            _type: "go_comment" /* goComment */,
            ...new form_dictator_1.default(beRepliedComment).pick(['id', 'article_id', 'author', 'reply_to']).noUndefined().data,
        }))})
                - [view article](${config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
            _version: runtime_1.FireBlogVersion,
            _type: "go_article" /* goArticle */,
            ...new form_dictator_1.default(articleRaw).pick(['id', 'state']).data,
        }))})
                
            `,
    }).then(console.log, console.error);
}
exports.informReply = informReply;
;
async function informUser(info) {
    var articleRaw = await Article.getRawById(info.article_id);
    var commentUser = await User.getRawById(info.author);
    return await Promise.all(info.inform_list.map(async function (userInfo) {
        var userRaw = await User.getRawById(userInfo.id);
        if (!userRaw.mail)
            return `User ${userInfo.nickname} has not mail address.`;
        return runtime_1.sendMail({
            to: userRaw.mail,
            title: `[#${articleRaw.id}/#${info.id}] ${commentUser.nickname} mentioned you in the comments in article "${articleRaw.title}".`,
            md_content: pea_script_1.o_0 `
                ${commentUser.nickname}:
                
                ${info.md_content.split('\n').map(i => '> ' + i).join('\n')}
                
                &nbsp;
                
                ---
                
                - [view this comment](${config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
                _version: runtime_1.FireBlogVersion,
                _type: "go_comment" /* goComment */,
                ...new form_dictator_1.default(info).pick(['id', 'article_id', 'author', 'reply_to']).noUndefined().data,
            }))})
                - [view article](${config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
                _version: runtime_1.FireBlogVersion,
                _type: "go_article" /* goArticle */,
                ...new form_dictator_1.default(articleRaw).pick(['id', 'state']).data,
            }))})
                
            `,
        }).then(console.log, console.error);
    }));
}
exports.informUser = informUser;
;
