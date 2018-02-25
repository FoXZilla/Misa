import {tagPath} from "../lib/config-reader";
import {TagInfo, TagRaw} from "@foxzilla/fireblog";
import {Toml2Json} from "../lib/lib";
import * as Article from '../model/article';

const Fs = require('fs-extra');
const Path = require('path');

const DATA_PATH =tagPath();


// Getter

export async function getRawAll():Promise<TagRaw[]>{
    return (await (Promise.all((<string[]>(await Fs.readdir(DATA_PATH)))
        .map(fileName=>Path.join(DATA_PATH,fileName))
        .map(filePath=>Fs.readFile(filePath)))))
        .map(Toml2Json)
    ;
}
export async function getInfoAll():Promise<TagInfo[]>{
    var tagList:TagInfo[] =(await getRawAll()).map(i=>Object.assign(i,{count:0}));

    // count comment
    for(let article of await Article.getInfoAll()){
        if(!article.tag_list)continue;
        article.tag_list.forEach(tagAlias=>tagList.find(tag=>tag.alias===tagAlias)!.count++)
    };

    return tagList;
};
