/*eslint no-console: "off"*/

const fs = require('fs');
const path = require('path');

const {readConfig, parseArgs} = require('./config');
const {readFile} = require('./utils');
const runner = require('./runner');
const render = require('./render');

function load_tests(args, tests_dir) {
    let test_names = (
        fs.readdirSync(tests_dir)
            .filter(n => n.endsWith('.js'))
            .map(n => n.substring(0, n.length - '.js'.length))
    );

    if (args.filter) {
        test_names = test_names.filter(n => new RegExp(args.filter).test(n));
    }

    return test_names.map(tn => {
        const tc = require(path.join(tests_dir, tn));
        tc.name = tn;
        return tc;
    });
}

// Available options:
// - defaultConfig: Function to call on the loaded configuration, to set/compute default values.
// - description: program description in the --help output
// - rootDir: Root directory (assume tests/ contains tests, config/ if exists contains config)
// - testsDir: Test directory
// - configDir: Configuration directory. false disables configuration.
async function real_main(options={}) {
    if (options.rootDir) {
        if (! options.testsDir) {
            options.testsDir = path.join(options.rootDir, 'tests');
        }
        if (! options.configDir) {
            const autoConfigDir = path.join(options.rootDir, 'config');
            if (fs.existsSync(autoConfigDir)) {
                options.configDir = autoConfigDir;
            }
        }
    }

    const args = parseArgs(options);
    const config = readConfig(options, args);
    if (options.defaultConfig) {
        options.defaultConfig(config);
    }
    const test_cases = load_tests(args, options.testsDir);
    config._testsDir = options.testsDir;
    if (options.rootDir) config._rootDir = options.rootDir;
    if (options.configDir) config._configDir = options.configDir;

    if (args.list) {
        for (const tc of test_cases) {
            console.log(tc.name + (tc.description ? ` (${tc.description})` : ''));
        }
        return;
    }

    if (args.print_config) {
        console.log(config);
        return;
    }

    let results;
    if (args.load_json) {
        const json_input = await readFile(args.load_json, {encoding: 'utf-8'});
        results = JSON.parse(json_input);
    } else {
        // Run tests
        const test_info = await runner.run(config, test_cases);
        if (!test_info) return;

        results = render.craftResults(config, test_info);
    }

    await render.doRender(config, results);

    const any_errors = results.tests.some(s => s.status === 'error');
    if (!config.keep_open && any_errors) {
        process.exit(config.exit_zero ? 0 : 3);
    }
}

function main(options) {
    (async () => {
        try {
            await real_main(options);
        } catch (e) {
            console.error(e.stack);
            process.exit(2);
        }
    })();
}

module.exports = {
    main,
};
