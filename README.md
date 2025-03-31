# Bump and Synchronize Versions

When you apply audit fixes, or install new dependencies, package manager only updates minor updates in `package-lock.json`. This tool will also update `package.json` to match the versions installed in `package-lock.json`.

Additionally, if you made any dependency changes in the local branch against the `main` branch, it will show you the differences between the current `package.json` and the version in the `main` branch.

A Node.js CLI tool that automatically updates your `package.json` dependencies to match the versions installed in your `package-lock.json` while maintaining semantic versioning compatibility.

Also checks and shows differences between the current `package.json` and the version in the `main` branch.

## Features

- 🔄 Automatically updates dependencies to match installed versions
- 🔒 Maintains semantic versioning compatibility
- 📊 Provides detailed version change reports
- 🔍 Compares changes with git history
- ⚡ Supports all dependency types (dependencies, devDependencies, peerDependencies, optionalDependencies)

## Installation

Currently only works with npm (and requires `package-lock.json`).

```bash
npm install -D bump-sync-deps
```

## Usage

Simply run the command in your project directory:

```bash
bump-sync-deps
```

The tool will:

1. Read your `package.json` and `package-lock.json`
2. Update dependency versions while maintaining caret (^) versioning
3. Only update versions within the same major version to maintain compatibility
4. Generate a detailed report of all changes
5. Compare changes with git history (if available)

## How It Works

The tool:

- Preserves caret (^) versioning in your `package.json`
- Only updates versions within the same major version to prevent breaking changes
- Compares changes with your git history to show what versions were updated
- Categorizes changes into major, minor, and patch updates

## Example Output

```
Updated dequal: ^2.0.2 -> ^2.0.3
Updated markdown-to-jsx: ^7.1.7 -> ^7.5.0
Updated sanitize-html: ^2.7.1 -> ^2.13.0
Updated tslib: ^2.4.0 -> ^2.6.2
Updated @babel/core: ^7.17.10 -> ^7.24.5
✅ Successfully updated package.json with latest installed versions

📜 Comparing with previous git version...

Dependencies:
  Major changes (1):
    - react: ^17.0.0 → ^18.0.0
  Minor changes (2):
    - typescript: ^4.5.0 → ^4.6.0
    - tailwindcss: ^3.0.0 → ^3.1.0
  Patch changes (1):
    - @types/node: ^16.0.0 → ^16.0.1

DevDependencies:
  Minor changes (1):
    - jest: ^27.0.0 → ^27.1.0
```

## Requirements

- Node.js 12 or higher
- A project with both `package.json` and `package-lock.json` files
- Git (optional, for version comparison)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
