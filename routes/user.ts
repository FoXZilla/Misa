/// <reference path="../fixed.d.ts"/>

import {RequestHandler,Response,Request} from "express";
import {Assert} from '../lib/pea-script';
import {
    ApiResponse,
    Get, Post, Errcode,
} from "../types";
import {defaultAvatar} from "../lib/config-reader";
import * as User from '../model/user';
import {catchWith, getBestMatchAvatar} from "../lib/lib";

const Router = require('express').Router;



const router = Router();
import {checkToken, tokenManager} from '../lib/runtime';



router.get(`/info/:user_id(\\d+)`,async function(req,res,next){
    res.json(await Assert<Get.user.info.$user_id.asyncCall>(async function(user_id){
        var info =await User.getById(user_id);
        if(info ===null) return{
            errcode :Errcode.UserNotFound,
            errmsg  :`Could not find user #${user_id}.`,
        };
        else return {
            errcode :Errcode.Ok,
            errmsg  :'ok',
            ...info,
        };
    })(req.params.user_id));
} as RequestHandler);
router.post(`/update_info`,checkToken,async function(req,res,next){
    var cookie:Get.oauth.callback.$oauth_id.CookieValue=req.cookies;
    res.json(await Assert<Post.user.update_info.asyncCall>(async function(){
        var updateResult =await User.updateInfo(
            Number(tokenManager().getTokenInfo(cookie.token).userId),
            req.body,
        );
        if(typeof updateResult==='number'){
            return {
                errcode:updateResult,
                errmsg :'field illegal.'
            };
        };
        return {
            errcode:Errcode.Ok,
            errmsg :'ok',
            ...updateResult,
        };
    })());
} as RequestHandler);
router.get(`/avatar/:user_id(\\d+)`,async function(req,res,next){
    var query:Get.user.avatar.$user_id.query =req.query;
    var size =Number(query.size) ||40;
    var info =await User.getRawById(req.params['user_id']);
    if(info ===null) return res.sendFile(await defaultAvatar(size));
    var options =info.avatar;
    if(!options || Object.keys(options).length===0) return res.sendFile(await defaultAvatar(size));
    res.redirect(options[getBestMatchAvatar(options,size)!]);
} as RequestHandler);










module.exports =router;