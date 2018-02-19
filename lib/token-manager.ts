import {getRandomChar} from './pea-script';
import {Errcode} from "../types";

interface TokenValue{
    oAuthId:string,
    openId :string,
    userId :number;
}
interface TokenMeta{
    timer :NodeJS.Timer|number;
    createDate:Date;
}

export default class TokenManager{
    constructor({tokenAge}:{tokenAge:number}){
        this.tokenAge =tokenAge;

        this.tokenMap ={};
        this.tokenData={};
    };
    checkIn(value:TokenValue){
        var token =getRandomChar(16);
        this.tokenMap[token] =value;
        this.tokenData[token] ={
            timer :setTimeout(()=>this.destroyToken(token),this.tokenAge),
            createDate :new Date,
        };
        return token;
    };
    checkToken(token?:string)
        :Errcode.Ok
        |Errcode.NeedLogin
        |Errcode.LoginTimeout
        |Errcode.Error
    {
        if(!token)return Errcode.Error;
        if(!(token in this.tokenMap))return Errcode.NeedLogin;
        if(this.getTokenAge(token).getTime() < new Date().getTime()){
            this.destroyToken(token);
            return Errcode.LoginTimeout;
        };
        return Errcode.Ok;
    };
    getTokenInfo(token:string):TokenValue{
        return this.tokenMap[token]!;
    };
    destroyToken(token:string){
        delete this.tokenData[token];
        delete this.tokenMap[token];
    };
    getTokenAge(token:string):Date{
        return new Date(
            this.tokenData[token].createDate.getTime()+this.tokenAge
        );
    };
    protected tokenMap  :{[p:string]:TokenValue};
    protected tokenData :{[p:string]:TokenMeta};
    protected tokenAge  :number;
}