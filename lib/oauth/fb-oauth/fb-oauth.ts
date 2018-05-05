import {OAuthOption,FireBean} from "@foxzilla/fireblog";
import {getRandomChar} from "../../pea-script";
import {apiUrl} from "../../runtime";
import Fetch from 'node-fetch';

const URL =require('url');


export interface RedirectQuery{
    client_id   :OAuthOption['client_id'];
    redirect_uri:OAuthOption['redirect_uri'];
    state       :string;
    response_type:'code'|'token'|'code%20token'|'granted_scopes';
    scope      ?:string;
}
export interface CallbackInQuery{
    code :string;
    state:string;
}

export class FbOauth{
    public stateMap:{
        [state:string]:{firebean:Partial<FireBean.Data>}
    }={};
    constructor(public config:OAuthOption){
        config.redirect_uri =config.redirect_uri||`${apiUrl()}/oauth/callback/${config.id}`;
    };

    getCode(redirect:(url:string)=>void ,query:any={}){
        const getCodeUrl ='https://www.facebook.com/v2.12/dialog/oauth';
        const state =getRandomChar(16);
        const queryData:RedirectQuery ={
            response_type :'code',
            client_id :this.config.client_id,
            redirect_uri :this.config.redirect_uri,
            state :state,
        };
        this.stateMap[state] ={
            firebean :query.firebean
                ?JSON.parse(query.firebean)
                :{}
            ,
        };
        redirect(`${getCodeUrl}?${(new URL.URLSearchParams(queryData))}`);
    };
    async getToken(query:CallbackInQuery):Promise<string>{
        if(!(query.state in this.stateMap)){
            throw new Error('The state not match.');
        };

        const getTokenUrl ='https://graph.facebook.com/v2.12/oauth/access_token';
        const getTokenQueryData ={
            client_id :this.config.client_id,
            client_secret :this.config.client_secret,
            code :query.code,
            redirect_uri :this.config.redirect_uri,
        };

        var tokenData:any =await (await Fetch(
            `${getTokenUrl}?${new URL.URLSearchParams(getTokenQueryData)}`,
            {agent :global.HTTP_PROXY},
        )).json();

        return tokenData['access_token'];

    };
    async getUserInfo(successToken:string):Promise<{id:string,name:string,email?:string}>{
        const url ='https://graph.facebook.com/v2.12/me';
        const queryData ={
            access_token :successToken,
            fields :['id','name','email'].join(','),
        };

        var response =(await Fetch(
            `${url}?${new URL.URLSearchParams(queryData)}`,
            {agent :global.HTTP_PROXY},
        ));

        return response.json();

    };
};
