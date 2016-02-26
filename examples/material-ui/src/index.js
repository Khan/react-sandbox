const React = require('react');
const ReactDOM = require('react-dom');
const ReactSandbox = require('react-sandbox');

const COMPONENTS = {
    AutoComplete: () => require('material-ui/lib/auto-complete'),
    FlatButton: () => require('material-ui/lib/flat-button'),
    RaisedButton: () => require('material-ui/lib/raised-button'),
    FloatingActionButton: () => require('material-ui/lib/floating-action-button'),
    CircularProgress: () => require('material-ui/lib/circular-progress'),
    LinearProgress: () => require('material-ui/lib/linear-progress'),
    RefreshIndicator: () => require('material-ui/lib/refresh-indicator'),
    SelectField: () => require('material-ui/lib/select-field'),
    Slider: () => require('material-ui/lib/slider'),
    Checkbox: () => require('material-ui/lib/checkbox'),
    TextField: () => require('material-ui/lib/text-field'),
    DatePicker: () => require('material-ui/lib/date-picker'),
    TimePicker: () => require('material-ui/lib/time-picker'),
};

const getComponentList = () => {
    return Promise.resolve(Object.keys(COMPONENTS).map(key => [key, key]));
};

const getComponentReference = (key) => {
    return Promise.resolve(COMPONENTS[key]());
};

const getFixtureListReference = () => {
    // TODO(jlfwong): Yank this out of the Material UI repository somehow.
    return Promise.resolve({instances: []});
};

ReactDOM.render(<ReactSandbox
    getComponentList={getComponentList}
    getComponentReference={getComponentReference}
    getFixtureListReference={getFixtureListReference}
/>, document.getElementById('root'));
