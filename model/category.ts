import {categoryPath} from "../lib/config-reader";
import {CategoryInfo, CategoryRaw} from "@foxzilla/fireblog";
import {Toml2Json} from "../lib/lib";

const Fs = require('fs-extra');
const Path = require('path');

const DATA_PATH =categoryPath();



// Getter

export async function getRawAll():Promise<CategoryRaw[]>{
    return (await (Promise.all((<string[]>(await Fs.readdir(DATA_PATH)))
        .map(fileName=>Path.join(DATA_PATH,fileName))
        .map(filePath=>Fs.readFile(filePath)))))
        .map(Toml2Json)
    ;
}
export var getInfoAll:()=>Promise<CategoryInfo[]> =getRawAll;