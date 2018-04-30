"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User = require("../../../model/user");
const qq_oauth_1 = require("./qq-oauth");
const runtime_1 = require("../../runtime");
const pea_script_1 = require("../../pea-script");
const URL = require('url');
exports.default = {
    name: 'misa-qq',
    test(config) {
        return config.id === 'qq';
    },
    async install({ router, config, tokenManager }) {
        var qqOAuth = new qq_oauth_1.default({
            redirectUri: config.redirect_uri || `${runtime_1.apiUrl()}/oauth/callback/${config.id}`,
            clientId: config.client_id,
            clientSecret: config.client_secret,
        });
        router.get(`/login/${config.id}`, function (req, res, next) {
            qqOAuth.getCode(url => res.redirect(url), req.query);
        });
        router.get(`/callback/${config.id}`, async function (req, res, next) {
            var tokenDate = await qqOAuth.getToken(req.query);
            var openId = await qqOAuth.getOpenId(tokenDate);
            var userInfo = await async function () {
                {
                    let preSaved = await User.getInfoByOAuth(config.id, openId);
                    if (preSaved)
                        return preSaved;
                }
                ;
                {
                    return await User.create({
                        open_id: openId,
                        origin: config.id,
                        ...(await qqOAuth.getUserInfo(tokenDate, openId)),
                    });
                }
                ;
            }();
            var token = tokenManager.checkIn({
                userId: userInfo.id,
                oAuthId: config.id,
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
                    age: tokenManager.getTokenAge(token).toISOString(),
                })),
                ...(req.query.firebean ? JSON.parse(req.query.firebean) : {}),
            };
            Object.entries(pea_script_1.Assert({
                token: token,
            })).forEach(([key, value]) => res.cookie(key, value, { maxAge: tokenManager.getTokenAge(token).getTime() - new Date().getTime() }));
            res.redirect(`${runtime_1.frontUrl()}/_firebean?${new URL.URLSearchParams(redirectQuery)}`);
        });
    },
};
