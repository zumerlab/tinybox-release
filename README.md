### @zumerbox/bump

#### Overview:
Zumerbox Bump tool is a command-line utility designed to assist developers in managing versioning of their Node.js projects. It automates the process of determining the next version number based on the project's Git history and current package.json, and optionally creates Git tags for releases.

#### Installation:

```bash
npm install @zumerbox/release --save-dev
```

#### Usage:

```bash
npx @zumerbox/bump
```

#### Functionality:
- **Git repository status check**: The tool checks if the Git repository is clean (i.e., no pending changes) before proceeding with the version bump process.
- **Tag creation**: If there are no existing Git tags in the repository, the tool prompts the user to create a tag for the initial version based on the version specified in the package.json file.
- **Version suggestion**: Based on the project's Git commit history, the tool suggests the next version number following semantic versioning conventions (major, minor, patch).
- **User input**: The tool allows the user to either accept the suggested version or specify a different version type (major, minor, patch) and whether it will be a release or prerelease.
- **NPM versioning**: After confirming the version, the tool uses the npm version command to update the package.json file with the new version number and optionally create a Git tag for the release.


Refer to the [ZumerBox bundle](https://github.com/zumerlab/zumerbox) for more information.
