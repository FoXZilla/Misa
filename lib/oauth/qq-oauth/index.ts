import {RequestHandler ,Router} from "express";
import {FireBean ,Get ,OAuthOption ,UserInfo} from "@foxzilla/fireblog";
import TokenManager from "../../token-manager";
import * as User from "../../../model/user";
import {CloseType} from "@foxzilla/fireblog/types/firebean";
import QQOAuth from "./qq-oauth";
import {apiUrl ,FireBlogVersion ,frontUrl} from "../../runtime";
import {Assert} from "../../pea-script";

const URL = require('url');


export default {
    name:'misa-qq',
    test(config:OAuthOption){
        return config.id ==='qq';
    },
    async install({
        router,config,tokenManager
    }:{
        router:Router,
        config:OAuthOption,
        tokenManager:TokenManager,
    }){

        var qqOAuth =new QQOAuth({
            redirectUri :config.redirect_uri ||`${apiUrl()}/oauth/callback/${config.id}`,
            clientId    :config.client_id,
            clientSecret:config.client_secret,
        });

        router.get(`/login/${config.id}`,function(req,res,next){
            qqOAuth.getCode(url=>res.redirect(url),req.query);
        } as RequestHandler);

        router.get(`/callback/${config.id}`,async function(req,res,next){
            var tokenDate =await qqOAuth.getToken(req.query);
            var openId =await qqOAuth.getOpenId(tokenDate);

            var userInfo =await async function():Promise<UserInfo>{
                {
                    let preSaved =await User.getInfoByOAuth(config.id,openId);
                    if(preSaved)return preSaved;
                };{
                    return await User.create({
                        open_id:openId,
                        origin:config.id,
                        ...(await qqOAuth.getUserInfo(tokenDate,openId)),
                    });
                };
            }();

            var token =tokenManager.checkIn({
                userId :userInfo.id,
                oAuthId:config.id,
                openId :openId,
            });
            var redirectQuery:FireBean.SetStorageData ={
                _type   :FireBean.Type.setStorage,
                _close  :CloseType.justClose,
                _version:FireBlogVersion,
                key     :Get.oauth.callback.$oauth_id.Storage.Key,
                value   :JSON.stringify(Assert<Get.oauth.callback.$oauth_id.StorageValue>({
                    user_id :userInfo.id,
                    token   :token,
                    age     :tokenManager.getTokenAge(token).toISOString(),
                })),
                ...(req.query.firebean ?JSON.parse(req.query.firebean) :{}),
            };

            Object.entries(Assert<Get.oauth.callback.$oauth_id.CookieValue>({
                token   :token,
            })).forEach(([key,value])=>res.cookie(
                key,value,
                {maxAge:tokenManager.getTokenAge(token).getTime()-new Date().getTime()},
            ));

            res.redirect(`${frontUrl()}/_firebean?${new URL.URLSearchParams(redirectQuery)}`);

        } as RequestHandler);


    },
};
