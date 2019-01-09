"use strict";

import * as tr from "vsts-task-lib/toolrunner";
import * as tl from "vsts-task-lib/task";

export function run(dufflePath:string, command: string): any {
    var duffle = tl.tool(dufflePath);

    duffle.arg(command);
    duffle.line(getCommandArguments());
    return execCommand(duffle);
}

function getCommandArguments(): string {
    return tl.getInput("arguments", false);
}

function execCommand(command: tr.ToolRunner, options?: tr.IExecOptions) {
    var errlines = [];
    command.on("stderr", line => {
        errlines.push(line);
    });

    command.on("error", line => {
        errlines.push(line);
    });

    return command.exec(options).fail(error => {
        errlines.forEach(line => tl.error(line));
        throw error;
    });
}