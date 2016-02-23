const jsdom = require('jsdom');
const React = require('react');
const TestUtils = require('react-addons-test-utils');
const sinon = require('sinon');
const { assert } = require('chai');

const SinglePropEditor = require('../src/single-prop-editor.jsx');
const { patch, inferTypes } = require('../src/prop-type-tools.js');

const RP = React.PropTypes;

const findByTag = TestUtils.findRenderedDOMComponentWithTag;
const scryByTag = TestUtils.scryRenderedDOMComponentsWithTag;

const change = (input, value) => {
    input.value = value;
    TestUtils.Simulate.change(input);
};

describe('SinglePropEditor', () => {
    let onChangeSpy;

    beforeEach(() => {
        patch(React.PropTypes);

        global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
        global.window = document.defaultView;

        onChangeSpy = sinon.spy();
    });

    const assertChange = (input, value, expected) => {
        change(input, value);
        sinon.assert.calledWith(onChangeSpy, expected);
    };

    const render = (propType, value) => {
        const RelatedComponent = React.createClass({
            propTypes: {
                a: propType
            },
            render() {}
        });

        const type = inferTypes(RelatedComponent).a;

        return TestUtils.renderIntoDocument(<SinglePropEditor
            type={inferTypes(RelatedComponent).a}
            name='foo'
            onChange={onChangeSpy}
            value={value}
        />);
    };

    it('can edit fields with React.PropTypes.string', () => {
        const component = render(RP.string);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello', 'hello')
    });

    it('can edit fields within React.PropTypes.arrayOf(...)', () => {
        const component = render(RP.arrayOf(RP.string), ['a', 'b']);
        const inputs = scryByTag(component, 'input');
        assertChange(inputs[0], 'c', ['c', 'b']);
        assertChange(inputs[1], 'd', ['a', 'd']);
    });

    it('can edit fields within React.PropTypes.shape(...)', () => {
        const component = render(RP.shape({
            'a': RP.string,
            'b': RP.string
        }), {
            a: 'apple',
            b: 'banana',
        });
        const inputs = scryByTag(component, 'input');
        assertChange(inputs[0], 'apricot', {a: 'apricot', b: 'banana'});
        assertChange(inputs[1], 'blueberry', {a: 'apple', b: 'blueberry'});
    });
});
