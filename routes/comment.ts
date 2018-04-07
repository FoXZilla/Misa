/// <reference path="../fixed.d.ts"/>

import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Cookie,
    Get, Post, Errcode, CommentRaw,
} from "@foxzilla/fireblog";
import * as Comment from '../model/comment';
import * as Article from '../model/article';
import {checkToken, tokenManager} from '../lib/runtime';
import FormDictator from "../lib/form-dictator";
import * as User from '../model/user';

const Router = require('express').Router;


const router = Router();


router.post(`/create`,checkToken,async function(req,res,next){
    var cookie:Cookie =req.cookies;
    var body:Post.comment.create.request =req.body;
    var ip =req.ip;
    res.json(await Assert<Post.comment.create.asyncCall>(async function(){
        var checker =new FormDictator(body)
            .pick(['article_id','md_content','reply_to','inform_list'])
        ;
        if(
            (await checker
            .checkIfExist('reply_to',Comment.isExist)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.CommentNotFound,
            errmsg :`The comment that be replied is not exist.`,
        };if(
            (await checker
            .checkIfExist('reply_to',Comment.canBeReply)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.AccessDeny,
            errmsg :`Comment can't be replied.`,
        };if(
            (await checker
            .require('article_id')
            .check('article_id',Article.isExist)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.ArticleNotFound,
            errmsg :`Article is not exist.`
        };if(
            (await checker
            .check('article_id',Article.canBeReply)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.AccessDeny,
            errmsg :`This Article disabled comment.`,
        };if(
            (await checker
                .checkIfExist(
                    'inform_list',
                    async function(userList:CommentRaw['inform_list']){
                        return (await Promise.all(userList!.map(User.isExist))).every(i=>i)
                    }
                )
                .waitResult())
                .hasFail()
        )return {
            errcode:Errcode.UserNotFound,
            errmsg :`Unknown user in inform_list.`,
        };
        return {
            errcode:Errcode.Ok,
            errmsg :'ok',
            ...(await Comment.create({
                ip,
                author:tokenManager().getTokenInfo(cookie.token!).userId,
                ...checker.data,
            })),
        };
    })());
} as RequestHandler);

router.get(`/remove/:comment_id(\\d+)`,checkToken ,async function(req,res,next){
    var cookie:Cookie =req.cookies;
    res.json(await Assert<Get.comment.remove.asyncCall>(async function(commentId){
        if(
            (await Comment.getInfoById(commentId)).author
            !==
            tokenManager().getTokenInfo(cookie.token!).userId
        )return{
            errcode:Errcode.AccessDeny,
            errmsg :'You are not author of this comment.'
        };
        return {
            errcode:Errcode.Ok,
            errmsg :'removed',
            ...(await Comment.remove(commentId)),
        };
    })(Number(req.params.comment_id)))
} as RequestHandler);


module.exports =router;