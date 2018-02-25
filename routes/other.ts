import {Get, Errcode} from "@foxzilla/fireblog";
import {toIndexMap} from "../lib/lib";
import * as Category from '../model/category';
import * as Tag from '../model/tag';


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
