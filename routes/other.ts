import {Get ,Errcode ,Omit} from "@foxzilla/fireblog";
import {toIndexMap ,Toml2Json} from "../lib/lib";
import * as Category from '../model/category';
import * as Tag from '../model/tag';
import {dataPath} from "../lib/path-reader";
import FormDictator from "../lib/form-dictator";
import FireBlogData ,{default as OAuthOption} from "@foxzilla/fireblog/types/export";
import {apiUrl ,frontUrl ,path2url ,pathMap2urlMap} from "../lib/runtime";

const Fs = require('fs-extra');
const Path = require('path');


export var getCategoryAll:Get.category.all.asyncCall =async function(){
    var categories =await Category.getInfoAll();
    return {
        errcode     :Errcode.Ok,
        errmsg      :'all categories.',
        category_length :categories.length,
        category_map :toIndexMap(categories,'alias'),
    };
};
export var getTagAll:Get.tag.all.asyncCall =async function (){
    var tags =await Tag.getInfoAll();
    return {
        errcode :0,
        errmsg :'ok',
        tag_length :tags.length,
        tag_map :toIndexMap(tags,'alias'),
    };
};
export var getFireBlogVersion:Get.fireblog.version.asyncCall =async function (){
    var packageJson =require('../package.json');
    return {
        errcode :0,
        errmsg :'ok',
        version :packageJson.dependencies['@foxzilla/fireblog'],
    };
};
export var getBlogInfo:Get.blog.info.asyncCall =async function (){
    var raw:Omit<FireBlogData,'data'> =Toml2Json(await Fs.readFile(Path.join(dataPath(),'config.toml')));
    return {
        errcode :0,
        errmsg :'ok',
        name    :raw.name,
        version :raw.version,
        ...new FormDictator(raw.meta).pick([
            'publish_date',
            'description',
            'language',
            'token_age_s',
            'copyright',
            'nav',
            'blogroll',
        ]).data,
        oauth :function(optionMap:any){
            var newMap:any ={};
            for(let id in optionMap){
                newMap[id]={};
                Object.assign(newMap[id],optionMap[id]);
                delete newMap[id].client_secret;
            };
            return newMap;
        }(raw.meta.oauth),
        favicon :pathMap2urlMap(raw.meta.favicon),
        default_avatar :pathMap2urlMap(raw.meta.default_avatar),
        author :{
            ...raw.meta.author,
            ...raw.meta.author.avatar ?{avatar:path2url(raw.meta.author.avatar)} :{},
        },
        api_url :apiUrl(),
        front_url :frontUrl(),
    };
};
