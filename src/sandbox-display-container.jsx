const { connect } = require("react-redux");

const SandboxDisplay = require("./sandbox-display.jsx");
const actions = require("./actions.js");

/**
 * Connects SandboxDisplay to the redux store.
 */

const mapStateToProps = (state) => {
    return {
        componentList: state.componentList,
        selectedComponent: state.selectedComponent,
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onComponentSelect: (key) => {
            dispatch(
                actions.selectComponent(
                    key,
                    ownProps.getComponentReference,
                    ownProps.getFixtureListReference));
        },

        onFixtureUpdate: (...args) => {
            dispatch(actions.updateFixture(...args));
        },

        onFixtureAdd: (...args) => {
            dispatch(actions.addFixture(...args));
        },

        onRequestEdit: (cursor) => {
            dispatch(actions.openModal(cursor));
        },
    };
};

module.exports = connect(
    mapStateToProps,
    mapDispatchToProps
)(SandboxDisplay);
