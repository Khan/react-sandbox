/**
 * Component to render a single instance of a component using fixture data.
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

    getInitialState() {
        return {
            content: null
        }
    },

    renderComponent({component, props, callbacksToLog}) {
        // We render and update the component to view in an async manner
        // to avoid the unfortunate situation where the props in the editor are
        // invalid, causing the component rendering the crash, causing the prop
        // editor to stop updating, making it very difficult to remedy our
        // mistake!
        //
        // TODO(jlfwong): If/when this gets upgraded to React v0.15.0, we can
        // use error boundaries to get around this problem. See
        // https://github.com/facebook/react/issues/2461
        const propsToPass = {...props};

        callbacksToLog.forEach(propToLog => {
            propsToPass[propToLog] = function() {
                console.log(propToLog, arguments);
            };
        });

        const Component = component;

        setTimeout(() => {
            if (!this.isMounted()) {
                return;
            }
            try {
                this.setState({
                    content: <Component {...propsToPass} />
                });
            } catch(e) {
                this.setState({
                    content: <pre className={css(styles.errorBox)}>
                        {e.stack}
                    </pre>
                });

                // Rethrow error to make inspecting in the console easier.
                throw e;
            }
        }, 0);
    },

    componentWillReceiveProps(nextProps) {
        this.renderComponent(nextProps);
    },

    componentDidMount() {
        this.renderComponent(this.props);
    },

    render() {
        const {component, props, onFixtureUpdate} = this.props;
        const {content} = this.state;

        return <div className={css(styles.container)}>
            <div className={css(styles.propEditorWrapper)}>
                <PropEditor
                    component={component}
                    componentProps={props}
                    onChange={onFixtureUpdate}
                />
            </div>
            <div className={css(styles.componentTableWrapper)}>
                {content}
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
        overflow: 'auto'
    },
    errorBox: {
        background: 'red',
        color: 'black',
        whiteSpace: 'pre',
        textAlign: 'left',
    }
});

module.exports = SandboxInstance;
