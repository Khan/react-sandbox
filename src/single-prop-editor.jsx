
const React = require("react");
const { StyleSheet, css } = require("aphrodite");

const { inferTypes } = require("./prop-type-tools.js");

const RP = React.PropTypes;

const SinglePropEditor = React.createClass({
    propTypes: {
        // The type of the prop to edit. This will match the values of return
        // type of inferTypes.
        type: RP.shape({
            type: RP.string.isRequired,
            required: RP.bool.isRequired,
            args: RP.array(RP.object.isRequired),
        }).isRequired,

        // The name of the prop
        name: RP.string.isRequired,

        // The current value of this prop.
        value: RP.any,

        onChange: RP.func.isRequired,
    },

    render() {
        const {name, value, type, onChange} = this.props;

        let content = "";

        // TODO(jlfwong): Editing
        // TODO(jlfwong): Adding to lists
        // TODO(jlfwong): Adding to objectOf
        // TODO(jlfwong): Nullability
        // TODO(jlfwong): The rest of the proptypes
        // TODO(jlfwong): Drag to re-arrange in arrays

        if (type.type === "string") {
            content = <input
                className={css(styles.stringInput)}
                type="text"
                defaultValue={value}
                onChange={(ev) => onChange(ev.target.value)}
            />;
        } else if (type.type === "arrayOf") {
            const arrayVal = value || [];

            // TODO(jlfwong): Add ability to add or remove values
            content = arrayVal.map((item, index) => {
                return <div className={css(styles.nestedProp)}>
                    <SinglePropEditor
                        key={index}
                        name={`${name}[${index}]`}
                        type={type.args[0]}
                        value={item}
                        onChange={newVal => {
                            onChange(arrayVal.slice(0, index)
                                        .concat([newVal])
                                        .concat(arrayVal.slice(index + 1)));
                        }}
                    />
                </div>;
            }).concat([<button>Add to {name}</button>]);
        } else if (type.type === "shape") {
            const shape = type.args[0];
            const objVal = value || {};
            content = Object.keys(shape).map((childKey) => {
                return <div className={css(styles.nestedProp)}>
                    <SinglePropEditor
                        key={childKey}
                        name={`${name}.${childKey}`}
                        type={shape[childKey]}
                        value={objVal[childKey]}
                        onChange={newVal => {
                            onChange({
                                ...objVal,
                                [childKey]: newVal
                            });
                        }}
                    />
                </div>;
            });
        } else {
            content = JSON.stringify(value);
        }

        return <div className={css(styles.singleField)}>
            <span className={css(styles.nameLabel)}>
                {name}
            </span>
            {content}
        </div>
    },
});

const styles = StyleSheet.create({
    singleField: {
        borderBottom: '1px dotted grey',
        position: 'relative',
        padding: '15px 0 5px 0',
        textAlign: 'left',
    },
    nameLabel: {
        position: 'absolute',
        fontFamily: 'monospace',
        fontSize: 10,
        top: 0,
        left: 0,
    },
    nestedProp: {
        marginLeft: 10,
    },
    stringInput: {
        boxSizing: 'border-box',
        width: '95%',
    }
});

module.exports = SinglePropEditor;
