import TokenManager from "./token-manager";
import {tokenAgeMs} from "./config-reader";
import {Cookie, Errcode} from "@foxzilla/fireblog";
import {RequestHandler} from "express";
import * as Nodemailer from 'nodemailer';
import {SentMessageInfo} from "nodemailer";
import {config} from './config-reader';

const Marked =require('marked');

export const tokenManager=function(){
    var tokenManager:TokenManager;
    tokenAgeMs().then(ms=>tokenManager=new TokenManager({tokenAge:ms}));
    return ()=>tokenManager;
}();
export var checkToken:RequestHandler =async function(req,res,next){
    var cookie:Cookie =req.cookies;
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
export var FireBlogVersion =require('../node_modules/@foxzilla/fireblog/package.json').version;

export const sendMail =function(){
    const transporter =config.mail && config.mail.connect
        ? Nodemailer.createTransport(config.mail.connect)
        : Nodemailer.createTransport({
            sendmail: true,
            newline: 'unix',
            path: '/usr/sbin/sendmail'
        })
    ;
    if(config.mail)console.log('Loaded mail config.');
    else console.log('Use sendmail command to send e-mail.');
    return async function({to,from=config.mail.from,title,md_content}:{
        to:string;
        from?:string;
        title:string;
        md_content:string;
    }):Promise<SentMessageInfo>{
        if(!from && !config.mail.from) throw new Error('sendMail: no "from" field.');
        return new Promise(function(resolve,reject){
            transporter.sendMail({
                from,to,
                subject: title,
                html: Marked(md_content),
            }, (err, info) => {
                if(err)reject(err);
                else resolve(info);
            });
        });
    };
}();