const { assert } = require('chai');

const PureRenderMixinWithCursor = require("../src/pure-render-mixin-with-cursor.js");

describe('PureRenderMixinWithCursor.shouldComponentUpdate', () => {
    const test = (cur, next) => {
        return PureRenderMixinWithCursor.shouldComponentUpdate.apply(cur, [
            next.props,
            next.state,
        ]);
    };

    const assertWillUpdate = (cur, next) => {
        assert.isTrue(test(cur, next));
    };

    const assertWillNotUpdate = (cur, next) => {
        assert.isFalse(test(cur, next));
    };

    it('returns true if props change shallowly', () => {
        assertWillUpdate({
            props: {a: 1},
            state: {},
        }, {
            props: {a: 2},
            state: {},
        });
    });

    it('returns false if props remain constant', () => {
        assertWillNotUpdate({
            props: {a: 1},
            state: {},
        }, {
            props: {a: 1},
            state: {},
        });
    });

    it('returns true if props state changes shallowly', () => {
        assertWillUpdate({
            props: {},
            state: {b: 1},
        }, {
            props: {},
            state: {b: 2},
        });
    });

    it('returns false if props state remain constant', () => {
        assertWillNotUpdate({
            props: {},
            state: {b: 1},
        }, {
            props: {},
            state: {b: 1},
        });
    });

    it('returns true if cursor changes deeply', () => {
        assertWillUpdate({
            props: {cursor: ['a']},
            state: {},
        }, {
            props: {cursor: ['a', 1]},
            state: {},
        });
    });

    it('returns false if cursor remains constant', () => {
        assertWillNotUpdate({
            props: {cursor: ['a']},
            state: {},
        }, {
            props: {cursor: ['a']},
            state: {},
        });
    });

});
