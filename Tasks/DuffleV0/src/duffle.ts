"use strict";

import tl = require('vsts-task-lib/task');
import path = require('path');
import * as duffleInstaller from "./duffleinstaller";
import * as kubernetesconfig from "./kubernetesconfig";
import * as dockerconfig from "./dockerconfig";

tl.setResourcePath(path.join(__dirname, '..' , 'task.json'));

async function run() {
    var dufflePath = await duffleInstaller.setupDuffle();
    await kubernetesconfig.setupKubeConfigFile();
    await dockerconfig.setupDockerConfigFile();
    
    try
    {
        var command = tl.getInput("command", true).toLowerCase();
        var commandImplementation = require("./dufflecommand");
        commandImplementation.run(dufflePath, command)
        .then(function success() {
            tl.setResult(tl.TaskResult.Succeeded, "");
        }, function failure(err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        })
        .done();
    } catch(err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run().then(()=>{
 // do nothing
}, (reason)=> {
     tl.setResult(tl.TaskResult.Failed, reason);
});