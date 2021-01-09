import { strict as assert } from 'assert';
// @ts-ignore
import * as streamBuffers from 'stream-buffers';

async function stream2buf(stream: any) {
    return new Promise((resolve, reject) => {
        const write_stream = new streamBuffers.WritableStreamBuffer() as any;
        stream.pipe(write_stream);
        write_stream.on('finish', () => {
            resolve(write_stream.getContents());
        });
        write_stream.on('error', (e: any) => {
            reject(e);
        });
    });
}

function escape_shell(arg: string) {
    if (/^[-.a-zA-Z0-9_:/]+$/.test(arg)) {
        return arg;
    }

    return '\'' + arg.replace(/'/g, '\'"\'"\'') + '\'';
}

function add_binary_data(curl_command: string, data_b64: string) {
    return 'echo ' + escape_shell(data_b64) + ' | base64 -d | ' + curl_command + ' -d @-';
}

export async function makeCurlCommand(options: any, url: string) {
    let curl_command = 'curl';

    if (options.agent && (options.agent.options.rejectUnauthorized === false)) {
        curl_command += ' -k';
    }

    if (options.curl_include_headers) {
        curl_command += ' -i';
    }

    if (options.method && options.method !== 'GET') {
        if (options.method === 'HEAD') {
            curl_command += ' -I';
        } else {
            curl_command += ' -X ' + options.method;
        }
    }

    const headers = options.headers || {};
    for (const header_key in headers) {
        curl_command += ' -H ' + escape_shell(header_key + ': ' + headers[header_key]);
    }

    if (options.body) {
        // Avoids "100 Continue" answers by some webservers
        curl_command += ' -H ' + escape_shell('Expect:');

        if (typeof options.body.getBoundary === 'function') {
            options.body = await stream2buf(options.body);
            const body_b64 = options.body.toString('base64');
            curl_command = add_binary_data(curl_command, body_b64);
        } else if (Buffer.isBuffer(options.body)) {
            const body_b64 = options.body.toString('base64');
            curl_command = add_binary_data(curl_command, body_b64);
        } else if (/\0/.test(options.body)) {
            const body_b64 = Buffer.from(options.body).toString('base64');
            curl_command = add_binary_data(curl_command, body_b64);
        } else if (/^@/.test(options.body)) {
            curl_command += ' --data-raw ' + escape_shell(options.body);
        } else {
            curl_command += ' -d ' + escape_shell(options.body);
        }
    }
    assert(! /^-/.test(url));

    if (options.curl_extra_options) {
        curl_command += ' ' + options.curl_extra_options.map((ce: any) => escape_shell(ce)).join(' ');
    }

    curl_command += ' ' + escape_shell(url);

    return curl_command;
}
