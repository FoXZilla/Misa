import {Assert ,noLeftSpace} from "../../pea-script";
import {CommentInfo ,UserInfo ,FireBean ,ArticleInfo ,UserRaw} from "@foxzilla/fireblog";
import * as Comment from '../../../model/comment';
import * as User from '../../../model/user';
import * as Article from '../../../model/article';
import {stringify} from '../../firebean';
import {frontUrl ,md} from "../../runtime";

var Data:DataType;

export interface DataType{
    comment:CommentInfo,
    userId:UserInfo['id'],
}
export function getData():DataType{
    return Data;
}
export function setData(newDate:DataType){
    Data =newDate;
};
export async function render():Promise<{content:string,title:string}>{
    var user:UserInfo =await User.getInfoById(Data.comment.author_id);
    var article:ArticleInfo =await Article.getInfoById(Data.comment.article_id);
    return {
        title  :`[${article.id}/${Data.comment.id}] You receive a at in comment#${Data.comment.id}`,
        content:md(noLeftSpace`
            
            ## ${user.nickname}:
            
            ${Data.comment.md_content}
            
            ---
            
            - [View this comment](${stringify({
                _type       :FireBean.Type.goComment,
                id          :Data.comment.id,
                author_id   :Data.comment.author_id,
                article_id  :article.id,
                ...('reply_to' in Data.comment) ?{reply_to:Data.comment.reply_to} :{},
            },frontUrl())})
            - [View this article](${stringify({
                _type   :FireBean.Type.goArticle,
                id      :Data.comment.article_id,
                state   :article.state,
            },frontUrl())})
        `),
    };
};
