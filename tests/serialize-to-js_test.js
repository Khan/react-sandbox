/*eslint-env node,mocha*/
const { assert } = require('chai');

const serializeToJS = require("../src/serialize-to-js.js");

describe('serializeToJS', () => {
    const check = (x, ...lines) => {
        assert.equal(serializeToJS(x), lines.join('\n'));
    };

    it('works for primitives', () => {
        check(1, '1');
        check(true, 'true');
        check('a', '"a"');
    });

    it('works for arrays', () => {
        check([], '[]');
        check([1,2,3],
            '[',
            '    1,',
            '    2,',
            '    3',
            ']');
    });

    it('works for plain object', () => {
        check({}, '{}');
        check({a: 1},
              '{',
              '    "a": 1',
              '}');
    });

    it('works for functions', () => {
        check(function(a){}, 'function (a) {}');
    });

    it('doesn\'t try to serialize objects with custom constructors', () => {
        var C = function(x) {
            this.x = x;
        };
        check(new C(1), '"<<object w/ custom constructor>>"');
    });
});
