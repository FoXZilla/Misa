import QQOAuth from './qq-oauth';
import FBOAuth from './fb-oauth';
import {OAuthOption} from "@foxzilla/fireblog";
import {Router} from "express";
import {Assert} from "../pea-script";
import TokenManager from "../token-manager";


interface Interface{
    name:string;
    test(config:OAuthOption):boolean;
    install({
        router,config,tokenManager
    }:{
        router:Router,
        config:OAuthOption,
        tokenManager:TokenManager,
    }):any;
}

export default Assert<Interface[]>([
    QQOAuth,
    FBOAuth,
]);
