"use strict";
/// <reference path="../fixed.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const config_reader_1 = require("../lib/config-reader");
const User = require("../model/user");
const lib_1 = require("../lib/lib");
const Router = require('express').Router;
const router = Router();
const runtime_1 = require("../lib/runtime");
router.get(`/info/:user_id(\\d+)`, async function (req, res, next) {
    res.json(await pea_script_1.Assert(async function (user_id) {
        var info = await User.getById(user_id);
        if (info === null)
            return {
                errcode: 205 /* UserNotFound */,
                errmsg: `Could not find user #${user_id}.`,
            };
        else
            return {
                errcode: 0 /* Ok */,
                errmsg: 'ok',
                ...info,
            };
    })(req.params.user_id));
});
router.post(`/update_info`, runtime_1.checkToken, async function (req, res, next) {
    var cookie = req.cookies;
    res.json(await pea_script_1.Assert(async function () {
        var updateResult = await User.updateInfo(Number(runtime_1.tokenManager().getTokenInfo(cookie.token).userId), req.body);
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
    var query = req.query;
    var size = Number(query.size) || 40;
    var info = await User.getRawById(req.params['user_id']);
    if (info === null)
        return res.sendFile(await config_reader_1.defaultAvatar(size));
    var options = info.avatar;
    if (!options || Object.keys(options).length === 0)
        return res.sendFile(await config_reader_1.defaultAvatar(size));
    res.redirect(options[lib_1.getBestMatchAvatar(options, size)]);
});
module.exports = router;
