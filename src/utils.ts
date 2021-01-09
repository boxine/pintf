import { strict as assert } from 'assert';
import { TaskConfig } from './runner';

function makeEmailAddress(config: TaskConfig, suffix: string) {
    assert(config.email, 'Missing `email` key in pentf configuration');
    const [account, domain] = config.email!.split('@');
    return account + '+' + suffix + '@' + domain;
}

/**
 * Generate a random email address.
 *
 * @param {*} config The pentf configuration object. `config.email` needs to be set.
 * @param {string?} prefix Text to put before the random characters.
                           If no prefix is specified, the test name is used if available.
 * @returns {string} If `config.email` is `'foo@bar.com'`, something like `foo+prefix129ad12@bar.com`
 */
export function makeRandomEmail(config: TaskConfig, prefix?: string) {
    if (prefix === undefined) {
        prefix = config._testName || '';
    }
    return makeEmailAddress(config, prefix + Math.random().toString(36).slice(2));
}

/**
 * Returns a promise that resolves after the specified time. This should be used sparingly and mostly for debugging tests.
 *
 * @example
 * ```javascript
 * await wait(10000); // wait for 10s
 * ```
 * @param {number} ms Number of milliseconds to wait.
 */
export async function wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<R>(func: () => R, waitTimes: number[]): Promise<R> {
    for (const w of waitTimes) {
        const res = await func();
        if (res) return res;
        await wait(w);
    }
    return await func();
}

export function randomHex() {
    return [
        '0', '1', '2', '3', '4', '5', '6', '7',
        '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 16)];
}

/**
 * Generate a random hex string.
 *
 * @param {number} len Length of the hex string.
 * @return string A random hex string, e.g. `A812F0D91`
 */
export function randomHexstring(len: number) {
    let res = '';
    while (len-- > 0) {
        res += randomHex();
    }
    return res;
}

export function regexEscape(s: string) {
    // From https://stackoverflow.com/a/3561711/35070
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * @param {string} s
 * @returns {boolean} 
 */
export function isValidRegex(s: string) {
    try {
        new RegExp(s);
        return true;
    } catch (err) {
        return false;
    }
}

export function* range(count: number) {
    for (let i = 0;i < count;i++) {
        yield i;
    }
}

/**
 * Range as array
 * @param {number} count
 */
export function arange(count: number) {
    return Array.from(range(count));
}

export function count<T>(ar: T[], filter: (item: T) => boolean) {
    let res = 0;
    for (var el of ar) {
        if (filter(el)) res++;
    }
    return res;
}

/**
 * @template T
 * @param {T} obj
 * @param {Array<keyof T>} keys
 */
export function pluck<T, K extends keyof T>(obj: T, keys: K[]): Record<K, T[K]> {
    const res: any = {};
    for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
            res[k] = obj[k];
        }
    }
    return res;
}

// Remove the element for which callback returns true from the array.
export function remove<T>(array: T[], callback: (item: T) => boolean) {
    for (let i = 0;i < array.length;i++) {
        if (callback(array[i])) {
            array.splice(i, 1);
            return;
        }
    }
    throw new Error('Did not remove anything');
}

export function filterMap<T, R>(ar: T[], cb: (item: T, i: number) => R | undefined): R[] {
    const res = [];
    for (let i = 0;i < ar.length;i++) {
        const mapped = cb(ar[i], i);
        if (mapped) {
            res.push(mapped);
        }
    }
    return res;
}

const _pad = (num: number) => ('' + num).padStart(2, '0');

export function timezoneOffsetString(offset?: number) {
    if (!offset) return 'Z';

    const sign = (offset < 0) ? '+' : '-';
    offset = Math.abs(offset);
    const minutes = offset % 60;
    const hours = (offset - minutes) / 60;
    return sign + _pad(hours) + ':' + _pad(minutes);
}

export function localIso8601(date?: Date) {
    if (!date) date = new Date();

    // Adapted from: https://stackoverflow.com/a/8563517/35070
    return (
        date.getFullYear()
        + '-' + _pad(date.getMonth() + 1)
        + '-' + _pad(date.getDate())
        + 'T' + _pad(date.getHours())
        + ':' + _pad(date.getMinutes())
        + ':' + _pad(date.getSeconds())
        + '.' + String((date.getMilliseconds() / 1000).toFixed(3)).slice(2, 5)
        + timezoneOffsetString(date.getTimezoneOffset())
    );
}

export const assertEventually: typeof import('./assert_utils').assertEventually = (...args) => {
    // Deprecated here; will warn in the future, and eventually be removed
    const assert_utils = require('./assert_utils');
    if (process.env.PENTF_FUTURE_DEPRECATIONS) {
        // eslint-disable-next-line no-console
        console.log(); // new line (we can't call output.log here)
        // eslint-disable-next-line no-console
        console.trace('utils.assertEventually has been moved to assert_utils');
    }
    return assert_utils.assertEventually(...args);
}

export const assertAsyncEventually: typeof import('./assert_utils').assertEventually = (...args) => {
    // Deprecated here; will warn in the future, and eventually be removed
    const assert_utils = require('./assert_utils');
    if (process.env.PENTF_FUTURE_DEPRECATIONS) {
        // eslint-disable-next-line no-console
        console.log(); // new line (we can't call output.log here)
        // eslint-disable-next-line no-console
        console.trace('utils.assertAsyncEventually has been moved to assert_utils');
    }
    return assert_utils.assertAsyncEventually(...args);
}

export const assertAlways: typeof import('./assert_utils').assertAlways = (...args) => {
    // Deprecated here; will warn in the future, and eventually be removed
    const assert_utils = require('./assert_utils');
    if (process.env.PENTF_FUTURE_DEPRECATIONS) {
        // eslint-disable-next-line no-console
        console.log(); // new line (we can't call output.log here)
        // eslint-disable-next-line no-console
        console.trace('utils.assertAlways has been moved to assert_utils');
    }
    return assert_utils.assertAlways(...args);
}

export function cmp(a: any, b: any) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    } else {
        return 0;
    }
}

export function cmpKey(key: string) {
    return function(x: Record<string, any>, y: Record<string, any>) {
        return cmp(x[key], y[key]);
    };
}

/**
 * Delete n characters at a specific position in a string
 */
export function removeAt(input: string, idx: number, count: number) {
    if (idx >= 0 && input.length <= 1) return '';
    if (idx < 0) return input;
    if (idx > input.length - 1) return input.substr(0, idx);
    return input.substr(0, idx) + input.substr(idx + count);
}
