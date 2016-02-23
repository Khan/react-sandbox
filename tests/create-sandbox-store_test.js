const { assert } = require('chai');
const React = require('react');

const createSandboxStore = require("../src/create-sandbox-store.js");
const actions = require("../src/actions.js");

const SomeComponent = React.createClass({
    render() {
        return <div />;
    }
});

const someFixtures = {instances: [{a: 1}]};

describe('createSandboxStore', () => {
    let store;
    let resolveComponentList;

    const getComponentList = () => {
        return new Promise((resolve, reject) => {
            resolveComponentList = resolve;
        });
    };

    let resolveComponentReference;
    const getComponentReference = () => {
        return new Promise((resolve, reject) => {
            resolveComponentReference = resolve;
        });
    };

    let resolveFixtureListReference;
    const getFixtureListReference = () => {
        return new Promise((resolve, reject) => {
            resolveFixtureListReference = resolve;
        });
    };

    beforeEach(function() {
        store = createSandboxStore();
        resolveComponentList = null;
        resolveComponentReference = null;
        resolveFixtureListReference = null;
    });

    const assertStore = (expected) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                assert.deepEqual(store.getState(), expected);
                resolve();
            }, 0);
        });
    };

    it('initializes sensibly', () => {
        return assertStore({
            componentList: null,
            selectedComponent: null
        });
    });

    it('can load components', () => {
        store.dispatch(actions.loadComponentList(getComponentList));

        return assertStore({
            componentList: null,
            selectedComponent: null
        }).then(() => {
            resolveComponentList([
                ['big-spinner.jsx', 'BigSpinner'],
                ['small-spinner.jsx', 'SmallSpinner']
            ]);

            return assertStore({
                componentList: [
                    ['big-spinner.jsx', 'BigSpinner'],
                    ['small-spinner.jsx', 'SmallSpinner']
                ],
                selectedComponent: null
            });
        });
    });

    it('can select components', () => {
        store.dispatch(actions.selectComponent('big-spinner.jsx',
                                               getComponentReference,
                                               getFixtureListReference));

        return assertStore({
            componentList: null,
            selectedComponent: {
                key: 'big-spinner.jsx',
                reference: null,
                fixtures: null,
            }
        }).then(() => {
            resolveComponentReference(SomeComponent);

            return assertStore({
                componentList: null,
                selectedComponent: {
                    key: 'big-spinner.jsx',
                    reference: SomeComponent,
                    fixtures: null
                }
            });
        }).then(() => {
            resolveFixtureListReference(someFixtures);

            return assertStore({
                componentList: null,
                selectedComponent: {
                    key: 'big-spinner.jsx',
                    reference: SomeComponent,
                    fixtures: someFixtures
                }
            });
        });
    });

    it('can update fixtures', (done) => {
        // TODO(jlfwong)
        done();
    });
});
