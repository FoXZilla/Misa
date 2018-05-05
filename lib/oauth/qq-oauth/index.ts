import {RequestHandler ,Router} from "express";
import {FireBean ,Get ,OAuthOption ,UserInfo} from "@foxzilla/fireblog";
import TokenManager from "../../token-manager";
import * as User from "../../../model/user";
import {CloseType} from "@foxzilla/fireblog/types/firebean";
import QQOAuth from "./qq-oauth";
import {apiUrl ,FireBlogVersion ,frontUrl} from "../../runtime";
import {Assert} from "../../pea-script";
import {stringify} from "../../firebean";

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

        var OAuth =new QQOAuth(config);

        router.get(`/login/${config.id}`,function(req,res,next){
            OAuth.getCode(url=>res.redirect(url),req.query);
        } as RequestHandler);

        router.get(`/callback/${config.id}`,async function(req,res,next){
            var accessToken =await OAuth.getToken(req.query);

            var openId =await OAuth.getOpenId(accessToken);

            var userInfo =
                await User.getInfoByOAuth(config.id,openId)
                || await User.create({
                    open_id:openId,
                    origin:config.id,
                    ...(await OAuth.getUserInfo(accessToken,openId)),
                });
            ;

            var token =tokenManager.checkIn({
                userId :userInfo.id,
                oAuthId:config.id,
                openId :openId,
            });

            res.cookie(
                'token',
                token,
                {maxAge:tokenManager.getTokenAge(token).getTime()-new Date().getTime()}
            );

            res.redirect(stringify(
                Object.assign(
                    {
                        _type   :FireBean.Type.setStorage,
                        key     :Get.oauth.callback.$oauth_id.Storage.Key,
                        value   :JSON.stringify(Assert<Get.oauth.callback.$oauth_id.StorageValue>({
                            user_id :userInfo.id,
                            token   :token,
                            age     :tokenManager.getTokenAge(token).toISOString(),
                        })),
                    },
                    <never>OAuth.stateMap[req.query.state].firebean,
                ),
                frontUrl()),
            );

        } as RequestHandler);


    },
};
