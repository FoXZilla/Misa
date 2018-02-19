import {getBestMatchAvatar} from "./lib";

const Bluebird = require('bluebird');
const Toml2Json =require('toml').parse;
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');

export function dataPath():string{
    return Path.join(__dirname,'../data');
};
export function commentPath():string{
    return Path.join(dataPath(),'comment/');
};
export function postsPath():string{
    return Path.join(dataPath(),'posts/');
};
export function categoryPath():string{
    return Path.join(dataPath(),'category/');
};
export function tagPath():string{
    return Path.join(dataPath(),'tag/');
};
export async function config():Promise<any>{
    return Toml2Json(
        await Fs.readFileAsync(
            Path.join(await dataPath(),'config.toml')
        )
    );
};
export async function clintUrl():Promise<string>{
    return (await config())['clint_url'];
};
export async function serverUrl():Promise<string>{
    return (await config())['server_url'];
};
export async function tokenAgeMs():Promise<number>{
    return (await config())['token_age']*1000;
};
export async function defaultAvatar(size:number):Promise<string>{
    var options =(await config())['default_avatar'];
    var bestMatch =getBestMatchAvatar(options,size)!;
    return Path.join(dataPath(),options[bestMatch]);
};