import { exec } from "child_process";
import * as fs from "fs";
import * as nodePath from "path";
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
        
        // return (`{"info": {"status": "SAT", "solvingTime": 0.000104912, "mcmasCheck": false},"models": [{ "label": "Agent 0",  "nodes": [ { "id": 0, "label": "0" }, { "id": 1, "label": "1" }], "links": [{ "id": 0, "source": 0, "target": 0, "label": "0" }, { "id": 3, "source": 1, "target": 1, "label": "1" }]}, { "label": "Agent 1",  "nodes": [ { "id": 0, "label": "0" }, { "id": 1, "label": "1" }], "links": [{ "id": 0, "source": 0, "target": 0, "label": "0" }, { "id": 3, "source": 1, "target": 1, "label": "1" }]}, { "label": "Global model",  "nodes": [ { "id": 0, "label": "[0, 0]", "props": [1] }, { "id": 1, "label": "[0, 1]", "props": [] }, { "id": 2, "label": "[1, 0]", "props": [] }, { "id": 3, "label": "[1, 1]", "props": [] }], "links": [{ "id": 0, "source": 0, "target": 0, "label": "[0, 0]", "props": [1] }, { "id": 5, "source": 1, "target": 1, "label": "[0, 1]" }, { "id": 10, "source": 2, "target": 2, "label": "[1, 0]" }, { "id": 15, "source": 3, "target": 3, "label": "[1, 1]" }]}]}`);
        
        try {
            const filePath = nodePath.resolve(fileName);
            const slsgPath = nodePath.resolve("../slsg/build/slsgsat");
            
            const cmd = `${slsgPath} -gui \
                -no-mcmas-engine \
                -mcmas-engine-path="./mcmas -v 1" \
                -mcmas-check \
                -mcmas-check-path="./mcmas -v 1" \
                -verb=0 \
                -witness \
                ${filePath}`;
            
            const maxExecutionTimeSeconds = 30;
            let timeoutId: NodeJS.Timeout | null = null;
            let timedOut: boolean = false;
            resultStr = await new Promise((resolve, reject) => {
                const proc = exec(
                    cmd,
                    (err, res) => {
                        res = typeof(res) === "string" ? res.split("#".repeat(100))[1] : "";
                        if (res) {
                            res = res.trim();
                        }
                        if (timeoutId !== null) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        if (err) {
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
            
        }
        catch {
        }
        fs.rmSync(fileName);
        return JSON.stringify({ resultStr });
    }
    
}