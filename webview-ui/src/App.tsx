import './styles/index.less';
import { get } from 'lodash';

function App() {
  const PACKAGE_MANAGE_CONFIG = get(window, 'PACKAGE_MANAGE_CONFIG');
  const data: any = get(PACKAGE_MANAGE_CONFIG, 'data', {
    "lang": "en",
    "data": {
      "packageJson": {
        "name": "@serverless-devs/art-template",
        "typings": "index.d.ts",
        "description": "JavaScript Template Engine",
        "homepage": "http://aui.github.com/art-template/",
        "version": "4.13.13",
        "keywords": [
          "template"
        ],
        "author": "tangbin <sugarpie.tang@gmail.com>",
        "repository": {
          "type": "git",
          "url": "git://github.com/aui/art-template.git"
        },
        "scripts": {
          "test": "jest --testTimeout 10000 --watchAll",
          "watch": "npm run build:index -- --watch",
          "build:index": "rm -rf lib && babel src --out-dir lib --presets=@babel/env",
          "build:devs": "babel devs-compile.js -o lib/devs-compile.js --presets=@babel/env",
          "build": "npm run build:index && npm run build:devs",
          "prepublishOnly": "npm run build",
          "pub": "npm publish",
          "dev": "babel src --watch --out-dir lib",
          "test_bak": "export NODE_ENV=production && istanbul cover node_modules/mocha/bin/_mocha -- --ui exports --colors 'test/**/*.js'",
          "coverage": "cat ./coverage/lcov.info | coveralls"
        },
        "main": "index.js",
        "files": [
          "lib/",
          "index.d.ts"
        ],
        "publishConfig": {
          "registry": "https://registry.npmjs.org",
          "access": "public"
        },
        "engines": {
          "node": ">= 1.0.0"
        },
        "dependencies": {
          "@serverless-devs/utils": "^0.0.14",
          "acorn": "^5.0.3",
          "escodegen": "^1.8.1",
          "estraverse": "^4.2.0",
          "fs-extra": "^11.1.1",
          "html-minifier": "^3.4.3",
          "is-keyword-js": "^1.0.3",
          "js-tokens": "^3.0.1",
          "lodash": "^4.17.21",
          "merge-source-map": "^1.0.3",
          "source-map": "^0.5.6"
        },
        "devDependencies": {
          "@babel/cli": "^7.23.4",
          "@babel/core": "^7.23.3",
          "@babel/preset-env": "^7.23.3",
          "@types/jest": "^29.5.10",
          "coveralls": "^2.13.0",
          "eslint": "^3.19.0",
          "eslint-loader": "^1.7.1",
          "eslint-plugin-prettier": "^2.6.2",
          "istanbul": "^0.4.5",
          "jest": "^29.7.0",
          "mocha": "^5.2.0",
          "node-noop": "^1.0.0",
          "prettier": "^1.14.2",
          "webpack": "^3.0.0"
        },
        "license": "MIT"
      }
    }
  });

  return (
    <>
      <pre>{JSON.stringify(PACKAGE_MANAGE_CONFIG, null, 2)}</pre>
    </>
  );
}

export default App;
