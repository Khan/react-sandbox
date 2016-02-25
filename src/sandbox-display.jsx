/**
 * Stateless component for displaying things in the react sandbox.
 */

const React = require("react");
const { StyleSheet, css } = require("aphrodite");

const SandboxInstance = require("./sandbox-instance.jsx");

const RP = React.PropTypes;

const emptyList = Object.freeze([]);

const generateProps = (types, valueGenerator) => {
    const ret = {};
    for (const key in types) {
        if (!types.hasOwnProperty(key)) {
            continue;
        }

        ret[key] = valueGenerator(types[key], [key]);
    }
    return ret;
};

const SandboxDisplay = React.createClass({
    propTypes: {
        // A list of [label, key] pairs, one per component loadable in the
        // sandbox.
        componentList: RP.arrayOf(RP.arrayOf(RP.string.isRequired).isRequired),

        selectedComponent: RP.shape({
            // A key identifying the currently selected component
            key: RP.string.isRequired,

            // A reference to the currently selected component
            reference: RP.func,

            // The inferred types of the props of the selected component
            types: RP.object,

            // A list of instances of props to pass to the component
            fixtures: RP.shape({
                instances: RP.arrayOf(RP.object.isRequired).isRequired,
                log: RP.arrayOf(RP.string.isRequired),
            }),
        }),

        // Called with the key of the component to select
        onComponentSelect: RP.func.isRequired,

        // Called with the index and prop values of the fixture to update.
        onFixtureUpdate: RP.func.isRequired,

        // Generator function returning a value given a type and name of the
        // prop.
        generator: RP.func.isRequired,
    },

    handleFixtureAdd() {
        const {selectedComponent, generator, onFixtureAdd} = this.props;

        onFixtureAdd(generateProps(selectedComponent.types, generator));
    },

    render() {
        // TODO(jlfwong): Adding entire new fixtures

        const {
            componentList,
            selectedComponent,
            onComponentSelect,
            onFixtureUpdate,
            onFixtureAdd,
            types,
        } = this.props;

        if (!componentList) {
            // TODO(jlfwong): Nicer loading indicator
            return <div>Loading...</div>;
        }

        // TODO(jlfwong): Refactor this into a getContent() method to leverage
        // early-returns
        let content = "";

        if (selectedComponent) {
            if (!selectedComponent.reference) {
                content = `Loading ${selectedComponent.key}...`;
            } else {
                const name = selectedComponent.reference.displayName;
                const {fixtures} = selectedComponent;

                if (fixtures == null) {
                    content = `Loading fixtures for ${name}...`;
                } else {
                    content = <div>
                        <h1>{name}</h1>
                        {fixtures.instances.length > 0 ?
                            fixtures.instances.map((props, i) => {
                                return <SandboxInstance
                                    key={i}
                                    cursor={[i]}
                                    component={selectedComponent.reference}
                                    props={props}
                                    types={selectedComponent.types}
                                    callbacksToLog={fixtures.log || emptyList}
                                    onFixtureUpdate={onFixtureUpdate}
                                />;
                            })
                            :
                            "No fixtures for this component yet. Add some!"
                        }
                        <div className={css(styles.addButtonContainer)}>
                            <button onClick={this.handleFixtureAdd}>
                                Add new fixture
                            </button>
                        </div>
                    </div>;
                }
            }
        }

        return <div className={css(styles.root)}>
            {/* TODO(jlfwong): Switch this to autocomplete */}
            <select
                value={selectedComponent && selectedComponent.key}
                onChange={(ev) => onComponentSelect(ev.target.value)}
            >
                {componentList.map(([label, key]) => {
                    return <option value={key} key={key}>
                        {label}
                    </option>;
                })}
            </select>
            <div>
                {content}
            </div>
        </div>;
    },
});

const styles = StyleSheet.create({
    root: {
        textAlign: 'center',
        padding: 20,
    },
    addButtonContainer: {
        borderTop: '1px dotted black',
    },
});

module.exports = SandboxDisplay;
