"use strict";

import tl = require('vsts-task-lib/task');
import path = require('path');
import fs = require('fs');
import * as toolLib from 'vsts-task-tool-lib/tool';
import * as os from "os";
import * as util from "util";
import { WebRequest, sendRequest } from "utility-common/restutilities";
import * as downloadutility from "utility-common/downloadutility";
const DuffleToolName = "duffle";
const DuffleLatestReleaseUrl = "https://api.github.com/repos/deislabs/Duffle/releases/latest";
const stableDuffleVersion = "0.1.0-ralpha.4+dramallamabuie";

export async function setupDuffle(): Promise<string> {
    // var configurationDirPath  = getConfigDirPath("duffle_config");
    // process.env["DUFFLE_HOME"] = configurationDirPath;

    var versionOrLocation = tl.getInput("versionOrLocation");
    if( versionOrLocation === "location") {
        var pathToDuffle = tl.getPathInput("specifyLocation", true, true);
        fs.chmodSync(pathToDuffle, "777");
        return pathToDuffle;
    }
   
    var version = tl.getInput("version", false) || stableDuffleVersion;
    var checkLatestDuffleVersion = tl.getBoolInput('checkLatest', false);
    if (checkLatestDuffleVersion) {
        version = await getStableDuffleVersion();
    }

    var dufflePath = await downloadDuffle(version);
    return dufflePath;
}

export function getConfigDirPath(type: string): string {
    var tmpDir = getTempDirectory();
    var configDir = path.join(tmpDir, type + Date.now());
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    return configDir;
}

async function downloadDuffle(version: string): Promise<string> {
    var cachedToolpath = toolLib.findLocalTool(DuffleToolName, version);
    if (!cachedToolpath) {
        try {
            var duffleDownloadPath = getDuffleInstallPath();
            var  downloadUrl = getDuffleDownloadURL(version);
            await downloadutility.download(downloadUrl, duffleDownloadPath, false, true);
            tl.debug("Download completed");
        } catch (exception) {
            throw new Error(tl.loc("DownloadDuffleFailed", getDuffleDownloadURL(version), exception));
        }  

        tl.debug("Setting cachefilepath");
        cachedToolpath = await toolLib.cacheFile(duffleDownloadPath, DuffleToolName + getExecutableExtention(), DuffleToolName, version);
    }

    var dufflePath = path.join(cachedToolpath, DuffleToolName + getExecutableExtention());
    tl.debug(`Reverse DNS name ${dufflePath}`);
    fs.chmod(dufflePath, "777");
    return dufflePath;
}

function getDuffleDownloadURL(version: string): string {
    switch (os.type()) {
        case 'Linux':
            return util.format("https://github.com/deislabs/duffle/releases/download/%s/duffle-linux-amd64", version);

        case 'Darwin':
            return util.format("https://github.com/deislabs/duffle/releases/download/%s/duffle-darwin-amd64", version);

        default:
        case 'Windows_NT':
            return util.format("https://github.com/deislabs/duffle/releases/download/%s/duffle-windows-amd64.exe", version);

    }
}

async function getStableDuffleVersion(): Promise<string> {
    var request = new WebRequest();
    request.uri = DuffleLatestReleaseUrl;
    request.method = "GET";

    try {
        var response = await sendRequest(request);
        return response.body["tag_name"];
    } catch (error) {
        tl.warning(tl.loc("DuffleLatestNotKnown", DuffleLatestReleaseUrl, error, stableDuffleVersion));
    }

    return stableDuffleVersion;
}

function getDuffleInstallPath(): string {
    var configDir = path.join(getTempDirectory(), "Duffle"+Date.now());
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    return path.join(configDir, DuffleToolName + getExecutableExtention());
}

function getTempDirectory(): string {
    return tl.getVariable('agent.tempDirectory') || os.tmpdir();
}

function getExecutableExtention(): string {
    if(os.type().match(/^Win/)){
        return ".exe";
    }

    return "";
}