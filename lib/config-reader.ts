import {getBestMatchAvatar, Toml2Json} from "./lib";
import FireBlogData from "@foxzilla/fireblog/types/export";

const Fs = require('fs-extra');
const Path = require('path');


export function dataPath():string{
    return Path.join(__dirname,'../data');
};
export function commentPath():string{
    return Path.join(dataPath(),'comment/');
};
export function articlePath():string{
    return Path.join(dataPath(),'article/');
};
export function categoryPath():string{
    return Path.join(dataPath(),'category/');
};
export function tagPath():string{
    return Path.join(dataPath(),'tag/');
};
export function attachmentPath():string{
    return Path.join(dataPath(),'attachment/');
};
export async function config():Promise<any>{
    return Toml2Json(
        await Fs.readFile(
            Path.join(await dataPath(),'config.toml')
        )
    );
};
export async function frontUrl():Promise<string>{
    return (await config())['front_url'];
};
export async function apiUrl():Promise<string>{
    return (await config())['api_url'];
};
export async function tokenAgeMs():Promise<number>{
    return ((await config())['token_age_s']||60*60*24*7)*1000;
};
export async function defaultAvatar(size:number):Promise<string>{
    var options =(await config())['default_avatar'];
    var bestMatch =getBestMatchAvatar(options,size)!;
    return Path.join(dataPath(),options[bestMatch]);
};
export async function getOAuthConfig(OAuthId:string){
    var options:FireBlogData['oauth']|undefined =(await config())['oauth'];
    if(!options)return null;
    if(!options[OAuthId])return null;
    return options[OAuthId];
};