/**
 * @version 1.0-alpha.4
 * */


// APIs

/*
    GET   /oauth/login/:oauth_id
    GET   /oauth/callback/:oauth_id
    GET   /category/all
    GET   /tag/all
    GET   /posts/all
    GET   /posts/search?tag=&category=
    GET   /posts/:posts_id
    POST  /comment/create
    GET   /comment/remove/:common_id
    GET   /user/logout
    HEAD  /user/logout
    GET   /user/ping?user_id=token=
    POST  /user/update_info
    GET   /user/avatar/:user_id?size=40
    GET   /user/info/:user_id
*/
export namespace Get{
    export namespace oauth{
        export namespace login{
            export namespace $oauth_id{
                export type response =void;
                export type call      =(oauth_id:string)=>void;
                export type asyncCall =(oauth_id:string)=>void;
            }
        }
        export namespace callback{
            export namespace $oauth_id{
                export interface query{
                    code :string;
                    state:string;
                }
                export const enum Storage{Key ='oauth.login'}
                export interface StorageValue{//oauth.login
                    user_id:UserInfo['id'];
                    token:string;
                    age:ResponseDate;
                    need_info?:boolean;
                }
                export interface CookieValue{
                    token:string;
                }
                export type response =void;
                export type call      =(oauth_id:string)=>void;
                export type asyncCall =(oauth_id:string)=>void;
            }
        }
        export namespace logout{
            export type response =void;
            export type call      =()=>void;
            export type asyncCall =()=>void;
        }
    }
    export namespace category{//todo: next
        export namespace all{
            export interface response extends ApiSuccessResponse{
                category_length:number;
                category_map   :IndexMap<CategoryInfo['alias'],CategoryInfo>;
            }
            export type call      =()=>        response|ApiErrorResponse;
            export type asyncCall =()=>Promise<response|ApiErrorResponse>;
        }
    }
    export namespace tag{
        export namespace all{
            export interface response extends ApiSuccessResponse{
                tag_length:number;
                tag_map   :IndexMap<TagInfo['alias'],TagInfo>;
            }
            export type call      =()=>        response|ApiErrorResponse;
            export type asyncCall =()=>Promise<response|ApiErrorResponse>;
        }
    }
    export namespace posts{
        export namespace all{
            export interface response extends ApiSuccessResponse{
                posts_length:number;
                posts_map :IndexMap<
                    ToString<PostsInfo['id']>,
                    Omit<PostsInfo,'md_content'|'comment_list'>
                >;
            }
            export type call      =()=>        response|ApiErrorResponse;
            export type asyncCall =()=>Promise<response|ApiErrorResponse>;
        }
        export namespace $posts_id{
            interface NeedPasswordResponse extends ApiErrorResponse{
                errcode       :Errcode.IncorrectPassword;
                password_hint?:string;
            }
            export interface response extends ApiSuccessResponse,PostsInfo{}
            export interface query{
                password ?:string;
            }
            export type call      =(posts_id:PostsInfo["id"]) =>        response|ApiErrorResponse|NeedPasswordResponse;
            export type asyncCall =(posts_id:PostsInfo["id"]) =>Promise<response|ApiErrorResponse|NeedPasswordResponse>;
        }
        export namespace search{
            export interface query{
                tag     ?:(TagInfo['alias'])[];
                category?:(CategoryInfo['alias'])[];
            }
            export interface response extends Get.posts.all.response{}
            export type call      =()=>        response|ApiErrorResponse;
            export type asyncCall =()=>Promise<response|ApiErrorResponse>;
        }
    }
    export namespace user{
        export namespace avatar{
            namespace $user_id{
                export interface query{
                    size ?:number,// 40 default
                }
                export type response =void;
                export type call      =(user_id:UserInfo['id'])=>void;
                export type asyncCall =(user_id:UserInfo['id'])=>void;
            }
        }
        export namespace info{
            namespace $user_id{
                export interface response extends ApiSuccessResponse,UserInfo{}
                export type call      =(user_id:UserInfo['id'])=>        response|ApiErrorResponse;
                export type asyncCall =(user_id:UserInfo['id'])=>Promise<response|ApiErrorResponse>;
            }
        }
    }
    export namespace comment{
        export namespace remove{
            export interface response extends ApiSuccessResponse,CommentInfo{}
            export type call      =(comment_id:CommentInfo["id"]) =>        response|ApiErrorResponse;
            export type asyncCall =(comment_id:CommentInfo["id"]) =>Promise<response|ApiErrorResponse>;
        }
    }
}
export namespace Post{
    export namespace comment{
        export namespace create{
            export interface request{
                posts_id   :PostsInfo['id'];
                md_content :string;
                reply_to  ?:CommentInfo['id'];
            }
            export interface response extends ApiSuccessResponse,CommentInfo{}
            export type call      =()=>        response|ApiErrorResponse;
            export type asyncCall =()=>Promise<response|ApiErrorResponse>;
        }
    }
    export namespace user{
        export namespace update_info{
            export interface response extends ApiSuccessResponse,Partial<Pick<UserInfo,'nickname'|'mail'>>{}
            export interface body extends Pick<UserInfo,'nickname'|'mail'>{}
            export type call      =()=>        response|ApiErrorResponse;
            export type asyncCall =()=>Promise<response|ApiErrorResponse>;
        }
    }
}


