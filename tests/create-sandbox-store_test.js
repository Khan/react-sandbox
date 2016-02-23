const { assert } = require('chai');

const createSandboxStore = require("../src/create-sandbox-store.js");

describe('createSandboxStore', () => {
    let store;

    beforeEach(function() {
        store = createSandboxStore();
    });

    it('initializes sensibly', () => {
        assert.deepEqual(store.getState(), {
            componentList: null,
            selectedComponent: null
        });
    });
});
