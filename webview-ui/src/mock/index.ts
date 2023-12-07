export const packageJson = {
  data: {
    packageJson: {
      "name": "@serverless-devs/utils",
      "version": "0.0.14",
      "description": "utils for serverless-devs",
      "main": "lib/index.js",
      "scripts": {
        "clean": "rimraf lib node_modules",
        "build": "tsc",
        "watch": "tsc -w",
        "prepublishOnly": "npm run build",
        "pub": "pnpm publish --no-git-checks"
      },
      "author": "xsahxl",
      "license": "MIT",
      "repository": {
        "type": "git",
        "url": "https://github.com/Serverless-Devs/toolkit"
      },
      "publishConfig": {
        "registry": "https://registry.npmjs.org",
        "access": "public"
      },
      "dependencies": {
        "js-yaml": "^4.1.0",
        "lodash": "^4.17.21",
        "md5": "^2.3.0",
        "minimist": "^1.2.8",
        "random-string": "^0.2.0"
      },
      "devDependencies": {
        "@types/js-yaml": "^4.0.5",
        "@types/lodash": "^4.14.197",
        "@types/minimist": "^1.2.2",
        "@types/random-string": "^0.0.28"
      }
    },
  },
};
