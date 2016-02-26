/*eslint-disable no-fallthrough, no-console*/

/**
 * Redux store containing state for the sandbox.
 */

const { combineReducers, applyMiddleware, createStore } = require("redux");
const thunkMiddleware = require("redux-thunk");
const icepick = require("icepick");

const { inferTypesForComponent } = require("./prop-type-tools.js");
const constants = require("./constants.js");

// TODO(jlfwong): Tests

const componentList = (state = null, action) => {
    switch (action.type) {
        case constants.COMPONENT_LIST_WILL_LOAD:
            return null;

        case constants.COMPONENT_LIST_DID_LOAD:
            return action.components;
    }
    return state;
};

const selectedComponent = (state = null, action) => {
    switch (action.type) {
        case constants.COMPONENT_SELECTED:
            return {
                ...state,
                key: action.key,
                reference: null,
                fixtures: null,
                types: null,
            };

        case constants.COMPONENT_REFERENCE_DID_LOAD:
            // If a component reference was loaded but we've since switched to
            // a different component, ignore the load.
            if (action.key === state.key) {
                return {
                    ...state,
                    reference: action.reference,
                    types: inferTypesForComponent(action.reference),
                };
            }

        case constants.FIXTURES_DID_LOAD:
            // If fixtures were loaded but we've since switched to
            // a different component, ignore the load.
            if (action.key === state.key) {
                return {
                    ...state,
                    fixtures: action.fixtures,
                };
            }

        case constants.UPDATE_FIXTURE:
            const {cursor, newValue} = action;

            return {
                ...state,
                fixtures: {
                    ...state.fixtures,
                    instances: icepick.assocIn(state.fixtures.instances,
                                               cursor,
                                               // If the value is null, we'll
                                               // set undefined to remove the
                                               // field altogether
                                               newValue == null ?
                                                    undefined :
                                                    newValue),
                },
            };

        case constants.ADD_FIXTURE:
            const {props} = action;

            return {
                ...state,
                fixtures: {
                    ...state.fixtures,
                    instances: state.fixtures.instances.concat([props]),
                },
            };
    }
    return state;
};

// From http://redux.js.org/docs/api/applyMiddleware.html
function logger({ getState }) {
    return (next) => (action) => {
        console.log('will dispatch', action);

        // Call the next dispatch method in the middleware chain.
        const returnValue = next(action);

        console.log('state after dispatch', getState());

        // This will likely be the action itself, unless
        // a middleware further in chain changed it.
        return returnValue;
    };
}

const store = combineReducers({
    componentList,
    selectedComponent,
});

const createSandboxStore = (includerLogger = true) => {
    const middleware = (includerLogger ?
                            [thunkMiddleware, logger] :
                            [thunkMiddleware]);
    return applyMiddleware(...middleware)(createStore)(store);
};

module.exports = createSandboxStore;
