const { assert } = require('chai');
const React = require('react');

const { patch, inferTypes }  = require("../src/prop-type-tools.js");

const RP = React.PropTypes;

describe('propTypeTools', () => {
    before(() => {
        patch(React.PropTypes);
    });

    const assertSingleType = (propType, expected) => {
        const TestComponent = React.createClass({
            propTypes: {
                a: propType
            },
            render() {}
        });

        assert.deepEqual(inferTypes(TestComponent).a, expected);
    };

    const assertTypes = (propTypes, expected) => {
        const TestComponent = React.createClass({
            propTypes,
            render() {}
        });
        assert.deepEqual(inferTypes(TestComponent), expected);
    };

    const simpleTypes = ['array', 'bool', 'func', 'number', 'object',
                         'string', 'any', 'element', 'node'];

    simpleTypes.forEach(type => {
        it(`can infer type of React.PropTypes.${type}`, () => {
            assertSingleType(RP[type], {
                type: type,
                required: false
            });
        });

        it(`can infer type of React.PropTypes.${type}.isRequired`, () => {
            assertSingleType(RP[type].isRequired, {
                type: type,
                required: true
            });
        });
    });

    it('can infer type of React.PropTypes.shape(...)', () => {
        assertSingleType(RP.shape({a: RP.bool, b: RP.string}), {
            type: 'shape',
            required: false,
            args: [{
                a: {
                    type: 'bool',
                    required: false
                },
                b: {
                    type: 'string',
                    required: false
                }
            }]
        });
    });

    it('can infer type of React.PropTypes.shape(...).isRequired', () => {
        assertSingleType(RP.shape({
            a: RP.bool.isRequired,
            b: RP.string
        }).isRequired, {
            type: 'shape',
            required: true,
            args: [{
                a: {
                    type: 'bool',
                    required: true
                },
                b: {
                    type: 'string',
                    required: false
                }
            }]
        });
    });

    it('can infer type of React.PropTypes.arrayOf(...)', () => {
        assertSingleType(RP.arrayOf(RP.bool), {
            type: 'arrayOf',
            required: false,
            args: [{
                type: 'bool',
                required: false
            }]
        });
    });

    it('can infer type of React.PropTypes.arrayOf(...).isRequired', () => {
        assertSingleType(RP.arrayOf(RP.bool.isRequired).isRequired, {
            type: 'arrayOf',
            required: true,
            args: [{
                type: 'bool',
                required: true
            }]
        });
    });

    it('can infer type of React.PropTypes.objectOf(...)', () => {
        assertSingleType(RP.objectOf(RP.bool), {
            type: 'objectOf',
            required: false,
            args: [{
                type: 'bool',
                required: false
            }]
        });
    });

    it('can infer type of React.PropTypes.objectOf(...).isRequired', () => {
        assertSingleType(RP.objectOf(RP.bool.isRequired).isRequired, {
            type: 'objectOf',
            required: true,
            args: [{
                type: 'bool',
                required: true
            }]
        });
    });

    it('can infer type of React.PropTypes.instanceOf(...)', () => {
        const SomeClass = () => { this.x = 1; };

        assertSingleType(RP.instanceOf(SomeClass), {
            type: 'instanceOf',
            required: false,
            args: [SomeClass]
        });
    });

    it('can infer type of React.PropTypes.instanceOf(...).isRequired', () => {
        const SomeClass = () => { this.x = 1; };

        assertSingleType(RP.instanceOf(SomeClass).isRequired, {
            type: 'instanceOf',
            required: true,
            args: [SomeClass]
        });
    });

    it('can infer type of React.PropTypes.oneOf(...)', () => {
        assertSingleType(RP.oneOf(['a', 'b']), {
            type: 'oneOf',
            required: false,
            args: [['a', 'b']]
        });
    });

    it('can infer type of React.PropTypes.oneOf(...).isRequired', () => {
        assertSingleType(RP.oneOf(['a', 'b']).isRequired, {
            type: 'oneOf',
            required: true,
            args: [['a', 'b']]
        });
    });

    it('can infer type of React.PropTypes.oneOfType(...)', () => {
        assertSingleType(RP.oneOfType([RP.number, RP.bool]), {
            type: 'oneOfType',
            required: false,
            args: [[{
                type: 'number',
                required: false,
            }, {
                type: 'bool',
                required: false,
            }]]
        });
    });

    it('can infer type of React.PropTypes.oneOfType(...).isRequired', () => {
        assertSingleType(RP.oneOfType([
            RP.number.isRequired, RP.bool
        ]).isRequired, {
            type: 'oneOfType',
            required: true,
            args: [[{
                type: 'number',
                required: true,
            }, {
                type: 'bool',
                required: false,
            }]]
        });
    });

    it('returns types verbatim that it cannot figure out', () => {
        // PropTypes are simply functions, enabling people to write PropType
        // validators of their own. In case someone writes an entirely custom
        // one, we can't infer the type, but we at least want to avoid
        // crashing.
        const even = x => x % 2 === 0;
        assertSingleType(even, even);
    });

    it("can infer types of a component's propTypes property", () => {
        assertTypes({
            a: RP.number,
            b: RP.string
        }, {
            a: {
                type: 'number',
                required: false,
            },
            b: {
                type: 'string',
                required: false
            }
        });
    });
});
