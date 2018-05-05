"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User = require("../../../model/user");
const qq_oauth_1 = require("./qq-oauth");
const runtime_1 = require("../../runtime");
const pea_script_1 = require("../../pea-script");
const firebean_1 = require("../../firebean");
const URL = require('url');
exports.default = {
    name: 'misa-qq',
    test(config) {
        return config.id === 'qq';
    },
    async install({ router, config, tokenManager }) {
        var OAuth = new qq_oauth_1.default(config);
        router.get(`/login/${config.id}`, function (req, res, next) {
            OAuth.getCode(url => res.redirect(url), req.query);
        });
        router.get(`/callback/${config.id}`, async function (req, res, next) {
            var accessToken = await OAuth.getToken(req.query);
            var openId = await OAuth.getOpenId(accessToken);
            var userInfo = await User.getInfoByOAuth(config.id, openId)
                || await User.create({
                    open_id: openId,
                    origin: config.id,
                    ...(await OAuth.getUserInfo(accessToken, openId)),
                });
            ;
            var token = tokenManager.checkIn({
                userId: userInfo.id,
                oAuthId: config.id,
                openId: openId,
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
        });
    },
};
