/**
 * In order to reflect upon a components prop types, we need to patch them.
 *
 * This is necessary because, while React.PropTypes does validation, it does so
 * only as a function from input to a boolean. Trying to figure out from the
 * PropTypes what the full range of valid values is is much harder! So we
 * monkey patch it to retain information about the types.
 */

const patch = (PropTypes) => {
    if (PropTypes.__isPatchedBySandbox) return;

    Object.keys(PropTypes).forEach((key) => {
        const orig = PropTypes[key];

        // If the PropType has a .isRequired property it means that this prop
        // type is a validator function itself, like PropTypes.string. If not,
        // it means it's a validator function constructor, like PropTypes.shape
        // (PropTypes.shape({...}) becomes the validator function).
        if (orig.isRequired != null) {
            orig.__sandbox_meta = {
                type: key,
                required: false
            };
            orig.isRequired.__sandbox_meta = {
                type: key,
                required: true
            }
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

const _generateValue = (inferredType, path, config) => {
    let generatorType = 'string';
    let required = true;

    if (inferredType && inferredType.type) {
        required = !!inferredType.required;

        if (config.hasOwnProperty(inferredType.type)) {
            generatorType = inferredType.type;
        }
    }

    return config[generatorType](path,
                                 required,
                                 (t, path) => _generateValue(t, path, config),
                                 inferredType);
};

/**
 * Given an inferred type and an optional configuration object, return a value
 * satisfying that type.
 */
const generateValueForType = (inferredType, path=[], config = {}) => {
    const fullConfig = {};
    Object.assign(fullConfig, generateValueForType.staticDefaults, config);
    return _generateValue(inferredType, path, fullConfig);
};

// Generators all have the signature
//
//      (path, isRequired, generator, inferredType) => value
//
// Additional arguments are used in some to allow re-use by other generators.
generateValueForType.staticDefaults = {
    string(path, isRequired) {
        return isRequired ? '' : null;
    },
    number(path, isRequired) {
        return isRequired ? 0 : null;
    },
    bool(path, isRequired) {
        return isRequired ? false : null;
    },
    array(path, isRequired, generator, inferredType,
          length=1, childType=null) {
        if (!isRequired) {
            return null;
        }
        const ret = [];
        for (let i = 0; i < length; i++) {
            ret.push(generator(childType, path.concat([i])));
        }
        return ret;
    },
    object(path, isRequired, generator, inferredType,
           length=1, childType=null, keyGenerator=() => 'key') {
        if (!isRequired) {
            return null;
        }
        const ret = {};
        for (let i = 0; i < length; i++) {
            const keyPrefix = keyGenerator();
            let key = keyPrefix;
            for (let j = 2; ret.hasOwnProperty(key); j++) {
                key = `${keyPrefix}_${j}`;
            }
            ret[keyGenerator(path)] = generator(childType, path.concat([key]));
        }
        return ret;
    },
    arrayOf(path, isRequired, generator, inferredType,
            length) {
        return generateValueForType.staticDefaults
                    .array(path,
                           isRequired,
                           generator,
                           inferredType,
                           length,
                           inferredType.args[0]);
    },
    objectOf(path, isRequired, generator, inferredType,
             length, keyGenerator) {
        return generateValueForType.staticDefaults
                    .object(path,
                            isRequired,
                            generator,
                            inferredType,
                            length,
                            inferredType.args[0],
                            keyGenerator);
    },
    shape(path, isRequired, generator, inferredType) {
        if (!isRequired) {
            return null;
        }
        const ret = {};
        const shapeTypes = inferredType.args[0];
        for (let key in shapeTypes) {
            if (!shapeTypes.hasOwnProperty(key)) {
                continue;
            }
            ret[key] = generator(shapeTypes[key], path.concat([key]));
        }
        return ret;
    }
};

const randomMaybe = (isRequired, value) => {
    // If the prop is not required, return null 1/5 of the time.
    if (!isRequired && Math.random() < 0.2) {
        return null;
    }
    return value;
};

const randomChoice = list => list[Math.floor(Math.random() * list.length)];

// TODO(jlfwong): This is a little crazy -- it might be better to only allow
// overriding of null probability, strings, numbers, booleans, and lengths of
// things.
//
// This also might be less crazy if I switch to object args instead of
// positional.
generateValueForType.randomDefaults = {
    string(path, isRequired) {
        return randomMaybe(isRequired, [
            randomChoice(ADJECTIVES_1),
            randomChoice(ADJECTIVES_2),
            randomChoice(ANIMALS)
        ].join(' '));
    },
    number(path, isRequired) {
        return randomMaybe(isRequired, Math.floor(Math.random() * 9));
    },
    bool(path, isRequired) {
        return randomMaybe(isRequired, Math.random() > 0.5);
    },
    array(path, isRequired, generator, inferredType,
          length=1, childType=null) {
        return randomMaybe(isRequired,
                           generateValueForType.staticDefaults
                                .array(path,
                                       true,
                                       generator,
                                       inferredType,
                                       Math.floor(Math.random() * 9),
                                       childType));
    },
    object(path, isRequired, generator, inferredType,
           length=1, childType=null, keyGenerator=() => 'key') {
        return randomMaybe(isRequired,
                           generateValueForType.staticDefaults
                                .object(path,
                                        true,
                                        generator,
                                        inferredType,
                                        Math.floor(Math.random() * 9),
                                        childType,
                                        keyGenerator));
    },
    arrayOf(path, isRequired, generator, inferredType,
            length) {
        return generateValueForType.randomDefaults
                    .array(path,
                           isRequired,
                           generator,
                           inferredType,
                           length,
                           inferredType.args[0]);
    },
    objectOf(path, isRequired, generator, inferredType,
             length, keyGenerator) {
        return generateValueForType.randomDefaults
                    .object(path,
                            isRequired,
                            generator,
                            inferredType,
                            length,
                            inferredType.args[0],
                            keyGenerator);
    },
    shape(path, isRequired, ...args) {
        return randomMaybe(isRequired,
                           generateValueForType.staticDefaults
                                .shape(path,
                                       true,
                                       ...args));
    },
    oneOf(path, isRequired, generator, inferredType) {
        return randomMaybe(isRequired, randomChoice(inferredType.args[0]));
    },
    func(path, isRequired, generator, inferredType) {
        return randomMaybe(isRequired, () => {});
    },
};

// TODO(jlfwong): Reorganize this to avoid the Object.assign
// call on every value generation.
const generateRandomValueForType = (inferredType, path=[], config = {}) => {
    const fullConfig = {};
    Object.assign(fullConfig,
                  generateValueForType.staticDefaults,
                  generateValueForType.randomDefaults,
                  config);
    return _generateValue(inferredType, path, fullConfig);
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
    "Yeti Crab"
];


module.exports = {
    patch,
    inferType,
    inferTypesForComponent,
    valueSatisfiesType,
    generateValueForType,
    generateRandomValueForType
};
