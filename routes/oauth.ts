/// <reference path="../fixed.d.ts"/>

import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Get, UserInfo, FireBean, Post, Errcode
} from "@foxzilla/fireblog";
import {frontUrl, apiUrl, getOAuthConfig} from "../lib/config-reader";
import * as User from '../model/user';
import QQOAuth from "../lib/qq-oauth";
import {checkToken, FireBlogVersion, tokenManager} from '../lib/runtime';

const URL = require('url');
const Router = require('express').Router;


const router = Router();


~async function(router){

    const OAuthId ='qq';
    var oauthConfig =await getOAuthConfig(OAuthId);
    if(!oauthConfig){
        console.warn(`Not loading OAuth module #${OAuthId}`);
        return;
    }else{
        console.log(`Loaded OAuth module #${OAuthId}`);
    }
    var qqOAuth =new QQOAuth({
        redirectUri :oauthConfig.redirect_uri ||`${await apiUrl()}/oauth/callback/${OAuthId}`,
        clientId    :oauthConfig.client_id,
        clientSecret:oauthConfig.client_secret,
    });

    router.get(`/login/${OAuthId}`,function(req,res,next){
        qqOAuth.getCode(url=>res.redirect(url));
    } as RequestHandler);

    router.get(`/callback/${OAuthId}`,async function(req,res,next){
        var tokenDate =await qqOAuth.getToken(req.query);
        var openId =await qqOAuth.getOpenId(tokenDate);

        var userInfo =await async function():Promise<UserInfo>{
            {
                let preSaved =await User.getInfoByOAuth(OAuthId,openId);
                if(preSaved)return preSaved;
            };{
                return await User.create({
                    open_id:openId,
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
        var redirectQuery:FireBean.SetStorageData ={
            _type   :FireBean.Type.setStorage,
            _close  :'1',
            _version:FireBlogVersion,
            key     :Get.oauth.callback.$oauth_id.Storage.Key,
            value   :JSON.stringify(Assert<Get.oauth.callback.$oauth_id.StorageValue>({
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

        res.redirect(`${await frontUrl()}/_firebean?${new URL.URLSearchParams(redirectQuery)}`)

    } as RequestHandler);

    router.all(`/logout`,async function(req,res,next){
        Assert<(keyof Get.oauth.callback.$oauth_id.CookieValue)[]>(['token']).forEach(key=>res.cookie(key,null));
        if(req.method==='HEAD') res.end();
        else res.redirect(`${await frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.RemoveStorageData>({
            _type   :FireBean.Type.removeStorage,
            _close  :'1',
            _version:FireBlogVersion,
            key     :Get.oauth.callback.$oauth_id.Storage.Key,
        }))}`);
    } as RequestHandler);

}(router);

router.get(`/ping`,checkToken,async function(req,res,next){
    var cookie:Get.oauth.callback.$oauth_id.CookieValue=req.cookies;
    res.json(await Assert<Get.oauth.ping.asyncCall>(async function(){
        return {
            errcode:Errcode.Ok,
            errmsg :'ok',
            ...Assert<Get.oauth.callback.$oauth_id.StorageValue>({
                user_id :tokenManager().getTokenInfo(cookie.token).userId,
                token   :cookie.token,
                age     :tokenManager().getTokenAge(cookie.token).toISOString(),
            }),
        };
    })());
} as RequestHandler);



module.exports =router;