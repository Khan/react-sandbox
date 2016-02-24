/**
 * In order to reflect upon a components prop types, we need to patch them.
 *
 * This is necessary because, while React.PropTypes does validation, it does so
 * only as a function from input to a boolean. Trying to figure out from the
 * PropTypes what the full range of valid values is is much harder! So we
 * monkey patch it to retain information about the types.
 */

const patch = (PropTypes) => {
    if (PropTypes.__isPatchedBySandbox) return;

    Object.keys(PropTypes).forEach((key) => {
        const orig = PropTypes[key];

        // If the PropType has a .isRequired property it means that this prop
        // type is a validator function itself, like PropTypes.string. If not,
        // it means it's a validator function constructor, like PropTypes.shape
        // (PropTypes.shape({...}) becomes the validator function).
        if (orig.isRequired != null) {
            orig.__sandbox_meta = {
                type: key,
                required: false
            };
            orig.isRequired.__sandbox_meta = {
                type: key,
                required: true
            }
        } else {
            PropTypes[key] = (...args) => {
                const ret = orig(...args);
                ret.__sandbox_meta = {
                    type: key,
                    required: false,
                    args: args,
                };
                ret.isRequired.__sandbox_meta = {
                    type: key,
                    required: true,
                    args: args,
                };
                return ret;
            };
        }
    });

    PropTypes.__isPatchedBySandbox = true;
};

const inferType = (propType) => {
    if (propType.__sandbox_meta != null) {
        const {type, required, args} = propType.__sandbox_meta;
        if (args != null) {
            return {
                type,
                required,
                args: args.map(inferType),
                __propType: propType,
            };
        } else {
            return {
                type,
                required,
                __propType: propType,
            };
        }
    } else if (Array.isArray(propType)) {
        return propType.map(inferType);
    } else if (typeof propType === 'object') {
        const ret = {};
        Object.keys(propType).forEach(key => {
            ret[key] = inferType(propType[key]);
        });
        return ret;
    } else {
        return propType;
    }
};

/**
 * Given a refernece to a component, return a description of the proptypes it
 * expects.
 */
const inferTypesForComponent = (Component) => {
    const ret = {};

    const propTypes = Component.propTypes || {};

    Object.keys(propTypes).forEach(propName => {
        ret[propName] = inferType(propTypes[propName]);
    });

    return ret;
};

/**
 * Given a value and a type as returned by inferType, return true if the value
 * satisfies the type.
 */
const valueSatisfiesType = (value, inferredType) => {
    const propType = (typeof inferredType === 'function') ?
                            inferredType :
                            inferredType.__propType;

    const maybeError = propType({__ignored__: value},
                                '__ignored__', '__ignore__', 'prop');

    return !(maybeError instanceof Error);
};

module.exports = {
    patch,
    inferType,
    inferTypesForComponent,
    valueSatisfiesType,
};
