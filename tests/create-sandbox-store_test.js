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
        assert.deepEqual(store.getState(), expected);
    };

    it('initializes sensibly', () => {
        assertStore({
            componentList: null,
            selectedComponent: null
        });
    });

    it('can load components', (done) => {
        store.dispatch(actions.loadComponentList(getComponentList));

        assertStore({
            componentList: null,
            selectedComponent: null
        });

        resolveComponentList([
            ['big-spinner.jsx', 'BigSpinner'],
            ['small-spinner.jsx', 'SmallSpinner']
        ]);

        setTimeout(function() {
            assertStore({
                componentList: [
                    ['big-spinner.jsx', 'BigSpinner'],
                    ['small-spinner.jsx', 'SmallSpinner']
                ],
                selectedComponent: null
            });
            done();
        }, 0);
    });

    it('can select components', (done) => {
        store.dispatch(actions.selectComponent('big-spinner.jsx',
                                               getComponentReference,
                                               getFixtureListReference));

        assertStore({
            componentList: null,
            selectedComponent: {
                key: 'big-spinner.jsx',
                reference: null,
                fixtures: null,
            }
        });


        resolveComponentReference(SomeComponent);

        setTimeout(function() {
            assertStore({
                componentList: null,
                selectedComponent: {
                    key: 'big-spinner.jsx',
                    reference: SomeComponent,
                    fixtures: null
                }
            });

            resolveFixtureListReference(someFixtures);

            setTimeout(function() {
                assertStore({
                    componentList: null,
                    selectedComponent: {
                        key: 'big-spinner.jsx',
                        reference: SomeComponent,
                        fixtures: someFixtures
                    }
                });

                done();
            }, 0);
        }, 0);
    });

    it('can update fixtures', (done) => {
        // TODO(jlfwong)
        done();
    });
});
