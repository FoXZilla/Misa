"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const runtime_1 = require("../../runtime");
const URL = require('url');
class QQOAuth {
    constructor(config) {
        this.config = config;
        this.stateMap = {};
        config.redirect_uri = config.redirect_uri || `${runtime_1.apiUrl()}/oauth/callback/${config.id}`;
    }
    ;
    getCode(redirect, req) {
        const getCodeUrl = 'https://graph.qq.com/oauth2.0/authorize';
        const state = Math.random().toString().split('.')[1];
        const queryData = {
            response_type: 'code',
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect_uri,
            state: state,
            scope: 'get_user_info',
        };
        this.stateMap[state] = {
            referer: req.headers.referer,
            firebean: req.query.firebean
                ? JSON.parse(req.query.firebean)
                : {},
        };
        redirect(`${getCodeUrl}?${(new URL.URLSearchParams(queryData))}`);
    }
    ;
    async getToken(query) {
        if (!(query.state in this.stateMap)) {
            throw new Error('The state not match.');
        }
        ;
        const url = 'https://graph.qq.com/oauth2.0/token';
        const queryData = {
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            code: query.code,
            redirect_uri: this.config.redirect_uri,
            grant_type: 'authorization_code',
        };
        var tokenData = await async function (response) {
            var result = {};
            for (let [key, value] of new URL.URLSearchParams(await response.text()).entries()) {
                result[key] = value;
            }
            ;
            return result;
        }(await node_fetch_1.default(`${url}?${new URL.URLSearchParams(queryData)}`, { agent: global.HTTP_PROXY }));
        return tokenData['access_token'];
    }
    ;
    async getOpenId(accessToken) {
        const url = 'https://graph.qq.com/oauth2.0/me';
        const queryData = {
            access_token: accessToken,
        };
        var responseText = await (await node_fetch_1.default(`${url}?${new URL.URLSearchParams(queryData)}`, { agent: global.HTTP_PROXY })).text();
        return JSON.parse(responseText.match(/callback\((.+)\)/)[1]).openid;
    }
    ;
    async getUserInfo(accessToken, openId) {
        const url = 'https://graph.qq.com/user/get_user_info';
        const queryData = {
            openid: openId,
            access_token: accessToken,
            oauth_consumer_key: this.config.client_id
        };
        var responseJson = await (await node_fetch_1.default(`${url}?${new URL.URLSearchParams(queryData)}`, { agent: global.HTTP_PROXY })).json();
        return {
            nickname: responseJson.nickname,
            avatar: {
                50: responseJson.figureurl_1,
                100: responseJson.figureurl_2,
            },
        };
    }
    ;
}
exports.default = QQOAuth;
;
