"use strict";

import tl = require('vsts-task-lib/task');
import path = require('path');
import AuthenticationTokenProvider  from "docker-common/registryauthenticationprovider/authenticationtokenprovider"
import ACRAuthenticationTokenProvider from "docker-common/registryauthenticationprovider/acrauthenticationtokenprovider"
import GenericAuthenticationTokenProvider from "docker-common/registryauthenticationprovider/genericauthenticationtokenprovider"
import RegistryServerAuthenticationToken from 'docker-common/registryauthenticationprovider/registryauthenticationtoken';
import * as fileutils from "docker-common/fileutils";
import * as duffleInstaller from "./duffleinstaller";

export function setupDockerConfigFile() {
    var registryType = tl.getInput("containerRegistryType", false);
    if (registryType && registryType.toLowerCase() !== "none") {
        var registryAuthenticationToken = getAuthenticationProvider(registryType);
        if (registryAuthenticationToken) {
            var registryAuth = {};

            registryAuth["username"] = registryAuthenticationToken.getUsername();
            registryAuth["password"] = registryAuthenticationToken.getPassword();
            registryAuth["registry"] = registryAuthenticationToken.getLoginServerUrl();

            if (registryAuth) {
                var configurationDirPath  = duffleInstaller.getConfigDirPath("docker_config");
                var json = registryAuthenticationToken.getDockerConfig();
                var configurationFilePath = path.join(configurationDirPath, "config.json");
                tl.debug(tl.loc("DockerConfigFilePath", configurationFilePath));
                if(fileutils.writeFileSync(configurationFilePath, json) == 0)
                {
                    tl.error(tl.loc('NoDataWrittenOnFile', configurationFilePath));
                    throw new Error(tl.loc('NoDataWrittenOnFile', configurationFilePath));
                }
                process.env["DOCKER_CONFIG"] = configurationDirPath;
            }
        }
    }
}

function getAuthenticationProvider(registryType: string): RegistryServerAuthenticationToken {
    var authenticationProvider : AuthenticationTokenProvider;
    if(registryType ==  "Azure Container Registry"){
        authenticationProvider = new ACRAuthenticationTokenProvider(tl.getInput("azureContainerSubscriptionEndpoint"), tl.getInput("azureContainerRegistry"));
    } 
    else {
        authenticationProvider = new GenericAuthenticationTokenProvider(tl.getInput("dockerRegistryEndpoint"));
    }

    return authenticationProvider.getAuthenticationToken();
}