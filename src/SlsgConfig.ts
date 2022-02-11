import * as fs from "fs";

export interface ISlsgConfig {
    port: number;
    slsgsatPath: string;
    stvPath: string;
}

export const SlsgConfig: ISlsgConfig = JSON.parse(fs.readFileSync("slsg.json", "utf-8"));
