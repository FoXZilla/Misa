export interface QQOAuthTokenData{
    accessToken:string;
    age:Date;
    refreshToken:string;
};
export default class QQOAuth{
    public states:string[]=[];
    public clientId:string;
    public clientSecret:string;
    public redirectUri:string;
    public scope:string[];
    constructor({
                    clientId,
                    clientSecret,
                    redirectUri,
                    scope =['get_user_info'],
                }:{
        clientId:string,
        clientSecret:string,
        redirectUri:string,
        scope?:string[],
    }){
        this.clientId =clientId;
        this.clientSecret =clientSecret;
        this.redirectUri =redirectUri;
        this.scope =scope;
    };
    getCode(redirect:(url:string)=>void){
        const URL =require('url');
        const GetCodeUrl ='https://graph.qq.com/oauth2.0/authorize';
        const State =Math.random().toString().split('.')[1];
        const GetCodeQueryData ={
            response_type :'code',
            client_id :this.clientId,
            redirect_uri:this.redirectUri,
            state :State,
            scope:this.scope.join(','),
        };
        this.states.push(State);
        redirect(`${GetCodeUrl}?${(new URL.URLSearchParams(GetCodeQueryData))}`);
    };
    async getToken(query:any):Promise<QQOAuthTokenData>{
        if(!(this.states.includes(query.state))){
            throw new Error('The state not match.');
        };
        this.states.splice(this.states.indexOf(query.state),1);

        const URL =require('url');
        const Axios =require('axios');
        const GetTokenUrl ='https://graph.qq.com/oauth2.0/token';
        const GetTokenQueryData ={
            grant_type :'authorization_code',
            client_id :this.clientId,
            client_secret:this.clientSecret,
            code:query.code,
            redirect_uri:this.redirectUri,
        };
        var getTokenUrl =`${GetTokenUrl}?${new URL.URLSearchParams(GetTokenQueryData)}`;
        var tokenResponse =await Axios.get(getTokenUrl);
        var tokenData =function(data){
            var result:any ={};
            for(let [key,value] of new URL.URLSearchParams(data).entries()){
                result[key] =value;
            };
            return result
        }(tokenResponse.data);
        return {
            age :new Date(+tokenData['expires_in']+new Date().getTime()),
            accessToken :tokenData['access_token'],
            refreshToken:tokenData['refresh_token'],
        };
    };
    async getOpenId(tokenDate:QQOAuthTokenData):Promise<string>{
        const URL =require('url');
        const Axios =require('axios');
        const GetOpenIdUrl ='https://graph.qq.com/oauth2.0/me';
        const GetOpenIdQueryData ={
            access_token:tokenDate.accessToken,
        };
        var openIdResponse =await Axios.get(`${GetOpenIdUrl}?${new URL.URLSearchParams(GetOpenIdQueryData)}`);
        return JSON.parse(openIdResponse.data.match(/callback\((.+)\)/)[1]).openid;
    };
    async getUserInfo(tokenDate:QQOAuthTokenData,openId:string){
        const URL =require('url');
        const Axios =require('axios');
        const GetUserInfoUrl ='https://graph.qq.com/user/get_user_info';
        const GetUserInfoQueryData ={
            openid :openId,
            access_token :tokenDate.accessToken,
            oauth_consumer_key :this.clientId
        };
        var response =await Axios.get(`${GetUserInfoUrl}?${new URL.URLSearchParams(GetUserInfoQueryData)}`);
        return {
            nickname :response.data.nickname as string,
            avatar   :{
                30 :response.data.figureurl as string,
                40 :response.data.figureurl_qq_1 as string,
                50 :response.data.figureurl_1 as string,
                100:response.data.figureurl_2 as string,
            },
        };
    };
};