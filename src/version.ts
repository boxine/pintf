import * as child_process from 'child_process';
import {promisify} from 'util';
import {EOL} from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from './config';

async function _cmd(cmd: string, args: string[], options: any) {
    return ((await (promisify(child_process.execFile)(cmd, args, options))).stdout as any).trim();
}

export async function testsVersion(config: Config) {
    try {
        const tagsOutput: string = await _cmd(
            'git', ['tag', '--points-at', 'HEAD'], {cwd: config.rootDir});
        const tags = tagsOutput.split(EOL).filter(line => line);
        const tagsRepr = (tags.length > 0) ? tags.join('/') + '/' : '';

        const gitVersion = await _cmd(
            'git', ['show', '--pretty=format:%h (%ai)', '--no-patch', 'HEAD'],
            {cwd: config.rootDir});
        const changesOutput: string = await _cmd('git', ['status', '--porcelain'], {cwd: config.rootDir});
        const changedFiles = (
            changesOutput.split(EOL)
                .filter(line => line)
                .map(line => line.trim().split(/\s+/, 2)[1]));
        const suffix = (changedFiles.length > 0) ? `+changes(${changedFiles.join(' ')})` : '';

        return tagsRepr + gitVersion + suffix;
    } catch(e) {
        // go on
    }

    // Are we in a CI pipeline? Use these values instead
    const {env} = process;
    if (env.CI_COMMIT_SHORT_SHA) {
        const name = (env.CI_COMMIT_TAG || env.CI_COMMIT_BRANCH || '').trim();
        return (name ? name + ' ' : '') + env.CI_COMMIT_SHORT_SHA.trim();
    }

    return 'unknown';
}

export function pentfVersion() {
    // Don't use inline synchronous `require()` here, because
    // that cannot be translated to ES Modules. For ES Modules
    // any inline `import()` call is asynchronous.
    // Work around that by invoking `fs.readFileSync()` instead.
    //
    // The variable __dirname is not present in ESM environments.
    // It will be replaced with a polyfill by our babel plugin.
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')).version;
}
