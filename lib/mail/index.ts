import {CommentInfo ,UserInfo ,UserRaw} from "@foxzilla/fireblog";
import * as Reply from './templates/reply';
import * as At from './templates/at';
import {sendMail} from "../runtime";
import * as User from '../../model/user';
import * as Comment from '../../model/comment';


export async function reply(comment :CommentInfo){
    if(!('reply_to' in comment))return;
    var beRepliedComment =await Comment.getInfoById(comment.reply_to!);
    var beRepliedUser :UserRaw =await User.getRawById(beRepliedComment.author_id);
    if(!('mail' in beRepliedUser))return;

    Reply.setData({comment});

    var data =await Reply.render();

    await sendMail({
        to    :beRepliedUser.mail!,
        title :data.title,
        content :data.content,
    });

}

export async function at(userId:UserInfo['id'] ,comment :CommentInfo){
    var user :UserRaw =await User.getRawById(userId);
    if(!('mail' in user))return;

    At.setData({comment,userId});

    var data =await At.render();

    await sendMail({
        to    :user.mail!,
        title :data.title,
        content :data.content,
    });

}
