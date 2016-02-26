const isPlainObject = require('lodash.isplainobject');

// TODO(jlfwong): Tests
const serializeToJS = (val) => {
    const indent = x => x.replace(/^/gm, '    ');

    if (typeof val === 'undefined') {
        return 'undefined';
    }
    if (val == null) {
        return 'null';
    }
    if (Array.isArray(val)) {
        const children = val.map(serializeToJS);
        if (children.length === 0) {
            return '[]';
        }
        return (
            '[\n' +
                indent(children.join(',\n')) +
            '\n]'
        );
    }
    if (typeof val === 'object') {
        if (!isPlainObject(val)) {
            return '<<custom object>>';
        }

        const childKeys = Object.keys(val).filter(
                                k => typeof val[k] !== 'undefined');
        if (childKeys.length === 0) {
            return '{}';
        }
        return (
            '{\n' +
                indent(childKeys.map(k => {
                    // TODO(jlfwong): Escape key? Mehhh
                    return `"${k}": ${serializeToJS(val[k])}`;
                }).join(',\n')) +
            '\n}'
        );
    }
    if (typeof val === 'function') {
        return val.toString();
    }
    // Fallback to JSON serialization. This covers primitives like numbers,
    // string, and booleans
    return JSON.stringify(val);
};

module.exports = serializeToJS;
