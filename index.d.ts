
import {Agent} from "http";
declare global {
    namespace NodeJS {
        interface Global {
            HTTP_PROXY :Agent|undefined;
        }
    }
}


import {Response} from "express";
import {ApiResponse} from "@foxzilla/fireblog";
declare module "express" {
    export interface Response{
        json(json:ApiResponse):Response;
    }
}
