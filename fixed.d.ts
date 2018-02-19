import {Response} from "express";
import {ApiResponse} from "./types";


declare module "express" {
    export interface Response{
        json(json:ApiResponse):Response;
    }
}

