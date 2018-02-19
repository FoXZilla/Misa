"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const lib_1 = require("../lib/lib");
const Comment = require("../model/comment");
const User = require("../model/user");
const pea_script_1 = require("../lib/pea-script");
const Bluebird = require('bluebird');
const Toml2Json = require('toml').parse;
const Json2Toml = require('json2toml');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');
const POSTS_PATH = config_reader_1.postsPath();
const COMMENT_PATH = config_reader_1.commentPath();
;
async function getAll() {
    var postsList = (await Promise.all((await Fs.readdirAsync(POSTS_PATH))
        .filter(fileName => /.toml$/.test(fileName))
        .map(fileName => Path.join(POSTS_PATH, fileName))
        .map(filePath => Fs.readFileAsync(filePath)))).map(Toml2Json)
        .map(posts => (delete posts.meta, posts))
        .map(posts => Object.assign(posts, { comment_count: 0 }));
    // count comment
    for (let comment of await Comment.getAll()) {
        if (comment.deleted)
            continue;
        let posts = postsList.find(posts => posts.id === comment.posts_id);
        if (!posts)
            continue;
        posts.comment_count++;
    }
    ;
    return postsList; //todo: generate description if description is empty
}
exports.getAll = getAll;
;
async function getById(postsId) {
    var posts = {
        ...Toml2Json(await Fs.readFileAsync(Path.join(POSTS_PATH, `${postsId}.toml`))),
        md_content: (await Fs.readFileAsync(Path.join(POSTS_PATH, `${postsId}.md`))).toString(),
        get comment_count() { return posts.comment_list.length; },
        comment_list: [],
    };
    for (let comment of (await Comment.getAll()).sort((c1, c2) => new Date(c1.date).getTime() - new Date(c2.date).getTime())) {
        if (comment.deleted)
            continue;
        if (comment.posts_id !== postsId)
            continue;
        posts.comment_list.push({
            id: comment.id,
            date: comment.date,
            md_content: comment.md_content,
            author_id: comment.author,
            author_nickname: (await User.getById(comment.author)).nickname,
            comment_list: pea_script_1.Assert(await Promise.all((await Comment.getAll())
                .filter(c => c.reply_to === comment.id)
                .map(async (c) => ({
                id: c.id,
                date: c.date,
                md_content: c.md_content,
                author_id: c.author,
                author_nickname: (await User.getById(c.author)).nickname,
            }))))
                .sort((c1, c2) => new Date(c1.date).getTime() - new Date(c2.date).getTime()),
        });
    }
    ;
    return posts; //todo: generate description if description is empty
}
exports.getById = getById;
async function isExist(postsId) {
    return lib_1.fileExist(POSTS_PATH, `${postsId}.toml`);
}
exports.isExist = isExist;
;
async function canBeReply(postsId) {
    var posts = await getById(postsId);
    if (!posts)
        return false;
    if (!posts.meta)
        return true;
    return posts.meta.no_comment ? true : false;
}
exports.canBeReply = canBeReply;
;
