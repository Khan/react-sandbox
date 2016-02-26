/**
 * In order to reflect upon a components prop types, we need to patch them.
 *
 * This is necessary because, while React.PropTypes does validation, it does so
 * only as a function from input to a boolean. Trying to figure out from the
 * PropTypes what the full range of valid values is is much harder! So we
 * monkey patch it to retain information about the types.
 */

const patch = (PropTypes) => {
    if (PropTypes.__isPatchedBySandbox) {
        return;
    }

    Object.keys(PropTypes).forEach((key) => {
        const orig = PropTypes[key];

        // If the PropType has a .isRequired property it means that this prop
        // type is a validator function itself, like PropTypes.string. If not,
        // it means it's a validator function constructor, like PropTypes.shape
        // (PropTypes.shape({...}) becomes the validator function).
        if (orig.isRequired != null) {
            orig.__sandbox_meta = {
                type: key,
                required: false,
            };
            orig.isRequired.__sandbox_meta = {
                type: key,
                required: true,
            };
        } else {
            PropTypes[key] = (...args) => {
                const ret = orig(...args);
                ret.__sandbox_meta = {
                    type: key,
                    required: false,
                    args: args,
                };
                ret.isRequired.__sandbox_meta = {
                    type: key,
                    required: true,
                    args: args,
                };
                return ret;
            };
        }
    });

    PropTypes.__isPatchedBySandbox = true;
};

const inferType = (propType) => {
    if (propType.__sandbox_meta != null) {
        const {type, required, args} = propType.__sandbox_meta;
        if (args != null) {
            return {
                type,
                required,
                args: args.map(inferType),
                __propType: propType,
            };
        } else {
            return {
                type,
                required,
                __propType: propType,
            };
        }
    } else if (Array.isArray(propType)) {
        return propType.map(inferType);
    } else if (typeof propType === 'object') {
        const ret = {};
        Object.keys(propType).forEach(key => {
            ret[key] = inferType(propType[key]);
        });
        return ret;
    } else {
        return propType;
    }
};

/**
 * Given a refernece to a component, return a description of the proptypes it
 * expects.
 */
const inferTypesForComponent = (Component) => {
    const ret = {};

    const propTypes = Component.propTypes || {};

    Object.keys(propTypes).forEach(propName => {
        ret[propName] = inferType(propTypes[propName]);
    });

    return ret;
};

/**
 * Given a value and a type as returned by inferType, return true if the value
 * satisfies the type.
 */
const valueSatisfiesType = (value, inferredType) => {
    const propType = (typeof inferredType === 'function') ?
                            inferredType :
                            inferredType.__propType;

    const maybeError = propType({__ignored__: value},
                                '__ignored__', '__ignore__', 'prop');

    return !(maybeError instanceof Error);
};

const configDefaults = {
    generateString: () => '',
    generateNumber: () => 0,
    generateBool: () => false,
    chooseItemFromList: (list) => list && list[0],
    chooseListLength: () => 1,
    nullProbability: 1.0,
};

const _generateValue = (inferredType, path, config) => {
    let generatorType = 'unknown';
    let required = true;

    if (inferredType && inferredType.type) {
        required = !!inferredType.required;

        if (generators.hasOwnProperty(inferredType.type)) {
            generatorType = inferredType.type;
        }
    }

    if (!required && Math.random() < config.nullProbability) {
        return null;
    }

    return generators[generatorType](
                        path,
                        (t, path) => _generateValue(t, path, config),
                        inferredType,
                        config);
};


/**
 * Given an inferred type and an optional configuration object, return a value
 * satisfying that type.
 */
const generateValueForType = (inferredType, path = [], config = {}) => {
    const fullConfig = {};
    Object.assign(fullConfig, configDefaults, config);
    return _generateValue(inferredType, path, fullConfig);
};

