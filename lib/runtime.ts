import TokenManager from "./token-manager";
import {tokenAgeMs} from "./config-reader";
import {Cookie, Errcode} from "@foxzilla/fireblog";
import {RequestHandler} from "express";

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