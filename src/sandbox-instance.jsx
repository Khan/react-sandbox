/**
 * Stateless component to render a single instance of a component using fixture
 * data.
 */

const React = require("react");
const { StyleSheet, css } = require("aphrodite");

const PropEditor = require("./prop-editor.jsx");

const RP = React.PropTypes;

const SandboxInstance = React.createClass({
    propTypes: {
        // The Component class to render
        component: RP.func.isRequired,

        // The props for the component
        props: RP.object.isRequired,

        // The props taking function values to respond to by logging to the
        // console.
        callbacksToLog: RP.arrayOf(RP.string.isRequired).isRequired,

        // Called with the new prop values on update
        onFixtureUpdate: RP.func.isRequired,
    },

    render() {
        const {component, props, callbacksToLog, onFixtureUpdate} = this.props;

        const propsToPass = {...props};

        callbacksToLog.forEach(propToLog => {
            propsToPass[propToLog] = function() {
                console.log(propToLog, arguments);
            };
        });

        const Component = component;

        return <div className={css(styles.container)}>
            <div className={css(styles.propEditorWrapper)}>
                <PropEditor
                    component={Component}
                    componentProps={propsToPass}
                    onChange={onFixtureUpdate}
                />
            </div>
            <div className={css(styles.componentTableWrapper)}>
                <Component {...propsToPass} />
            </div>
        </div>;
    }
});

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        padding: '10px 0',
        borderTop: '1px dotted black',
    },
    propEditorWrapper: {
        width: 400,
        overflow: 'scroll',
        maxHeight: 400,
    },
    componentTableWrapper: {
        flexGrow: 1,
    },
});

module.exports = SandboxInstance;
