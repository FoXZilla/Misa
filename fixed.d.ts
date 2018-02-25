import {Response} from "express";
import {ApiResponse} from "@foxzilla/fireblog";


declare module "express" {
    export interface Response{
        json(json:ApiResponse):Response;
    }
}
