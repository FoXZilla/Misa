"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User = require("../../../model/user");
const runtime_1 = require("../../runtime");
const pea_script_1 = require("../../pea-script");
const fb_oauth_1 = require("./fb-oauth");
const firebean_1 = require("../../firebean");
const URL = require('url');
exports.default = {
    name: 'misa-facebook',
    test(config) {
        return ['facebook', 'fb'].includes(config.id);
    },
    async install({ router, config, tokenManager }) {
        var OAuth = new fb_oauth_1.FbOauth(config);
        router.get(`/login/${config.id}`, function (req, res, next) {
            OAuth.getCode(url => res.redirect(url), req.query);
        });
        router.get(`/callback/${config.id}`, async function (req, res, next) {
            var accessToken = await OAuth.getToken(req.query);
            var oauthUserInfo = await OAuth.getUserInfo(accessToken);
            var userInfo = await User.getInfoByOAuth(config.id, oauthUserInfo.id)
                || await User.create({
                    origin: config.id,
                    open_id: oauthUserInfo.id,
                    mail: oauthUserInfo.email,
                    nickname: oauthUserInfo.name,
                    avatar: {
                        50: `https://graph.facebook.com/${oauthUserInfo.id}/picture?width=50`,
                        233: `https://graph.facebook.com/${oauthUserInfo.id}/picture?width=233`,
                    },
                });
            var token = tokenManager.checkIn({
                userId: userInfo.id,
                oAuthId: config.id,
                openId: oauthUserInfo.id,
            });
            res.cookie('token', token, { maxAge: tokenManager.getTokenAge(token).getTime() - new Date().getTime() });
            res.redirect(firebean_1.stringify(Object.assign({
                _type: "set_storage" /* setStorage */,
                key: "fireblog.oauth.login" /* Key */,
                value: JSON.stringify(pea_script_1.Assert({
                    user_id: userInfo.id,
                    token: token,
                    age: tokenManager.getTokenAge(token).toISOString(),
                })),
            }, OAuth.stateMap[req.query.state].firebean), runtime_1.frontUrl()));
            delete OAuth.stateMap[req.query.state];
        });
    },
};
