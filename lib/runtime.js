"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_manager_1 = require("./token-manager");
const config_reader_1 = require("./config-reader");
exports.tokenManager = function () {
    var tokenManager;
    config_reader_1.tokenAgeMs().then(ms => tokenManager = new token_manager_1.default({ tokenAge: ms }));
    return () => tokenManager;
}();
exports.checkToken = async function (req, res, next) {
    var cookie = req.cookies;
    if (!cookie.token) {
        res.json({
            errcode: 401 /* NeedToken */,
            errmsg: 'Token is undefined, did you set withCredentials as true?'
        });
        return;
    }
    ;
    {
        let checkResult = exports.tokenManager().checkToken(cookie.token);
        if (checkResult !== 0 /* Ok */) {
            res.json({
                errcode: checkResult,
                errmsg: 'Cut of check token.'
            });
            return;
        }
        ;
    }
    ;
    next();
};
exports.FireBlogVersion = require('../node_modules/@foxzilla/fireblog/package.json').version;
