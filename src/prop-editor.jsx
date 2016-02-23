/**
 * Component for editing the props of a specific component instance.
 */

const React = require("react");

const { inferTypes } = require("./prop-type-tools.js");
const SinglePropEditor = require("./single-prop-editor.jsx");

const RP = React.PropTypes;

const PropEditor = React.createClass({
    propTypes: {
        // The component class whose props are being edited
        component: RP.func.isRequired,

        // The current set of props to display for this fixture
        componentProps: RP.object.isRequired,

        // Invoked with new values of props as they change
        onChange: RP.func.isRequired
    },

    render() {
        const {component, componentProps, onChange} = this.props;

        // TODO(jlfwong): Move this into
        // javascript/react-sandbox-package/sandbox.jsx
        const types = inferTypes(component);

        return <div>
            {Object.keys(types).map(key => {
                return <SinglePropEditor
                    key={key}
                    name={key}
                    type={types[key]}
                    value={componentProps[key]}
                    onChange={(newVal) => {
                        onChange({
                            ...componentProps,
                            [key]: newVal
                        });
                    }}
                />
            })}
        </div>;
    }
});

module.exports = PropEditor;