// Cookies & Storage

export interface Cookie extends
    Partial<Get.oauth.callback.$oauth_id.CookieValue>
{}
export interface Storage extends
    Partial<Get.oauth.callback.$oauth_id.StorageValue>
{}


// Types

/**
 * The minimize response of APIs.
 * @typedef {Object} ApiResponse
 * @property {Errcode} errcode - The state of request.
 * @property {string}          errmsg  - The message for debugging.
 * */
export interface ApiResponse{
    errcode :Errcode;
    errmsg ?:string;
}
/**
 * Like ApiResponse, but be limited in the case when some errors have occurred.
 * @typedef {Object} ApiErrorResponse
 * */
export interface ApiErrorResponse extends ApiResponse{
    errcode :ErrorErrcode;
}
export interface ApiSuccessResponse extends ApiResponse{
    errcode :SuccessErrcode;
}
/**
 * The map of all case of ApiResponse.errcode.
 * @typedef {object} Errcode
 * */
export const enum Errcode{
    Ok=0,
    Error=1,
    // some not found
    PostsNotFound=201,
    TagNotFound=202,
    CategoryNotFound=203,
    CommentNotFound=204,
    UserNotFound=205,
    // field validate
    Nickname=301,
    Mail=302,
    // other
    NeedLogin=401,
    LoginTimeout=402,
    AccessDeny =403,
    IncorrectPassword =404,
}
/**
 * All success case of ApiResponse.errcode.
 * @typedef {number} SuccessErrcode
 * */
export type SuccessErrcode =Errcode.Ok;
/**
 * All fail case of ApiResponse.errcode.
 * @typedef {number} SuccessErrcode
 * */
export type ErrorErrcode=// all of Errcode except SuccessErrcode
    Errcode.Error
    | Errcode.TagNotFound
    | Errcode.PostsNotFound
    | Errcode.CategoryNotFound
    | Errcode.UserNotFound
    | Errcode.NeedLogin
    | Errcode.LoginTimeout
    | Errcode.Nickname
    | Errcode.Mail
    | Errcode.IncorrectPassword
    | Errcode.AccessDeny
    | Errcode.CommentNotFound
;
/**
 * A tag.
 * @typedef {Object} TagInfo
 * @property {string} name - The name of tag.
 * @property {AliasString} alias - The name of tag stand in the program, to be used as identifier.
 * */
export interface TagInfo{
    name        :string;
    alias       :AliasString;
    description :string;
}
/**
 * A Category.
 * @typedef {Object} CategoryInfo
 * @property {string}               name - The name of category
 * @property {AliasString}        alias - The name of category  stand in the program, to be used as identifier
 * @property {AliasString|null}   parent_alias - The alias of parent of this category.
 * @property {AliasString[]}      child_alias_list  - The aliases of children of this category.
 * */
export interface CategoryInfo{
    name         :string;
    alias        :AliasString;
    description  :string;
    parent_alias :AliasString|null;
    child_alias_list :AliasString[];
}
/**
 * A posts.
 * @typedef {Object} PostsInfoWithoutContent
 * @property {number}          id  - The identifier of posts.
 * @property {string}          title
 * @property {string}          description
 * @property {string}          md_content - The content text of posts, using Markdown language.
 * @property {AliasString[]}      tag_list
 * @property {AliasString[]} category_list
 * @property {Date}            update_time
 * @property {Date}            create_time
 * */
export interface PostsInfo{
    id             :number;
    alias         ?:AliasString
    title          :string;
    description   ?:string;
    cover         ?:string;
    state          :PostsStatus;
    tag_list       :TagInfo['alias'][];
    category_list  :CategoryInfo['alias'][];
    update_time    :ResponseDate;
    create_time    :ResponseDate;
    comment_count  :number;
    comment_list   :PostsComment[];
    md_content     :string;
}
export interface PostsComment extends Pick<CommentInfo,'id'|'date'|'md_content'>{
    author_id       :UserInfo['id'];
    author_nickname :UserInfo['nickname'];
    comment_list    :Omit<PostsComment,'comment_list'>[];
}

export const enum PostsStatus{
    Publish=0,
    Private=1,
    Trash=2,
}
/**
 * One user.
 */
export interface UserInfo{
    id      :number;
    origin  :string;//OAuth ID
    open_id :string;
    nickname:string;
    mail   ?:string;
    avatar  :string;
    create_date:ResponseDate;
}
/**
 * One comment.
 * */
export interface CommentInfo{
    id         :number;
    date       :ResponseDate;
    posts_id   :PostsInfo['id'];
    author     :UserInfo['id'];
    md_content :string;
    reply_to  ?:CommentInfo['id'];
    deleted   ?:boolean;
}


// single types

/**
 * @typedef {string} AliasString
 * Conform to /^\w+$/
 * */
export type AliasString  =string;
export type ResponseDate =string;

// utils

export type ToString<T> =string;
export type IndexMap<K extends string ,V> ={
    [key in K] :V;
};
export type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];
export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;




