"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const Comment = require("../model/comment");
const Article = require("../model/article");
const runtime_1 = require("../lib/runtime");
const form_dictator_1 = require("../lib/form-dictator");
const Router = require('express').Router;
const router = Router();
router.post(`/create`, runtime_1.checkToken, async function (req, res, next) {
    var cookie = req.cookies;
    var body = req.body;
    var ip = req.ip;
    res.json(await pea_script_1.Assert(async function () {
        var checker = new form_dictator_1.default(body)
            .pick(['article_id', 'md_content', 'reply_to']);
        if ((await checker
            .checkIfExist('reply_to', Comment.isExist)
            .waitResult())
            .hasFail())
            return {
                errcode: 204 /* CommentNotFound */,
                errmsg: `The comment that be replied is not exist.`,
            };
        if ((await checker
            .checkIfExist('reply_to', Comment.canBeReply)
            .waitResult())
            .hasFail())
            return {
                errcode: 403 /* AccessDeny */,
                errmsg: `Comment can't be replied.`,
            };
        if ((await checker
            .require('article_id')
            .check('article_id', Article.isExist)
            .waitResult())
            .hasFail())
            return {
                errcode: 201 /* ArticleNotFound */,
                errmsg: `Article is not exist.`
            };
        if ((await checker
            .check('article_id', Article.canBeReply)
            .waitResult())
            .hasFail())
            return {
                errcode: 403 /* AccessDeny */,
                errmsg: `This Article disabled comment.`,
            };
        return {
            errcode: 0 /* Ok */,
            errmsg: 'ok',
            ...(await Comment.create({
                ip,
                author_id: runtime_1.tokenManager().getTokenInfo(cookie.token).userId,
                ...checker.data,
            })),
        };
    })());
});
router.get(`/remove/:comment_id(\\d+)`, runtime_1.checkToken, async function (req, res, next) {
    var cookie = req.cookies;
    res.json(await pea_script_1.Assert(async function (commentId) {
        if ((await Comment.getInfoById(commentId)).author_id
            !==
                runtime_1.tokenManager().getTokenInfo(cookie.token).userId)
            return {
                errcode: 403 /* AccessDeny */,
                errmsg: 'You are not author of this comment.'
            };
        return {
            errcode: 0 /* Ok */,
            errmsg: 'removed',
            ...(await Comment.remove(commentId)),
        };
    })(Number(req.params.comment_id)));
});
module.exports = router;
