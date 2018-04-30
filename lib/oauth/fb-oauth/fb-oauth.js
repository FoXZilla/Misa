"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../../pea-script");
const runtime_1 = require("../../runtime");
const node_fetch_1 = require("node-fetch");
const URL = require('url');
class FbOauth {
    constructor(config) {
        this.config = config;
        this.stateMap = {};
        config.redirect_uri = config.redirect_uri || `${runtime_1.apiUrl()}/oauth/callback/${config.id}`;
    }
    ;
    getCode(redirect, query = {}) {
        const getCodeUrl = 'https://www.facebook.com/v2.12/dialog/oauth';
        const state = pea_script_1.getRandomChar(16);
        const queryData = {
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect_uri,
            state: state,
            response_type: 'code',
        };
        this.stateMap[state] = {
            firebean: query.firebean
                ? JSON.parse(query.firebean)
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
        const getTokenUrl = 'https://graph.facebook.com/v2.12/oauth/access_token';
        const getTokenQueryData = {
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            code: query.code,
            redirect_uri: this.config.redirect_uri,
        };
        var tokenData = await async function (response) {
            var result = {};
            for (let [key, value] of new URL.URLSearchParams(await response.json()).entries()) {
                result[key] = value;
            }
            ;
            return result;
        }(await node_fetch_1.default(`${getTokenUrl}?${new URL.URLSearchParams(getTokenQueryData)}`, { agent: global.HTTP_PROXY }));
        return tokenData['access_token'];
    }
    ;
    async userInfo(successToken) {
        const URL = require('url');
        const GetTokenUrl = 'https://graph.facebook.com/v2.12/me';
        const GetTokenQueryData = {
            access_token: successToken,
            fields: ['id', 'name', 'email'].join(','),
        };
        var response = (await node_fetch_1.default(`${GetTokenUrl}?${new URL.URLSearchParams(GetTokenQueryData)}`, { agent: global.HTTP_PROXY }));
        return response.json();
    }
    ;
}
exports.FbOauth = FbOauth;
;
