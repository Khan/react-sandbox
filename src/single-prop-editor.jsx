/**
 * A component for editing the value of a single (possibly complex) prop of
 * a component.
 */

const React = require("react");
const ReactDOM = require("react-dom");
const { StyleSheet, css } = require("aphrodite");

const PureRenderMixinWithCursor = require("./pure-render-mixin-with-cursor.js");
const {
    valueSatisfiesType,
    generateRandomValueForType
} = require("./prop-type-tools.js");

const RP = React.PropTypes;

const debounce = (fn, wait) => {
    let timeout;
    return function(...args) {
        const later = () => {
            fn.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const DebouncedInput = React.createClass({
    getInitialState() {
        return {
            internalValue: this.props.value
        };
    },

    handleChange(ev) {
        const value = ev.target.value;
        this.setState({internalValue: value});
        this.debouncedOnChange(value);
    },

    componentWillMount() {
        this.debouncedOnChange = debounce(this.props.onChange, 100);
    },

    componentWillReceiveProps(nextProps) {
        // Only over-ride the internal value if the element is not focused.
        if (ReactDOM.findDOMNode(this) !== document.activeElement) {
            this.setState({
                internalValue: nextProps.value
            });
        }
    },

    render() {
        return <input
            {...this.props}
            onChange={this.handleChange}
            value={this.state.internalValue}
        />;
    }
});

const FIELD_RENDERERS = (() => {
    const string = ({value, cursor, onChange}) => {
        return <DebouncedInput
            className={css(styles.stringInput)}
            type="text"
            value={value}
            placeholder={value == null ? '(null)' : ''}
            onChange={(value) => onChange(cursor, value)}
        />;
    };

    const bool = ({value, cursor, onChange}) => {
        return <div>
            <input
                type="checkbox"
                checked={value}
                onChange={(ev) => onChange(cursor, ev.target.checked)}
            />
            {JSON.stringify(value)}
        </div>
    };

    const number = ({value, cursor, onChange}) => {
        return <input
            type="number"
            value={value}
            placeholder={value == null ? '(null)' : ''}
            onChange={
                (ev) => onChange(cursor, parseFloat(ev.target.value, 10))
            }
        />;
    };

    const oneOf = ({type, value, cursor, onChange}) => {
        return <select
            value={value}
            onChange={(ev) => onChange(cursor, ev.target.value)}
        >
            {type.args[0].map(option => {
                return <option key={option} value={option}>
                    {option}
                </option>
            })}
        </select>;
    };

    const arrayOf = ({name, value, cursor, type,
                      onChange, ancestorValid}) => {
        const arrayVal = value || [];

        return <div>
            {arrayVal.map((item, index) => {
                return <div
                    className={css(styles.nestedProp, styles.arrayItem)}
                    key={index}
                >
                    <button onClick={() => {
                        onChange(cursor,
                                 arrayVal.slice(0, index)
                                 .concat(arrayVal.slice(index + 1)))
                    }}>
                        x
                    </button>
                    <div className={css(styles.grow)}>
                        <SinglePropEditor
                            name={`${name}[${index}]`}
                            type={type.args[0]}
                            value={item}
                            onChange={onChange}
                            cursor={cursor.concat([index])}
                            ancestorValid={ancestorValid}
                        />
                    </div>
                </div>;
            })}
            <button
                key='add'
                onClick={() => {
                    const nextVal = generateRandomValueForType(type.args[0],
                                                               cursor);
                    onChange(cursor, arrayVal.concat([nextVal]));
                }}
            >
            Add item to {name}
            </button>
        </div>;
    };

    const shape = ({name, value, type, cursor, onChange, ancestorValid}) => {
        const shape = type.args[0];
        const objVal = value || {};
        return <div>
            {Object.keys(shape).map((childKey) => {
                return <div className={css(styles.nestedProp)} key={childKey}>
                    <SinglePropEditor
                        name={`${name}.${childKey}`}
                        type={shape[childKey]}
                        value={objVal[childKey]}
                        onChange={onChange}
                        cursor={cursor.concat([childKey])}
                        ancestorValid={ancestorValid}
                    />
                </div>;
            })}
        </div>;
    };

    const json = ({value, onChange}) => {
        return JSON.stringify(value);
    };

    const nullable = (inputType, props) => {
        const {onChange, value, cursor} = props;

        return <div className={css(styles.nullableField)}>
            <div className={css(styles.grow)}>
                {FIELD_RENDERERS[inputType](props)}
            </div>
            <button
                onClick={() => onChange(cursor, null)}
                disabled={value == null}
            >
                null
            </button>
        </div>;
    };

    return {
        string,
        node: string,
        element: string,
        bool,
        number,
        oneOf,
        arrayOf,
        shape,
        json,
        nullable
    };
})();

const SinglePropEditor = React.createClass({
    mixins: [PureRenderMixinWithCursor],

    propTypes: {
        // The type of the prop to edit. This will match the values of return
        // type of inferTypes.
        type: RP.oneOfType([
            RP.func.isRequired,
            RP.shape({
                type: RP.string.isRequired,
                required: RP.bool.isRequired,
                args: RP.array(RP.object.isRequired),
            }).isRequired
        ]).isRequired,

        // The name of the prop
        name: RP.string.isRequired,

        // Cursor to the data this binds to in the fixtures.
        cursor: RP.arrayOf(RP.oneOfType([
            RP.string.isRequired,
            RP.number.isRequired
        ]).isRequired).isRequired,

        // The current value of this prop.
        value: RP.any,

        onChange: RP.func.isRequired,

        // True if the parent prop editor has valid props. Defaults to false.
        // This default should only be used for the top-level props.
        ancestorValid: RP.bool.isRequired,
    },

    getDefaultProps() {
        return {
            ancestorValid: false
        };
    },

    render() {
        const {name, value, type, ancestorValid} = this.props;

        // TODO(jlfwong): Adding to objectOf
        // TODO(jlfwong): Drag to re-arrange in arrays

        const inputType = FIELD_RENDERERS[type.type] ? type.type : 'json';

        // The validity of this field is unimportant if one of the ancestors
        // validated. This allows us to ignore fields that are invalid when
        // a parent is null.
        const valid = ancestorValid || valueSatisfiesType(value, type);

        const props = {
            ...this.props,
            ancestorValid: valid
        };

        const fieldEditor = type.required ?
            FIELD_RENDERERS[inputType](props) :
            FIELD_RENDERERS.nullable(inputType, props);

        return <div className={css(styles.singleField,
                                   (!valid) && styles.invalidField)}>
            <span className={css(styles.nameLabel)}>
                {name}
            </span>
            {fieldEditor}
        </div>
    },
});

const styles = StyleSheet.create({
    singleField: {
        borderBottom: '1px dotted grey',
        position: 'relative',
        padding: '15px 0 5px 0',
        textAlign: 'left',
        background: 'white',
    },
    invalidField: {
        background: 'rgba(255, 0, 0, 0.4)'
    },
    nullableField: {
        display: 'flex',
        fontFamily: 'monospace',
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
    arrayItem: {
        display: 'flex',
        alignItems: 'flex-start'
    },
    grow: {
        flexGrow: 1
    },
    stringInput: {
        boxSizing: 'border-box',
        width: '95%',
    }
});

module.exports = SinglePropEditor;