// Generators all have the signature
//
//      (path, isRequired, generator, inferredType) => value
//
// Additional arguments are used in some to allow re-use by other generators.
const generators = {
    string(path, generator, inferredType, config) {
        return config.generateString(path);
    },
    number(path, generator, inferredType, config) {
        return config.generateNumber(path);
    },
    bool(path, generator, inferredType, config) {
        return config.generateBool(path);
    },
    array(path) {
        return [];
    },
    object(path) {
        return {};
    },
    arrayOf(path, generator, inferredType, config) {
        const ret = [];
        const length = config.chooseListLength();
        for (let i = 0; i < length; i++) {
            ret.push(generator(inferredType.args[0], path.concat([i])));
        }
        return ret;
    },
    objectOf(path, generator, inferredType, config) {
        // TODO(jlfwong): Maybe try to generate here? Not clear how frequently
        // this will be useful.
        return {};
    },
    shape(path, generator, inferredType) {
        const ret = {};
        const shapeTypes = inferredType.args[0];
        for (const key in shapeTypes) {
            if (!shapeTypes.hasOwnProperty(key)) {
                continue;
            }
            ret[key] = generator(shapeTypes[key], path.concat([key]));
        }
        return ret;
    },
    unknown(path, generator, inferredType, config) {
        return null;
    },
    any(...args) {
        return generators.string(...args);
    },
    node(...args) {
        return generators.string(...args);
    },
    element(...args) {
        return generators.string(...args);
    },
    oneOf(path, generator, inferredType, config) {
        return config.chooseItemFromList(inferredType.args[0]);
    },
    oneOfType(path, generator, inferredType, config) {
        const chosenType = config.chooseItemFromList(inferredType.args[0]);
        return generator(chosenType, path);
    },
    func(path, generator, inferredType, config) {
        return function() {
            console.log(arguments);
        }
    },
};

const randomChoice = list => list[Math.floor(Math.random() * list.length)];

const randomConfig = {
    generateString: (path) => {
        if (path.length > 0) {
            const name = ('' + path[path.length-1]).toLowerCase();
            if (name.indexOf('color') !== -1) {
                return randomChoice([
                    'red',
                    'green',
                    'blue'
                ]);
            } else if (name.indexOf('url') !== -1) {
                return randomChoice([
                    'http://lorempixel.com/800/500/city/',
                    'http://lorempixel.com/800/500/cats/',
                    'http://lorempixel.com/800/500/nature/',
                ]);
            } else if (name.indexOf('href') !== -1) {
                return randomChoice([
                    'https://www.khanacademy.org',
                    'https://google.com',
                ]);
            }
        }
        return [
            randomChoice(ADJECTIVES_1),
            randomChoice(ADJECTIVES_2),
            randomChoice(ANIMALS),
        ].join(' ')
    },
    generateNumber: () => Math.floor(Math.random() * 50 + 20),
    generateBool: () => Math.random() < 0.5,
    chooseItemFromList: (list) => randomChoice(list),
    chooseListLength: () => Math.floor(Math.random() * 4) + 2,
    nullProbability: 0.0,
};

// TODO(jlfwong): Reorganize this to avoid the Object.assign
// call on every value generation.
const generateRandomValueForType = (inferredType, path = []) => {
    return generateValueForType(inferredType, path, randomConfig);
};

const ADJECTIVES_1 = [
    'Agreeable',
    'Brave',
    'Calm',
    'Delightful',
    'Eager',
    'Faithful',
    'Gentle',
    'Happy',
    'Jolly',
    'Kind',
    'Lively',
    'Nice',
    'Obedient',
    'Proud',
    'Relieved',
    'Silly',
    'Thankful',
    'Victorious',
    'Witty',
    'Zealous',
];

const ADJECTIVES_2 = [
    'Cooing',
    'Deafening',
    'Faint',
    'Hissing',
    'Loud',
    'Melodic',
    'Noisy',
    'Purring',
    'Quiet',
    'Raspy',
    'Screeching',
    'Thundering',
    'Voiceless',
    'Whispering',
];

const ANIMALS = [
    "Leafy seadragon",
    "Sun Bear",
    "Komondor Dog",
    "Angora Rabbit",
    "Red Panda",
    "Sloth",
    "Emperor Tamarin",
    "White-faced Saki Monkey",
    "Tapir",
    "Hagfish",
    "Star-nosed Mole",
    "Proboscis Monkey",
    "Pink Fairy Armadillo",
    "Axolotl",
    "Aye-aye",
    "Alpaca",
    "Tarsier",
    "Dumbo Octopus",
    "Frill-necked Lizard",
    "Narwhal",
    "Sucker-footed Bat",
    "Pygmy Marmoset",
    "Blobfish",
    "Platypus",
    "Shoebill",
    "Yeti Crab",
];


module.exports = {
    patch,
    inferType,
    inferTypesForComponent,
    valueSatisfiesType,
    generateValueForType,
    generateRandomValueForType,
};
