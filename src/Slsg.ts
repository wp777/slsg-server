import { exec } from "child_process";
import * as fs from "fs";
import * as nodePath from "path";
import { ComputeError } from "./validation";
import { MaxExecutionTimeExceededError } from "./validation/MaxExecutionTimeExceededError";

const slsgsatPath = "../../slsg/build/slsgsat";

export class Slsg {
    
    static async run(data: { modelStr: string}): Promise<string> {
        if (data.modelStr.length > 1 * 1024 * 1024) {
            throw new Error("Model is too large.");
        }
        const fileName = `${Math.random().toString(36).substr(2)}.txt`;
        fs.writeFileSync(fileName, data.modelStr);
        let resultStr: string = "";
        
        try {
            const filePath = nodePath.resolve(fileName);
            const slsgPath = nodePath.resolve(slsgsatPath);
            
            const cmd = `${slsgPath} -gui \
                -no-pdf \
                -verb=0 \
                -witness \
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
                            reject(new ComputeError(err.message));
                        }
                        else if (!res || res.length === 0) {
                            reject(timedOut ? new MaxExecutionTimeExceededError() : new ComputeError("No response from the compute module"));
                        }
                        else if (res.length === 1) {
                            resolve(res[0] as string);
                        }
                        else {
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
            resultStr = `${e};`
        }
        try {
            fs.unlinkSync(fileName);
        }
        catch (e) {
            console.error(e);
        }
        return resultStr;
    }
    
}
