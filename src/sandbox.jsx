/**
 * Root component of the React Sandbox.
 */

// TODO(jlfwong):
//  - PropType introspection
//  - Prop editing
//  - Prop generation
//  - Autocomplete component selection
//  - Speed up JS package compilation...?
//  - Resizable prop editor
//  - Generate code
//  - Tests

const React = require("react");
const { Provider, connect } = require("react-redux");
const { StyleSheet, css } = require("aphrodite");

const PropTypeTools = require("./prop-type-tools.js");
const SandboxDisplay = require("./sandbox-display.jsx");
const actions = require("./actions.js");
const createSandboxStore = require("./create-sandbox-store.js");

const RP = React.PropTypes;

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
    };
};

const ConnectedSandboxDisplay = connect(
    mapStateToProps,
    mapDispatchToProps
)(SandboxDisplay);

const patchReactWithFakeErrorBoundaries = () => {
    // We patch React.createClass as a temporary work around for the
    // lack of error boundaries. When React 15 lands, we can delete this
    // and use real error boundaries.
    if (React.__patchedBySandboxForFakeErrorBoundaries) {
        return;
    }
    React.__patchedBySandboxForFakeErrorBoundaries = true;

    const origCreateClass = React.createClass;
    React.createClass = (...args) => {
        const clazz = origCreateClass(...args);

        const render = clazz.prototype.render;

        clazz.prototype.render = function() {
            try {
                return render.call(this);
            } catch(e) {
                return <pre className={css(styles.errorBox)}>
                    {e.stack}
                </pre>;
            }
        };

        return clazz;
    };

    const styles = StyleSheet.create({
        errorBox: {
            background: 'red',
            color: 'black',
            whiteSpace: 'pre',
            textAlign: 'left',
        },
    });
};


const Sandbox = React.createClass({
    propTypes: {
        // Returns a list of [label, key] pairs, one per component loadable in
        // the sandbox.
        //
        // "label" will be what you'd like to have displayed in the dropdown.
        // "key" will be passed to getComponentReference to load the associated
        // comopnent. Could be e.g. the path to the component. Will not be
        // displayed to the user.
        getComponentList: RP.func.isRequired,

        // Given a "key" as specified in getComponentList, return a promise
        // resolving to a JS reference to the React component constructor.
        //
        // Calling this should reload the file containing the definition of the
        // component. This allows the Sandbox to monkey patch React before
        // React.PropTypes is referenced in the React component definition.
        //
        // e.g. in webpack, this should be something roughly like:
        //
        //  delete require.cache[require.resolve(pathToComponent)];
        //  return require(pathToComponent);
        getComponentReference: RP.func.isRequired,

        // Given a "key" as specified in getComponentList, return a promise
        // resolving to a JS reference to a list of fixtures. See
        // SandboxDisplay.PropTypes for the structure of fixtures.
        getFixtureListReference: RP.func,

        // URL root of the React sandbox. If specified, will use client-side
        // routing to allow specifying the component to view. Should include
        // the leading slash but not a trailing slash, e.g. "/react-sandbox".
        urlRoot: RP.string,

        // saveFixtureList: RP.func,
    },

    componentWillMount() {
        const store = this.store = createSandboxStore();
        PropTypeTools.patch(RP);

        patchReactWithFakeErrorBoundaries();
    },

    componentDidMount() {
        const {
            getComponentList,
            getComponentReference,
            getFixtureListReference,
            urlRoot,
        } = this.props;

        this.store.dispatch(actions.loadComponentList(getComponentList));

        if (urlRoot) {
            // TODO(jlfwong): If this needs to get more complicated than this,
            // should probably pull in a real routing library.

            if (window.location.pathname.indexOf(urlRoot + "/") === 0) {
                const componentKey = window.location.pathname.substr(
                                            (urlRoot + "/").length);
                if (componentKey.length > 0) {
                    this.store.dispatch(
                        actions.selectComponent(
                            componentKey,
                            getComponentReference,
                            getFixtureListReference));
                }
            }

            // TODO(jlfwong): Deal with popstate, then switch the below to
            // pushState

            // Update the URL when the selected component changes
            this.store.subscribe(() => {
                const {selectedComponent} = this.store.getState();
                if (selectedComponent) {
                    window.history.replaceState({}, window.title,
                        urlRoot + "/" + selectedComponent.key);
                } else {
                    window.history.replaceState({}, window.title, urlRoot);
                }
            });
        }
    },

    render() {
        const {getComponentReference, getFixtureListReference} = this.props;

        return <Provider store={this.store}>
            <ConnectedSandboxDisplay
                getComponentReference={getComponentReference}
                getFixtureListReference={getFixtureListReference}
                generator={PropTypeTools.generateRandomValueForType}
            />
        </Provider>;
    },
});

module.exports = Sandbox;
