"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const runtime_1 = require("../lib/runtime");
const User = require("../model/user");
const lib_1 = require("../lib/lib");
const runtime_2 = require("../lib/runtime");
const Router = require('express').Router;
const router = Router();
router.get(`/info/:user_id(\\d+)`, async function (req, res, next) {
    res.json(await pea_script_1.Assert(async function (user_id) {
        var info = await User.getInfoById(user_id);
        if (!await User.isExist(user_id))
            return {
                errcode: 205 /* UserNotFound */,
                errmsg: `Could not find this user.`,
            };
        if (runtime_2.tokenManager().checkToken(req.cookies.token) === 0 /* Ok */) {
            info.mail = (await User.getRawById(user_id)).mail;
        }
        ;
        return {
            errcode: 0 /* Ok */,
            errmsg: 'ok',
            ...info,
        };
    })(req.params.user_id));
});
router.post(`/update_info`, runtime_2.checkToken, async function (req, res, next) {
    var cookie = req.cookies;
    res.json(await pea_script_1.Assert(async function () {
        var updateResult = await User.updateInfo(Number(runtime_2.tokenManager().getTokenInfo(cookie.token).userId), req.body);
        if (typeof updateResult === 'number') {
            return {
                errcode: updateResult,
                errmsg: 'field illegal.'
            };
        }
        ;
        return {
            errcode: 0 /* Ok */,
            errmsg: 'ok',
            ...updateResult,
        };
    })());
});
router.get(`/avatar/:user_id(\\d+)`, async function (req, res, next) {
    var size = function (query) {
        return Number(query.size) || 40;
    }(req.query);
    var userId = req.params['user_id'];
    if (!await User.isExist(userId)) {
        res.status(404);
        res.sendFile(await runtime_1.defaultAvatar(size));
        return;
    }
    ;
    var options = (await User.getRawById(userId)).avatar;
    if (!options || Object.keys(options).length === 0) {
        res.status(404);
        res.sendFile(await runtime_1.defaultAvatar(size));
        return;
    }
    ;
    res.redirect(runtime_1.path2url(options[lib_1.getBestMatchAvatar(options, size)]));
});
module.exports = router;
