/// <reference path="../fixed.d.ts"/>

import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Get ,Post ,Errcode ,UserInfo ,UserRaw ,
} from "@foxzilla/fireblog";
import {defaultAvatar} from "../lib/config-reader";
import * as User from '../model/user';
import {getBestMatchAvatar} from "../lib/lib";
import {checkToken, tokenManager} from '../lib/runtime';
const Router = require('express').Router;


const router = Router();


router.get(`/info/:user_id(\\d+)`,async function(req,res,next){
    res.json(await Assert<Get.user.info.$user_id.asyncCall>(async function(user_id){
        var info :UserInfo &{mail?:UserRaw['mail']} =await User.getInfoById(user_id);
        if(!await User.isExist(user_id))return{
            errcode :Errcode.UserNotFound,
            errmsg  :`Could not find this user.`,
        };
        if(tokenManager().checkToken(req.cookies.token) ===Errcode.Ok){
            info.mail =(await User.getRawById(user_id)).mail;
        };
        return {
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
    var size =function(query:Get.user.avatar.$user_id.query):number{
        return Number(query.size) ||40;
    }(req.query);
    var userId =req.params['user_id'];

    if(!await User.isExist(userId)){
        res.status(404);
        res.sendFile(await defaultAvatar(size));
        return;
    };

    var options =(await User.getRawById(userId)).avatar;
    if(!options || Object.keys(options).length===0){
        res.status(404);
        res.sendFile(await defaultAvatar(size));
        return;
    };

    res.redirect(options[getBestMatchAvatar(options,size)!]);
} as RequestHandler);



module.exports =router;