const { closePage, newPage } = require('../src/browser_utils');

async function run(config) {
    const page = await newPage({ ...config, forward_console: true });
    await page.evaluate(() => {
        function foo() {
            console.log([
                [123, new Error('foo')],
                {
                    foo: {
                        bar: {
                            bob: {
                                boof: {
                                    baz: {
                                        sha: {
                                            fasd: {
                                                asd: 123,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                null,
                undefined,
                'foo',
                new Error('fail'),
            ]);

            console.log([{ foo: null }]);

            // Circular
            const a = { foo: null };
            a.foo = a;
            console.log(a);

            console.log(new Set([1, 2, { foo: 123 }]));
            console.log(
                new Map([
                    [{ foo: 123 }, [1, 2]],
                    [{ foo: 123 }, [1, 2]],
                ])
            );

            console.log(() => null);
            console.log(function foo() {});
            console.log(class Foo {});

            console.log('foo');
            console.log([1, 2]);

            console.trace();
            console.trace('bar');

            const map = new Map();
            map.set('map', map);
            console.log(map);

            const set = new Set();
            set.add(set);
            console.log(set);
        }
        foo();
    });

    await page.goto('https://example.com');
    await page.evaluate(() => console.log('Log from Example'));

    await closePage(page);
}

module.exports = {
    description: 'Test console forwarding',
    resources: [],
    skip: () => true,
    run,
};
