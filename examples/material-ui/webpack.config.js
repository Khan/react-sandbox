var path = require('path');

module.exports = {
    entry: [
        './src/index.js',
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'react-sandbox-material-ui.js',
        publicPath: '/examples/material-ui/dist/'
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'react-sandbox': 'ReactSandbox',
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel'],
            include: [
                path.join(__dirname, 'src'),
                path.join(__dirname, '..', '..', 'src'),
            ]
        }],
    }
};
