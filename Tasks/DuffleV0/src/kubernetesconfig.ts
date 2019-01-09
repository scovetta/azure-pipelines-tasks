"use strict";

import tl = require('vsts-task-lib/task');
import path = require('path');
import fs = require('fs');
import * as duffleInstaller from "./duffleinstaller";

// get kubeconfig file path
export async function setupKubeConfigFile() {
    var connectionType = tl.getInput("kubernetesConnectionType", false);
    if (connectionType && connectionType.toLowerCase() !== "none") {
       await getClusterType(connectionType).getKubeConfig().then((config) => {
            var configurationDirPath  = duffleInstaller.getConfigDirPath("kubernets_config");
            var configFilePath = path.join(configurationDirPath, "config.json");
            tl.debug(tl.loc("KubeConfigFilePath", configFilePath));
            fs.writeFileSync(configFilePath, config);
            process.env["KUBECONFIG"] = configFilePath;
        });
    }

    tl.debug("kubernetes configuration setup successfully.");
}

function getClusterType(connectionType: string): any {
    if (connectionType === "Azure Resource Manager") {
        return require("./clusters/armkubernetescluster")
    }
    
    return require("./clusters/generickubernetescluster")
}