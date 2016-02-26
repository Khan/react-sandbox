const React = require("react");
const Modal = require("react-modal");
const { StyleSheet, css } = require("aphrodite");

const serializeToJS = require("./serialize-to-js.js");

const RP = React.PropTypes;

// TODO(jlfwong): Use this other places we need cursors
const cursorPropType = RP.arrayOf(RP.oneOfType([
    RP.string.isRequired,
    RP.number.isRequired
]).isRequired);

const EditorModal = React.createClass({
    propTypes: {
        // Cursor of data to edit. If omitted, the modal will not be displayed.
        cursor: cursorPropType,

        onSave: RP.func.isRequired,

        onClose: RP.func.isRequired,

        initialValue: RP.any,
    },

    handleSave() {
        const {cursor, onSave, onClose} = this.props;
        const value = this._textarea.value;

        try {
            // Wrap the value in parens before eval to force functions to be
            // treated as functions expressions instead of function
            // definitions.
            const newJsVal = eval(`(${value})`);
            onSave(cursor, newJsVal);
            onClose();
        } catch (e) {
            alert(e);

            // Rethrow for stack trace in console
            throw e;
        }
    },

    componentDidUpdate(prevProps) {
        if (!prevProps.cursor && this.props.cursor) {
            setTimeout(() => {
                this._textarea.select();
            }, 0);
        }
    },

    render() {
        const {cursor, onClose, initialValue} = this.props;

        return <Modal
            isOpen={!!cursor}
            onRequestClose={onClose}
        >
            <h1>Editing Field {cursor && cursor.join('.')}</h1>
            <div>
                The field below will be evaluated as a JavaScript expression
                when you hit save.
            </div>
            <textarea
                defaultValue={initialValue && serializeToJS(initialValue)}
                onChange={this.handleChange}
                className={css(styles.editorTextArea)}
                ref={(el) => {
                    this._textarea = el;
                }}
            />
            <button onClick={this.handleSave}>Save</button>
            <button onClick={onClose}>Cancel</button>
        </Modal>
    },
});

const styles = StyleSheet.create({
    editorTextArea: {
        display: 'block',
        width: '100%',
        height: 300,
    },
});

module.exports = EditorModal;
