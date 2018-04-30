import TokenManager from "./token-manager";
import {dataPath ,staticPath} from "./path-reader";
import {FireBlogCookie ,Errcode ,Omit} from "@foxzilla/fireblog";
import {RequestHandler} from "express";
import * as Nodemailer from 'nodemailer';
import {SentMessageInfo} from "nodemailer";
import FireBlogData from "@foxzilla/fireblog/types/export";
import {getBestMatchAvatar ,Toml2Json} from "./lib";
import {throws} from "assert";


const Fs = require('fs-extra');
const Path = require('path');

export const md =require('marked');
export const config:Omit<FireBlogData,'data'> =Toml2Json(
    Fs.readFileSync(
        Path.join(dataPath(),'config.toml')
    )
);

export const tokenManager=function(){
    var tokenManager:TokenManager =new TokenManager({tokenAge:tokenAgeMs()});
    return ()=>tokenManager;
}();
export var checkToken:RequestHandler =async function(req,res,next){
    var cookie:FireBlogCookie =req.cookies;
    if(!cookie.token){
        res.json({
            errcode:Errcode.NeedToken,
            errmsg :'Token is undefined, did you set withCredentials as true?'
        });
        return;
    };
    {
        let checkResult =tokenManager().checkToken(cookie.token);
        if(checkResult !==Errcode.Ok){
            res.json({
                errcode:checkResult,
                errmsg :'Cut of check token.'
            });
            return;
        };
    };
    next();
};
export const FireBlogVersion =require('../node_modules/@foxzilla/fireblog/package.json').version;

export const sendMail =function(){
    const MailConfig =mailConfig() ||{
        from :'tomori',
        connect :null,
    };
    const transporter =function(MailConfig){
        if(MailConfig && MailConfig.connect){
            console.log('Loaded mail config.');
            return Nodemailer.createTransport(MailConfig.connect+'/?pool=true');
        }else{
            console.log('Use sendmail command to send e-mail.');
            return Nodemailer.createTransport({
                sendmail: true,
                newline: 'unix',
                path: '/usr/sbin/sendmail'
            });
        }
    }(MailConfig);
    const ready =new Promise(resolve=>transporter.verify(function(error, success) {
        if (error) throw error;
        console.log('Server is ready to take our mail.');
        resolve();
    }));
    return async function({to,from=MailConfig.from,title,content}:{
        to:string;
        from?:string;
        title:string;
        content:string;
    }):Promise<SentMessageInfo>{
        await ready;
        console.log('sending... mail to:',to);
        if(!from && !MailConfig.from) throw new Error('sendMail: no "from" field.');
        return new Promise(function(resolve,reject){
            transporter.sendMail({
                from,to,
                subject: title,
                html: content,
            }, (err, info) => {
                if(err){
                    console.error(err);
                    reject(err);
                }else {
                    console.log('mail sent:',JSON.stringify(info,null,'  '));
                    resolve(info);
                }
            });
        });
    };
}();

export function frontUrl():string{
    return config.meta['front_url'];
};
export function apiUrl():string{
    return config.meta['api_url'];
};
export function tokenAgeMs():number{
    return (config.meta['token_age_s']||60*60*24*7)*1000;
};
export function defaultAvatar(size:number):string{
    var options =config.meta['default_avatar']!;
    var bestMatch =getBestMatchAvatar(options,size)!;
    return Path.join(dataPath(),options[bestMatch]);
};
export function oAuthMap(){
    return config.meta['oauth'];
};
export function mailConfig():FireBlogData['meta']['mail']|null{
    return config.meta.mail ||null;
}
export function pathMap2urlMap(pathMap:any):any{
    var map =Object.create(pathMap||null);
    for(let key in pathMap){
        map[key] =path2url(pathMap[key]);
    };
    return map;
}
export function path2url(path:string):string{
    if(path.startsWith('http'))return path;
    return Path.join(staticPath(),path).replace(staticPath(),apiUrl());
}
