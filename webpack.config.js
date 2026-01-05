/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/** @type {import('webpack').Configuration} */
const extensionConfig = {
    name: 'extension',
    mode: 'none',
    target: 'node',
    entry: {
        extension: './src/extension.ts',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../../[resource-path]',
    },
    resolve: {
        mainFields: ['module', 'main'],
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
        ],
    },
    externals: {
        'vscode': 'commonjs vscode',
    },
    devtool: 'nosources-source-map',
};

/** @type {import('webpack').Configuration} */
const webviewConfig = {
    name: 'webview',
    mode: 'none',
    target: 'web', // Important for React
    entry: {
        webview: './src/webview/ui/index.tsx'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        devtoolModuleFilenameTemplate: '../../[resource-path]',
    },
    resolve: {
        mainFields: ['module', 'main'],
        extensions: ['.ts', '.tsx', '.js', '.css'],
        fallback: {
            // Fallbacks for node modules if any (shouldn't be needed for basic react)
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'] // Injects CSS into JS
            }
        ],
    },
    devtool: 'nosources-source-map',
};

module.exports = [extensionConfig, webviewConfig];
