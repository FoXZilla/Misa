import {RequestHandler} from "express";
const Fs = require('fs-extra');
const Path = require('path');


export function catchWith<T>(
    method :()=>Promise<T>
):RequestHandler{
    return function(req,res,next){
        method().then(data=>{
            res.json(data);
        },error=>{throw error});
    };
};
export function getBestMatchAvatar(optionMap:any,expectSize=40):number|null{
    var options =Object.keys(optionMap).map(Number).filter(i=>!Number.isNaN(i)).sort((i1,i2)=>i1-i2);
    for(let option of options){
        if(option >=expectSize) return option;
    };
    return options.pop()||null;
}
export function fileExist(...path:string[]):Promise<boolean>{
    return new Promise(resolve=>Fs.access(
        Path.join(...path),
        Fs.constants.R_OK,
        (err:NodeJS.ErrnoException)=>err?resolve(false):resolve(true)
    ));
}
export async function getNextIdFromPath(...path:string[]):Promise<number>{
    var files:string[] =await Fs.readdir(Path.join(...path));
    var maxId =Math.max(0,...files.map(filename=>Number(filename.replace('.toml',''))));
    return maxId+1;
}
export function toIndexMap<T>(array:Iterable<T>,key:keyof T){
    var map:any ={};
    for(let item of array){
        map[item[key]]=item;
    };
    return map as {[p:string]:T};
};
export const Json2Toml =require('json2toml');
export const Toml2Json =require('toml').parse;
