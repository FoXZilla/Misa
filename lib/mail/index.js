"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Reply = require("./templates/reply");
const At = require("./templates/at");
const runtime_1 = require("../runtime");
const User = require("../../model/user");
const Comment = require("../../model/comment");
async function reply(comment) {
    if (!('reply_to' in comment))
        return;
    var beRepliedComment = await Comment.getInfoById(comment.reply_to);
    var beRepliedUser = await User.getRawById(beRepliedComment.author_id);
    if (!('mail' in beRepliedUser))
        return;
    Reply.setData({ comment });
    var data = await Reply.render();
    await runtime_1.sendMail({
        to: beRepliedUser.mail,
        title: data.title,
        content: data.content,
    });
}
exports.reply = reply;
async function at(userId, comment) {
    var user = await User.getRawById(userId);
    if (!('mail' in user))
        return;
    At.setData({ comment, userId });
    var data = await At.render();
    await runtime_1.sendMail({
        to: user.mail,
        title: data.title,
        content: data.content,
    });
}
exports.at = at;
