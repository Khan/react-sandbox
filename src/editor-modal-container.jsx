const { connect } = require("react-redux");
const icepick = require("icepick");

const EditorModal = require("./editor-modal.jsx");
const actions = require("./actions.js");

/**
 * Connects EditorModal to the redux store.
 */

const mapStateToProps = (state) => {
    return {
        cursor: state.modalEditorCursor,
        initialValue: icepick.getIn(
            state.selectedComponent,
            ['fixtures', 'instances'].concat(state.modalEditorCursor))
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        onSave: (...args) => {
            dispatch(actions.updateFixture(...args));
        },
        onClose: () => {
            dispatch(actions.closeModal());
        },
    };
};

module.exports = connect(
    mapStateToProps,
    mapDispatchToProps
)(EditorModal);
