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
    if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = value;
    } else {
        input.value = value;
    }
    TestUtils.Simulate.change(input);
};

const {click} = TestUtils.Simulate;

describe('SinglePropEditor', () => {
    let onChangeSpy;

    beforeEach(() => {
        patch(React.PropTypes);

        global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
        global.window = document.defaultView;

        onChangeSpy = sinon.spy();
    });

    const assertValue = (expected) => {
        sinon.assert.calledWith(onChangeSpy, expected);
    };

    const assertChange = (input, value, expected) => {
        change(input, value);
        assertValue(expected);
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
        const component = render(RP.string.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello', 'hello')
    });

    it('can edit fields with React.PropTypes.element', () => {
        const component = render(RP.element.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello', 'hello')
    });

    it('can edit fields with React.PropTypes.node', () => {
        const component = render(RP.node.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello', 'hello')
    });

    it('can edit fields with React.PropTypes.bool', () => {
        const component = render(RP.bool.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, true, true)
    });

    it('can edit fields with React.PropTypes.oneOf', () => {
        const component = render(RP.oneOf(['a', 'b']));
        const input = findByTag(component, 'select');
        assertChange(input, 'a', 'a')
    });

    it('can edit fields within React.PropTypes.arrayOf(...)', () => {
        const component = render(RP.arrayOf(RP.string.isRequired).isRequired,
                                 ['a', 'b']);
        const inputs = scryByTag(component, 'input');
        assertChange(inputs[0], 'c', ['c', 'b']);
        assertChange(inputs[1], 'd', ['a', 'd']);
    });

    it('can add entries within React.PropTypes.arrayOf(...)', () => {
        const component = render(RP.arrayOf(RP.string.isRequired).isRequired,
                                 ['a', 'b']);
        const button = findByTag(component, 'button');
        click(button);
        assertValue(['a', 'b', null]);
    });

    it('can edit fields within React.PropTypes.shape(...)', () => {
        const component = render(RP.shape({
            'a': RP.string.isRequired,
            'b': RP.string.isRequired
        }).isRequired, {
            a: 'apple',
            b: 'banana',
        });
        const inputs = scryByTag(component, 'input');
        assertChange(inputs[0], 'apricot', {a: 'apricot', b: 'banana'});
        assertChange(inputs[1], 'blueberry', {a: 'apple', b: 'blueberry'});
    });

    // TODO(jlfwong): Enable *editing* these fields as JSON
    it('can view unknown field types', () => {
        // Just testing that this doesn't crash.
        render(() => true, 'hello');
    });

    it('can edit optional fields (ones without isRequired)', () => {
        const component = render(RP.string, 'hi');
        const button = findByTag(component, 'button');
        assert.ok(!button.disabled);
        click(button);
        assertValue(null);
    });

    it('can edit optional fields after null (ones without isRequired)', () => {
        const component = render(RP.string, null);
        const input = findByTag(component, 'input');
        const button = findByTag(component, 'button');
        assert.ok(button.disabled);
        assertChange(input, 'hello', 'hello');
    });
});
