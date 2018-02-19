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
    var qqOAuth = new qq_oauth_1.default({
        redirectUri: `${await config_reader_1.serverUrl()}/oauth/callback/qq`,
        clientId: '101457559',
        clientSecret: '60cebcd616aaca7fcc44925b8ca7dc6e',
    });
    router.get(`/login/${OAuthId}`, function (req, res, next) {
        qqOAuth.getCode(url => res.redirect(url));
    });
    router.get(`/callback/${OAuthId}`, async function (req, res, next) {
        var tokenDate = await qqOAuth.getToken(req.query);
        var openId = await qqOAuth.getOpenId(tokenDate);
        var userInfo = await async function () {
            {
                let preSaved = await User.getByOAuth(OAuthId, openId);
                if (preSaved)
                    return preSaved;
            }
            ;
            {
                return await User.create({
                    openId,
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
            _type: 'set_storage',
            key: "oauth.login" /* Key */,
            value: JSON.stringify(pea_script_1.Assert({
                user_id: userInfo.id,
                token: token,
                age: runtime_1.tokenManager().getTokenAge(token).toISOString(),
            })),
        };
        Object.entries(pea_script_1.Assert({
            token: token,
        })).forEach(([key, value]) => res.cookie(key, value, { maxAge: runtime_1.tokenManager().getTokenAge(token).getTime() - new Date().getTime() }));
        res.redirect(`${await config_reader_1.clintUrl()}/_util?${new URL.URLSearchParams(redirectQuery)}`);
    });
    router.all(`/logout`, async function (req, res, next) {
        var cookieKeys = ['token'];
        cookieKeys.forEach(key => res.cookie(key, null));
        if (req.method === 'HEAD')
            res.end();
        else
            res.redirect(`${await config_reader_1.clintUrl()}/_util?${new URL.URLSearchParams({
                _type: 'remove_storage',
                key: "oauth.login" /* Key */,
            })}`);
    });
}(router);
module.exports = router;
