/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');

module.exports = (_env, argv) => {
    const mode = argv.mode || 'development';
    const isProduction = mode === 'production';

    /** @type {import('webpack').Configuration} */
    const extensionConfig = {
        name: 'extension',
        mode,
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
                            options: {
                                onlyCompileBundledFiles: true,
                            },
                        },
                    ],
                },
            ],
        },
        externals: {
            vscode: 'commonjs vscode',
        },
        devtool: isProduction ? 'hidden-source-map' : 'source-map',
    };

    /** @type {import('webpack').Configuration} */
    const webviewConfig = {
        name: 'webview',
        mode,
        target: 'web',
        entry: {
            webview: './src/webview/ui/index.tsx',
        },
        output: {
            path: path.join(__dirname, 'dist'),
            filename: '[name].js',
            devtoolModuleFilenameTemplate: '../../[resource-path]',
        },
        resolve: {
            mainFields: ['module', 'main'],
            extensions: ['.ts', '.tsx', '.js', '.css'],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                onlyCompileBundledFiles: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(mode),
            }),
        ],
        devtool: isProduction ? 'hidden-source-map' : 'source-map',
    };

    return [extensionConfig, webviewConfig];
};
