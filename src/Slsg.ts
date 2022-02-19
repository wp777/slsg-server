import { exec } from "child_process";
import * as fs from "fs";
import * as nodePath from "path";
import { SlsgConfig } from "./SlsgConfig";
import { ComputeError } from "./validation";
import { MaxExecutionTimeExceededError } from "./validation/MaxExecutionTimeExceededError";

export class Slsg {
    
    static async run(data: { modelStr: string}): Promise<string> {
        if (data.modelStr.length > 1 * 1024 * 1024) {
            throw new Error("Model is too large.");
        }
        const fileName = `${Math.random().toString(36).substr(2)}.txt`;
        fs.writeFileSync(fileName, data.modelStr);
        let resultStr: string = "";
        let success: boolean = false;
        let errorObj: any = null;
        
        try {
            const filePath = nodePath.resolve(fileName);
            const slsgPath = nodePath.resolve(SlsgConfig.slsgsatPath);
            
            const cmd = `${slsgPath} \
                -no-pdf \
                -verb=0 \
                -witness \
                -stv-engine-path=${SlsgConfig.stvPath} \
                ${filePath}`;
            
            const maxExecutionTimeSeconds = 30;
            let timeoutId: NodeJS.Timeout | null = null;
            let timedOut: boolean = false;
            resultStr = await new Promise((resolve, reject) => {
                const proc = exec(
                    cmd,
                    {
                        cwd: nodePath.dirname(slsgPath),
                    },
                    (err, res) => {
                        res = typeof(res) === "string" ? res.split("#".repeat(100))[1] : "";
                        if (res) {
                            res = res.trim();
                        }
                        if (timeoutId !== null) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        if (err && !res) {
                            let msg = err.message;
                            if (typeof(msg) !== "string") {
                                msg = "unknown SLSG module error";
                            }
                            let cmdFailedPrefix = `Command failed: ${cmd}`;
                            if (msg.startsWith(cmdFailedPrefix)) {
                                msg = msg.substr(cmdFailedPrefix.length).trim();
                            }
                            if (msg.length > 1000) {
                                msg = msg.substr(0, 1000) + "...";
                            }
                            reject(new ComputeError(msg));
                        }
                        else if (!res || res.length === 0) {
                            reject(timedOut ? new MaxExecutionTimeExceededError() : new ComputeError("No response from the compute module"));
                        }
                        else if (res.length === 1) {
                            success = true;
                            resolve(res[0] as string);
                        }
                        else {
                            success = true;
                            resolve(res);
                        }
                    }
                );
                if (proc && maxExecutionTimeSeconds > 0) {
                    timeoutId = setTimeout(() => {
                        timedOut = true;
                        proc.kill("SIGKILL");
                    }, maxExecutionTimeSeconds * 1000);
                }
            });
            const obj = JSON.parse(resultStr);
            if (obj && obj.error) {
                throw new ComputeError(obj.error);
            }
        }
        catch (e) {
            console.error(e);
            errorObj = e;
        }
        try {
            fs.unlinkSync(fileName);
        }
        catch (e) {
            console.error(e);
        }
        if (!success) {
            throw errorObj ? errorObj : new ComputeError(resultStr);
        }
        return resultStr;
    }
    
}
