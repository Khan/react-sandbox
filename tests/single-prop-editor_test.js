/*eslint-env node,mocha*/
const jsdom = require('jsdom');
const React = require('react');
const TestUtils = require('react-addons-test-utils');
const sinon = require('sinon');
const { assert } = require('chai');

const SinglePropEditor = require('../src/single-prop-editor.jsx');
const { patch, inferType } = require('../src/prop-type-tools.js');

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

const HTML_TEXT = '<!doctype html><html><body></body></html>';

describe('SinglePropEditor', () => {
    let onChangeSpy;
    let clock;

    beforeEach(() => {
        patch(React.PropTypes);

        global.document = jsdom.jsdom(HTML_TEXT);
        global.window = document.defaultView;

        onChangeSpy = sinon.spy();

        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
    });

    const assertValue = (expected, cursor = []) => {
        sinon.assert.calledWith(onChangeSpy, cursor, expected);
    };

    const assertChange = (input, value, cursor = []) => {
        change(input, value);
        clock.tick(1000);  // Wait for any debounced-ness to finish up
        assertValue(value, cursor);
    };

    const render = (propType, value) => {
        return TestUtils.renderIntoDocument(<SinglePropEditor
            type={inferType(propType)}
            name='foo'
            cursor={[]}
            onChange={onChangeSpy}
            value={value}
        />);
    };

    it('can edit fields with React.PropTypes.string', () => {
        const component = render(RP.string.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello');
    });

    it('can edit fields with React.PropTypes.element', () => {
        const component = render(RP.element.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello');
    });

    it('can edit fields with React.PropTypes.node', () => {
        const component = render(RP.node.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, 'hello');
    });

    it('can edit fields with React.PropTypes.bool', () => {
        const component = render(RP.bool.isRequired);
        const input = findByTag(component, 'input');
        assertChange(input, true);
    });

    it('can edit fields with React.PropTypes.oneOf', () => {
        const component = render(RP.oneOf(['a', 'b']));
        const input = findByTag(component, 'select');
        assertChange(input, 'a');
    });

    it('can edit fields within React.PropTypes.arrayOf(...)', () => {
        const component = render(RP.arrayOf(RP.string.isRequired).isRequired,
                                 ['a', 'b']);
        const inputs = scryByTag(component, 'input');
        assertChange(inputs[0], 'c', [0]);
        assertChange(inputs[1], 'd', [1]);
    });

    it('can remove entries within React.PropTypes.arrayOf(...)', () => {
        const component = render(RP.arrayOf(RP.string.isRequired).isRequired,
                                 ['a', 'b']);
        const buttons = scryByTag(component, 'button');
        click(buttons[0]);
        assertValue(['b']);
    });

    it('can add entries within React.PropTypes.arrayOf(...)', () => {
        const component = render(RP.arrayOf(RP.string.isRequired).isRequired,
                                 ['a', 'b']);
        const buttons = scryByTag(component, 'button');
        click(buttons[buttons.length - 1]);

        assert.deepEqual(onChangeSpy.lastCall.args[1].length, 3);
        // For now, this is randomly generated, so we can't make sensible
        // assertions.
        // assertValue(['a', 'b', null]);
    });

    it('can edit fields within React.PropTypes.shape(...)', () => {
        const component = render(RP.shape({
            'a': RP.string.isRequired,
            'b': RP.string.isRequired,
        }).isRequired, {
            a: 'apple',
            b: 'banana',
        });
        const inputs = scryByTag(component, 'input');
        assertChange(inputs[0], 'apricot', ['a']);
        assertChange(inputs[1], 'blueberry', ['b']);
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
        assertChange(input, 'hello');
    });
});
