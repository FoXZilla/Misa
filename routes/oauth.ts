/// <reference path="../fixed.d.ts"/>

import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Get, UserInfo
} from "../types";
import {clintUrl, serverUrl} from "../lib/config-reader";
import * as User from '../model/user';
import QQOAuth from "../lib/qq-oauth";
import {tokenManager} from '../lib/runtime';

const URL = require('url');
const Router = require('express').Router;


const router = Router();


~async function(router){

    const OAuthId ='qq';
    var qqOAuth =new QQOAuth({
        redirectUri :`${await serverUrl()}/oauth/callback/qq`,
        clientId    :'101457559',
        clientSecret:'60cebcd616aaca7fcc44925b8ca7dc6e',
    });

    router.get(`/login/${OAuthId}`,function(req,res,next){
        qqOAuth.getCode(url=>res.redirect(url));
    } as RequestHandler);

    router.get(`/callback/${OAuthId}`,async function(req,res,next){
        var tokenDate =await qqOAuth.getToken(req.query);
        var openId =await qqOAuth.getOpenId(tokenDate);

        var userInfo =await async function():Promise<UserInfo>{
            {
                let preSaved =await User.getByOAuth(OAuthId,openId);
                if(preSaved)return preSaved;
            };{
                return await User.create({
                    openId,
                    origin:OAuthId,
                    ...(await qqOAuth.getUserInfo(tokenDate,openId)),
                });
            };
        }();

        var token =tokenManager().checkIn({
            userId :userInfo.id,
            oAuthId:OAuthId,
            openId :openId,
        });
        var redirectQuery ={
            _type:'set_storage',
            key  :Get.oauth.callback.$oauth_id.Storage.Key,
            value:JSON.stringify(Assert<Get.oauth.callback.$oauth_id.StorageValue>({
                user_id :userInfo.id,
                token   :token,
                age     :tokenManager().getTokenAge(token).toISOString(),
            })),
        };

        Object.entries(Assert<Get.oauth.callback.$oauth_id.CookieValue>({
            token   :token,
        })).forEach(([key,value])=>res.cookie(
            key,value,
            {maxAge:tokenManager().getTokenAge(token).getTime()-new Date().getTime()},
        ));

        res.redirect(`${await clintUrl()}/_util?${new URL.URLSearchParams(redirectQuery)}`)

    } as RequestHandler);

    router.all(`/logout`,async function(req,res,next){
        var cookieKeys:(keyof Get.oauth.callback.$oauth_id.CookieValue)[] =['token'];
        cookieKeys.forEach(key=>res.cookie(key,null));
        if(req.method==='HEAD') res.end();
        else res.redirect(`${await clintUrl()}/_util?${new URL.URLSearchParams({
            _type:'remove_storage',
            key  :Get.oauth.callback.$oauth_id.Storage.Key,
        })}`);
    } as RequestHandler);

}(router);


module.exports =router;