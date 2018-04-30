"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const runtime_1 = require("../lib/runtime");
const runtime_2 = require("../lib/runtime");
const oauth_1 = require("../lib/oauth");
const URL = require('url');
const Router = require('express').Router;
const router = Router();
const OAuthMap = runtime_1.oAuthMap();
if (OAuthMap)
    oauth: for (let [oauthId, config] of Object.entries(OAuthMap)) {
        for (let strategy of oauth_1.default) {
            if (strategy.test(config)) {
                strategy.install({ router, config, tokenManager: runtime_2.tokenManager() });
                console.log(`Installed OAuth #${oauthId} by ${strategy.name}`);
                continue oauth;
            }
            ;
        }
        ;
        console.warn(`Not load OAuth #${oauthId}`);
    }
;
~async function (router) {
}(router);
router.all(`/logout`, async function (req, res, next) {
    pea_script_1.Assert(['token']).forEach(key => res.cookie(key, null));
    if (req.method === 'HEAD')
        res.end();
    else
        res.redirect(`${await runtime_1.frontUrl()}/_firebean?${new URL.URLSearchParams(pea_script_1.Assert({
            _type: "remove_storage" /* removeStorage */,
            _close: "1" /* justClose */,
            _version: runtime_2.FireBlogVersion,
            key: "fireblog.oauth.login" /* Key */,
        }))}`);
});
router.get(`/ping`, runtime_2.checkToken, async function (req, res, next) {
    var cookie = req.cookies;
    res.json(await pea_script_1.Assert(async function () {
        return {
            errcode: 0 /* Ok */,
            errmsg: 'ok',
            ...pea_script_1.Assert({
                user_id: runtime_2.tokenManager().getTokenInfo(cookie.token).userId,
                token: cookie.token,
                age: runtime_2.tokenManager().getTokenAge(cookie.token).toISOString(),
            }),
        };
    })());
});
module.exports = router;
