/*eslint-disable react/forbid-prop-types*/

/**
 * Component for editing the props of a specific component instance.
 */

const React = require("react");

const SinglePropEditor = require("./single-prop-editor.jsx");

const RP = React.PropTypes;

const PropEditor = React.createClass({
    propTypes: {
        // The component class whose props are being edited
        component: RP.func.isRequired,

        // The current set of props to display for this fixture
        componentProps: RP.object.isRequired,

        // Cursor to the data this binds to in the fixtures.
        cursor: RP.arrayOf(RP.oneOfType([
            RP.string.isRequired,
            RP.number.isRequired,
        ]).isRequired).isRequired,

        // Invoked with new values of props as they change
        onChange: RP.func.isRequired,

        // The type of the prop to edit. This will match the return
        // type of inferTypesForComponent.
        types: RP.objectOf(SinglePropEditor.propTypes.type).isRequired,
    },

    render() {
        const {
            componentProps,
            onChange,
            cursor,
            types,
        } = this.props;

        return <div>
            {Object.keys(types).map(key => {
                return <SinglePropEditor
                    key={key}
                    name={key}
                    type={types[key]}
                    value={componentProps[key]}
                    onChange={onChange}
                    cursor={cursor.concat([key])}
                />;
            })}
        </div>;
    },
});

module.exports = PropEditor;
