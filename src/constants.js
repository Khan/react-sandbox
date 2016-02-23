/**
 * Redux constants used by the sandbox.
 */

// Automatically make SANDBOX. prefixed string constants out of an object of
// names.
function makeConstants(obj) {
    const constants = {};

    Object.keys(obj).forEach(k => {
        constants[k] = `SANDBOX.${k}`;
    });

    return constants;
}

module.exports = makeConstants({
    COMPONENT_LIST_WILL_LOAD: null,
    COMPONENT_LIST_DID_LOAD: null,
    COMPONENT_SELECTED: null,
    COMPONENT_REFERENCE_DID_LOAD: null,
    FIXTURES_DID_LOAD: null,
    UPDATE_FIXTURE: null,
});
