import {RequestHandler ,Router} from "express";
import {FireBean, Get, OAuthOption, UserInfo, UserRaw} from "@foxzilla/fireblog";
import TokenManager from "../../token-manager";
import * as User from "../../../model/user";
import {apiUrl ,FireBlogVersion ,frontUrl} from "../../runtime";
import {Assert} from "../../pea-script";
import {CallbackInQuery ,FbOauth} from "./fb-oauth";
import {stringify} from "../../firebean";

const URL = require('url');


export default {
    name:'misa-facebook',
    test(config:OAuthOption){
        return ['facebook','fb'].includes(config.id);
    },
    async install({
        router,config,tokenManager
    }:{
        router:Router,
        config:OAuthOption,
        tokenManager:TokenManager,
    }){

        var OAuth =new FbOauth(config);

        router.get(`/login/${config.id}`,function(req,res,next){
            OAuth.getCode(url=>res.redirect(url),req.query);
        } as RequestHandler);

        router.get(`/callback/${config.id}`,async function(req,res,next){
            var accessToken =await OAuth.getToken(req.query);

            var oauthUserInfo =await OAuth.getUserInfo(accessToken);

            var userInfo:UserInfo =
                await User.getInfoByOAuth(config.id ,oauthUserInfo.id)
                || await User.create({
                    origin :config.id,
                    open_id:oauthUserInfo.id,
                    mail   :oauthUserInfo.email,
                    nickname:oauthUserInfo.name,
                    avatar :{
                        50 :`https://graph.facebook.com/${oauthUserInfo.id}/picture?width=50`,
                        233 :`https://graph.facebook.com/${oauthUserInfo.id}/picture?width=233`,
                    },
                })
            ;

            var token =tokenManager.checkIn({
                userId :userInfo.id,
                oAuthId:config.id,
                openId :oauthUserInfo.id,
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

            delete OAuth.stateMap[req.query.state];

        } as RequestHandler);

    },
};
