import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Get ,UserInfo ,FireBean ,Post ,Errcode ,TokenInfo
} from "@foxzilla/fireblog";
import {frontUrl, apiUrl, oAuthMap} from "../lib/runtime";
import * as User from '../model/user';
import {checkToken, FireBlogVersion, tokenManager} from '../lib/runtime';
import {CloseType} from "@foxzilla/fireblog/types/firebean";
import Strategies from '../lib/oauth';

const URL = require('url');
const Router = require('express').Router;


const router = Router();
const OAuthMap =oAuthMap();

if(OAuthMap) oauth:
for(let [oauthId,config] of Object.entries(OAuthMap)){
    for(let strategy of Strategies){
        if(strategy.test(config)){
            strategy.install({router,config,tokenManager:tokenManager()});
            console.log(`Installed OAuth #${oauthId} by ${strategy.name}`);
            continue oauth;
        };
    };
    console.warn(`Not load OAuth #${oauthId}`);
};







~async function(router){

}(router);


router.all(`/logout`,async function(req,res,next){
    Assert<(keyof Get.oauth.callback.$oauth_id.CookieValue)[]>(['token']).forEach(key=>res.cookie(key,null));
    if(req.method==='HEAD') res.end();
    else res.redirect(`${await frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.RemoveStorageData>({
        _type   :FireBean.Type.removeStorage,
        _close  :CloseType.justClose,
        _version:FireBlogVersion,
         key    :Get.oauth.callback.$oauth_id.Storage.Key,
    }))}`);
} as RequestHandler);

router.get(`/ping`,checkToken,async function(req,res,next){
    var cookie:Get.oauth.callback.$oauth_id.CookieValue=req.cookies;
    res.json(await Assert<Get.oauth.ping.asyncCall>(async function(){
        return {
            errcode:Errcode.Ok,
            errmsg :'ok',
            ...Assert<TokenInfo>({
                user_id :tokenManager().getTokenInfo(cookie.token).userId,
                token   :cookie.token,
                age     :tokenManager().getTokenAge(cookie.token).toISOString(),
            }),
        };
    })());
} as RequestHandler);



module.exports =router;