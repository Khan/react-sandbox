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


const _inferType = (propType) => {
    if (propType.__sandbox_meta != null) {
        const {type, required, args} = propType.__sandbox_meta;
        if (args != null) {
            return {
                type,
                required,
                args: args.map(_inferType)
            };
        } else {
            return {type, required};
        }
    } else if (Array.isArray(propType)) {
        return propType.map(_inferType);
    } else if (typeof propType === 'object') {
        const ret = {};
        Object.keys(propType).forEach(key => {
            ret[key] = _inferType(propType[key]);
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
const inferTypes = (Component) => {
    const ret = {};

    const propTypes = Component.propTypes || {};

    Object.keys(propTypes).forEach(propName => {
        ret[propName] = _inferType(propTypes[propName]);
    });

    return ret;
};

module.exports = {
    patch,
    inferTypes
};
