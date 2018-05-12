import {fileExist} from "./lib";

const Path = require('path');
const Fs = require('fs-extra');

export const RootPath =Path.join(__dirname ,'../');

var _dataPath =Path.join(RootPath,'data');
export function setDataPath(newValue:string){
    _dataPath =newValue.replace(/\/$/,'');
}
export function dataPath():string{
    return _dataPath;
};
export function initPath(){
    [
        dataPath,
        staticPath,
        attachmentPath,
        privateStaticPath,
        commentPath,
        articlePath,
        categoryPath,
        tagPath,
        userPath,
    ].forEach(function(path:()=>string){
        if(!fileExist(path())) Fs.mkdirSync(path());
    });
}

export function staticPath(){
    return Path.join(dataPath(),'static/');
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
    return Path.join(staticPath(),'attachment/');
};
export function userPath():string{
    return Path.join(dataPath(),'user/');
};
export function privateStaticPath(){
    return Path.join(staticPath(),'_misa/');
}
export function defalutAvatarPath(){
    return {
        40  :Path.join(RootPath,'lib/image/akkarin-40x40.gif'),
        100 :Path.join(RootPath,'lib/image/akkarin-100x100.gif'),
    }
}
export function faviconPath(){
    return Path.join(RootPath,'lib/image/foxzilla-64x64.ico');
}
