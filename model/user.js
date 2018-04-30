"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_reader_1 = require("../lib/path-reader");
const runtime_1 = require("../lib/runtime");
const form_dictator_1 = require("../lib/form-dictator");
const lib_1 = require("../lib/lib");
const Fs = require('fs-extra');
const Path = require('path');
const DATA_PATH = path_reader_1.userPath();
// Transfer
function userRaw2UserInfo(raw) {
    return {
        id: raw.id,
        nickname: raw.nickname,
        avatar: `${runtime_1.apiUrl()}/user/avatar/${raw['id']}`,
        create_date: raw['create_date'],
    };
}
exports.userRaw2UserInfo = userRaw2UserInfo;
;
// Getter
async function getRawById(id) {
    return lib_1.Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${id}.toml`)));
}
exports.getRawById = getRawById;
;
async function getInfoById(id) {
    return userRaw2UserInfo(await getRawById(id));
}
exports.getInfoById = getInfoById;
;
async function getRawByOAuth(OAuthId, openId) {
    return (await Promise.all((await Fs.readdir(DATA_PATH))
        .map(function (fileName) { return Path.join(DATA_PATH, fileName); })
        .map(function (filePath) { return Fs.readFile(filePath); })))
        .map(lib_1.Toml2Json)
        .find(user => user.origin === OAuthId && user.open_id === openId);
}
exports.getRawByOAuth = getRawByOAuth;
;
async function getInfoByOAuth(OAuthId, openId) {
    var raw = await getRawByOAuth(OAuthId, openId);
    if (!raw)
        return;
    return userRaw2UserInfo(raw);
}
exports.getInfoByOAuth = getInfoByOAuth;
;
async function isExist(id) {
    return lib_1.fileExist(Path.join(DATA_PATH, `${id}.toml`));
}
exports.isExist = isExist;
;
// Setter
async function create(input) {
    var raw = {
        ...new form_dictator_1.default(input).pick(['origin', 'open_id', 'nickname', 'mail', 'avatar']).data,
        id: (await Fs.readdir(DATA_PATH)).length + 1,
        create_date: new Date().toISOString(),
    };
    await Fs.writeFile(Path.join(DATA_PATH, `${raw.id}.toml`), lib_1.Json2Toml(raw));
    return userRaw2UserInfo(raw);
}
exports.create = create;
;
async function updateInfo(userId, newInfo) {
    var checker = new form_dictator_1.default(newInfo)
        .pick(['nickname', 'mail'])
        .noNull()
        .noUndefined()
        .changeIfExist('mail', String)
        .checkIfExist('mail', v => /^.+@.+$/.test(v))
        .changeIfExist('nickname', String)
        .checkIfExist('nickname', v => v.length !== 0);
    if (checker.hasFail()) {
        switch (checker.witchFail()) {
            case 'nickname':
                return 301 /* Nickname */;
            case 'mail':
                return 302 /* Mail */;
        }
    }
    ;
    var originInfo = await getRawById(userId);
    await Fs.writeFile(Path.join(DATA_PATH, `${userId}.toml`), lib_1.Json2Toml(Object.assign({}, originInfo, checker.data)));
    return form_dictator_1.default.diff(originInfo, checker.data);
}
exports.updateInfo = updateInfo;
;
