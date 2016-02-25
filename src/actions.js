/**
 * Redux actions used by sandbox.
 */

const constants = require("./constants.js");

/**
 * Load the list of all React components available for use in the sandbox.
 */
const loadComponentList = (getComponentList) => {
    return (dispatch, getState) => {
        dispatch({
            type: constants.COMPONENT_LIST_WILL_LOAD
        });

        getComponentList().then(components => {
            dispatch({
                type: constants.COMPONENT_LIST_DID_LOAD,
                components
            });
        });
    };
};

/**
 * Select a component to view in the sandbox.
 */
const selectComponent = (key,
                         getComponentReference,
                         getFixtureListReference) => {

    return (dispatch, getState) => {
        dispatch({
            type: constants.COMPONENT_SELECTED,
            key
        });

        getComponentReference(key).then(reference => {
            dispatch({
                type: constants.COMPONENT_REFERENCE_DID_LOAD,
                key,
                reference
            });
        });

        getFixtureListReference(key).then(fixtures => {
            dispatch({
                type: constants.FIXTURES_DID_LOAD,
                key,
                fixtures
            });
        });
    };
};

/**
 * Update the values of a fixture for the currently selected component.
 */
const updateFixture = (cursor, newValue) => {
    return {
        type: constants.UPDATE_FIXTURE,
        cursor,
        newValue,
    };
};

/**
 * Update the values of a fixture for the currently selected component.
 */
const addFixture = (props) => {
    return {
        type: constants.ADD_FIXTURE,
        props
    };
};

module.exports = {
    loadComponentList,
    selectComponent,
    updateFixture,
    addFixture
};
