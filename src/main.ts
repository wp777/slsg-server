import express from "express";
import bodyParser from "body-parser";
import http from "http";
import { Compute } from "./Compute";
import { Config } from "./Config";
import { UnknownError } from "./validation";
import { CustomError } from "./validation/CustomError";
import { Slsg } from "./Slsg";
import { SlsgConfig } from "./SlsgConfig";

const port = SlsgConfig.port;

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);

app.use("/", express.static("../slsg-web/dist/stv-web/"));

app.post("/compute", async (request, response) => {
    try {
        const result = await Compute.run(request.body);
        return response.json({
            status: "success",
            data: result,
        });
    }
    catch (error: any) {
        let errorString: string = "";
        if (typeof(error) === "string") {
            errorString = error;
        }
        else if (error instanceof CustomError) {
            errorString = error.toString();
        }
        else if (typeof(error.toString) === "function") {
            errorString = error.toString();
        }
        else {
            errorString = new UnknownError().toString();
        }
        if (errorString.startsWith("Error: ")) {
            errorString = errorString.substr("Error: ".length);
        }
        try {
            if (typeof(JSON.parse(errorString)) !== "object") {
                throw "not-an-object";
            }
        }
        catch {
            errorString = new UnknownError(errorString).toString();
        }
        return response.json({
            status: "error",
            error: errorString,
        });
    }
});

app.post("/slsg", async (request, response) => {
    try {
        const result = await Slsg.run(request.body);
        return response.json({
            status: "success",
            data: result,
        });
    }
    catch (error: any) {
        let errorString: string = "";
        if (typeof(error) === "string") {
            errorString = error;
        }
        else if (error instanceof CustomError) {
            errorString = error.toString();
        }
        else if (typeof(error.toString) === "function") {
            errorString = error.toString();
        }
        else {
            errorString = new UnknownError().toString();
        }
        if (errorString.startsWith("Error: ")) {
            errorString = errorString.substr("Error: ".length);
        }
        try {
            if (typeof(JSON.parse(errorString)) !== "object") {
                throw "not-an-object";
            }
        }
        catch {
            errorString = new UnknownError(errorString).toString();
        }
        return response.json({
            status: "error",
            error: errorString,
        });
    }
});

app.get("/computation-limits-config", async (request, response) => {
    return response.json({
        status: "success",
        data: JSON.stringify(Config),
    });
});

server.listen(port);
