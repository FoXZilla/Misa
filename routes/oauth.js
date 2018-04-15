"use strict";
/// <reference path="../fixed.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const config_reader_1 = require("../lib/config-reader");
const User = require("../model/user");
const qq_oauth_1 = require("../lib/qq-oauth");
const runtime_1 = require("../lib/runtime");
const URL = require('url');
const Router = require('express').Router;
const router = Router();
~async function (router) {
    const OAuthId = 'qq';
    var oauthConfig = await config_reader_1.getOAuthConfig(OAuthId);
    if (!oauthConfig) {
        console.warn(`Not loading OAuth module #${OAuthId}`);
        return;
    }
    else {
        console.log(`Loaded OAuth module #${OAuthId}`);
    }
    var qqOAuth = new qq_oauth_1.default({
        redirectUri: oauthConfig.redirect_uri || `${await config_reader_1.apiUrl()}/oauth/callback/${OAuthId}`,
        clientId: oauthConfig.client_id,
        clientSecret: oauthConfig.client_secret,
    });
    router.get(`/login/${OAuthId}`, function (req, res, next) {
        qqOAuth.getCode(url => res.redirect(url), req.query);
    });
    router.get(`/callback/${OAuthId}`, async function (req, res, next) {
        var tokenDate = await qqOAuth.getToken(req.query);
        var openId = await qqOAuth.getOpenId(tokenDate);
        var userInfo = await async function () {
            {
                let preSaved = await User.getInfoByOAuth(OAuthId, openId);
                if (preSaved)
                    return preSaved;
            }
            ;
            {
                return await User.create({
                    open_id: openId,
                    origin: OAuthId,
                    ...(await qqOAuth.getUserInfo(tokenDate, openId)),
                });
            }
            ;
        }();
        var token = runtime_1.tokenManager().checkIn({
            userId: userInfo.id,
            oAuthId: OAuthId,
            openId: openId,
        });
        var redirectQuery = {
            _type: "set_storage" /* setStorage */,
            _close: "1" /* justClose */,
            _version: runtime_1.FireBlogVersion,
            key: "fireblog.oauth.login" /* Key */,
            value: JSON.stringify(pea_script_1.Assert({
                user_id: userInfo.id,
                token: token,
                age: runtime_1.tokenManager().getTokenAge(token).toISOString(),
            })),
            ...(req.query.firebean ? JSON.parse(req.query.firebean) : {}),
        };
        Object.entries(pea_script_1.Assert({
            token: token,
        })).forEach(([key, value]) => res.cookie(key, value, { maxAge: runtime_1.tokenManager().getTokenAge(token).getTime() - new Date().getTime() }));
        res.redirect(`${await config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(redirectQuery)}`);
    });
    router.all(`/logout`, async function (req, res, next) {
        pea_script_1.Assert(['token']).forEach(key => res.cookie(key, null));
        if (req.method === 'HEAD')
            res.end();
        else
            res.redirect(`${await config_reader_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
                _type: "remove_storage" /* removeStorage */,
                _close: "1" /* justClose */,
                _version: runtime_1.FireBlogVersion,
                key: "fireblog.oauth.login" /* Key */,
            }))}`);
    });
}(router);
router.get(`/ping`, runtime_1.checkToken, async function (req, res, next) {
    var cookie = req.cookies;
    res.json(await pea_script_1.Assert(async function () {
        return {
            errcode: 0 /* Ok */,
            errmsg: 'ok',
            ...pea_script_1.Assert({
                user_id: runtime_1.tokenManager().getTokenInfo(cookie.token).userId,
                token: cookie.token,
                age: runtime_1.tokenManager().getTokenAge(cookie.token).toISOString(),
            }),
        };
    })());
});
module.exports = router;
