/// <reference path="../fixed.d.ts"/>

import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Cookie,
    Get, Post, Errcode,
} from "../types";
import * as Comment from '../model/comment';
import * as Posts from '../model/posts';
import {checkToken, tokenManager} from '../lib/runtime';
import FormDictator from "../lib/form-dictator";

const Router = require('express').Router;


const router = Router();


router.post(`/create`,checkToken,async function(req,res,next){
    var cookie:Cookie =req.cookies;
    var body:Post.comment.create.request =req.body;
    var ip =req.ip;
    res.json(await Assert<Post.comment.create.asyncCall>(async function(){
        var checker =new FormDictator(body)
            .pick(['posts_id','md_content','reply_to'])
        ;
        if(
            (await checker
            .checkIfExist('reply_to',Comment.isExist)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.CommentNotFound,
            errmsg :`Comment is not exist.`,
        };if(
            (await checker
            .checkIfExist('reply_to',Comment.canBeReply)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.AccessDeny,
            errmsg :`Comment can't be reply.`,
        };if(
            (await checker
            .require('posts_id')
            .check('posts_id',Posts.isExist)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.PostsNotFound,
            errmsg :`Posts is not exist.`
        };if(
            (await checker
            .check('posts_id',Comment.canBeReply)
            .waitResult())
            .hasFail()
        )return {
            errcode:Errcode.AccessDeny,
            errmsg :`This Posts disabled comment.`,
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
            (await Comment.getById(commentId)).author
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