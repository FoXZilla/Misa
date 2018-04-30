"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../../pea-script");
const Comment = require("../../../model/comment");
const User = require("../../../model/user");
const Article = require("../../../model/article");
const firebean_1 = require("../../firebean");
const runtime_1 = require("../../runtime");
var Data;
function getData() {
    return Data;
}
exports.getData = getData;
function setData(newDate) {
    Data = newDate;
}
exports.setData = setData;
;
async function render() {
    var originComment = await Comment.getInfoById(Data.comment.reply_to);
    var user = await User.getInfoById(Data.comment.author_id);
    var article = await Article.getInfoById(Data.comment.article_id);
    return {
        title: `[${article.id}/${originComment.id}] You comment#${originComment.id} receive a reply`,
        content: runtime_1.md(pea_script_1.noLeftSpace `
            
            ## ${user.nickname}:
            
            ${Data.comment.md_content}
            
            ---
            
            - [View this reply](${firebean_1.stringify({
            _type: "go_comment" /* goComment */,
            id: Data.comment.id,
            author_id: Data.comment.author_id,
            article_id: article.id,
            reply_to: Data.comment.reply_to,
        }, runtime_1.frontUrl())})
            - [View this article](${firebean_1.stringify({
            _type: "go_article" /* goArticle */,
            id: Data.comment.article_id,
            state: article.state,
        }, runtime_1.frontUrl())})
        `),
    };
}
exports.render = render;
;
