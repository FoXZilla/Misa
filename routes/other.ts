import {CategoryInfo, Get, Errcode, TagInfo} from "../types";
import {toIndexMap} from "../lib/lib";
import {categoryPath, tagPath} from "../lib/config-reader";
const Bluebird = require('bluebird');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');
const Toml2Json =require('toml').parse;


export var getCategoryAll:Get.category.all.asyncCall =async function(){
    var files:string[] =await Fs.readdirAsync(await categoryPath());
    var categories:CategoryInfo[] =[];
    for(let fileName of files){
        let filePath =Path.join(await categoryPath(),fileName);
        let fileContent:string =await Fs.readFileAsync(filePath);
        categories.push(Toml2Json(fileContent));
    };
    return {
        errcode     :Errcode.Ok,
        errmsg      :'all categories.',
        category_length :categories.length,
        category_map :toIndexMap(categories,'alias'),
    };
};
export var getTagAll:Get.tag.all.asyncCall =async function (){
    var files:string[] =await Fs.readdirAsync(await tagPath());
    var tags:TagInfo[] =[];
    for(let fileName of files){
        let filePath =Path.join(await tagPath(),fileName);
        let fileContent:string =await Fs.readFileAsync(filePath);
        tags.push(Toml2Json(fileContent));
    };
    return {
        errcode :0,
        errmsg :'ok',
        tag_length :tags.length,
        tag_map :toIndexMap(tags,'alias'),
    };
};