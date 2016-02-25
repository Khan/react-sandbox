// Modified version of shallowEqual from
// https://github.com/gaearon/react-pure-render/blob/master/src/shallowEqual.js
// with added support for custom predicates for certain keys
const shallowEqual = (objA, objB, customEquality = {}) => {
    if (objA === objB) {
        return true;
    }

    if (typeof objA !== 'object' || objA === null ||
        typeof objB !== 'object' || objB === null) {

        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const bHasOwnProperty = hasOwnProperty.bind(objB);
    const cEqHasOwnProperty = hasOwnProperty.bind(customEquality);

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];

        if (!bHasOwnProperty(key)) {
            return false;
        }

        if (cEqHasOwnProperty(key)) {
            if (!customEquality[key](objA[key], objB[key])) {
                return false;
            }
        } else if (objA[key] !== objB[key]) {
            return false;
        }
    }

    return true;
};

/**
 * A mixin for only updating if props differ shallowly,
 * except for the cursor, which will be checked for deep equality.
 */
const PureRenderMixinWithCursor = {
    shouldComponentUpdate(nextProps, nextState) {
        const propsEqual = shallowEqual(this.props, nextProps, {
            cursor: (a, b) => a.join(',') === b.join(','),
        });

        if (!propsEqual) {
            return true;
        }

        if (!shallowEqual(this.state, nextState)) {
            return true;
        }

        return false;
    },
};

module.exports = PureRenderMixinWithCursor;
