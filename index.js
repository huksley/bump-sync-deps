#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Read both files
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageLockJsonPath = path.resolve(process.cwd(), "package-lock.json");

const logger = console;

try {
  // Read and parse the files
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const packageLockJson = JSON.parse(fs.readFileSync(packageLockJsonPath, "utf8"));

  // Extract the packages from package-lock.json
  const lockPackages = packageLockJson.packages || {};

  // Function to update dependencies with the latest installed versions
  const updateDependencies = (dependencies) => {
    if (!dependencies) return {};

    const updated = { ...dependencies };

    Object.keys(dependencies).forEach((packageName) => {
      // Skip packages without caret versioning
      if (!dependencies[packageName].startsWith("^")) return;

      // Look for the package in the package-lock.json
      const lockPackage = lockPackages[`node_modules/${packageName}`];

      if (lockPackage && lockPackage.version) {
        const currentVersion = dependencies[packageName].replace("^", "");
        const installedVersion = lockPackage.version;

        // If installed version is newer, update it while keeping the caret
        if (installedVersion !== currentVersion) {
          const currentMajor = currentVersion.split(".")[0];
          const installedMajor = installedVersion.split(".")[0];

          // Only update if major version is the same (to maintain semver compatibility)
          if (currentMajor === installedMajor) {
            updated[packageName] = `^${installedVersion}`;
            logger.info(`Updated ${packageName}: ${dependencies[packageName]} -> ${updated[packageName]}`);
          }
        }
      }
    });

    return updated;
  };

  // Update dependencies and devDependencies
  packageJson.dependencies = updateDependencies(packageJson.dependencies);
  packageJson.devDependencies = updateDependencies(packageJson.devDependencies);

  // Optional: update peerDependencies and optionalDependencies if they exist
  if (packageJson.peerDependencies) {
    packageJson.peerDependencies = updateDependencies(packageJson.peerDependencies);
  }

  if (packageJson.optionalDependencies) {
    packageJson.optionalDependencies = updateDependencies(packageJson.optionalDependencies);
  }

  // Write the updated package.json back to disk with proper formatting
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

  logger.info("✅ Successfully updated package.json with latest installed versions");
} catch (error) {
  process.stderr.write(`❌ Error updating package versions: ${error.message}\n`);
  process.exit(1);
}

if (fs.existsSync(".git")) {
  // Get the previous version of package.json from git
  try {
    logger.info("\n📜 Comparing with previous git version...");

    // Get the previous version of package.json from git,
    // use main branch by default
    const branch = process.argv[2] || "main";
    if (!branch) {
      throw new Error("Invalid branch provided");
    }
    const gitPreviousPackageJson = execSync(`git show ${branch}:package.json`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"], // Ignore stderr to prevent git errors from showing
    }).toString();

    const previousPackageJson = JSON.parse(gitPreviousPackageJson);
    const currentPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Function to compare dependencies
    const compareVersions = (prevDeps, currentDeps, type) => {
      if (!prevDeps || !currentDeps) return;

      const majorUpgrades = [];
      const minorUpgrades = [];
      const patchUpgrades = [];

      Object.keys(currentDeps).forEach((packageName) => {
        if (prevDeps[packageName] && prevDeps[packageName] !== currentDeps[packageName]) {
          const prevVersion = prevDeps[packageName].replace("^", "");
          const currentVersion = currentDeps[packageName].replace("^", "");

          const [prevMajor, prevMinor] = prevVersion.split(".");
          const [currentMajor, currentMinor] = currentVersion.split(".");

          const upgrade = {
            name: packageName,
            from: prevDeps[packageName],
            to: currentDeps[packageName],
          };

          if (prevMajor !== currentMajor) {
            majorUpgrades.push(upgrade);
          } else if (prevMinor !== currentMinor) {
            minorUpgrades.push(upgrade);
          } else {
            patchUpgrades.push(upgrade);
          }
        }
      });

      if (majorUpgrades.length > 0 || minorUpgrades.length > 0 || patchUpgrades.length > 0) {
        logger.info(`\n${type}:`);

        if (majorUpgrades.length > 0) {
          logger.info(`  Major changes (${majorUpgrades.length}):`);
          majorUpgrades
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((upgrade) => {
              logger.info(`    - ${upgrade.name}: ${upgrade.from} → ${upgrade.to}`);
            });
        }

        if (minorUpgrades.length > 0) {
          logger.info(`  Minor changes (${minorUpgrades.length}):`);
          minorUpgrades
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((upgrade) => {
              logger.info(`    - ${upgrade.name}: ${upgrade.from} → ${upgrade.to}`);
            });
        }

        if (patchUpgrades.length > 0) {
          logger.info(`  Patch changes (${patchUpgrades.length}):`);
          patchUpgrades
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((upgrade) => {
              logger.info(`    - ${upgrade.name}: ${upgrade.from} → ${upgrade.to}`);
            });
        }
      }
    };

    // Compare the different dependency types
    compareVersions(previousPackageJson.dependencies, currentPackageJson.dependencies, "Dependencies");
    compareVersions(previousPackageJson.devDependencies, currentPackageJson.devDependencies, "DevDependencies");
    compareVersions(previousPackageJson.peerDependencies, currentPackageJson.peerDependencies, "PeerDependencies");
    compareVersions(
      previousPackageJson.optionalDependencies,
      currentPackageJson.optionalDependencies,
      "OptionalDependencies"
    );
  } catch (error) {
    if (error.message.includes("fatal: Not a git repository")) {
      logger.info("\n⚠️ Not a git repository, can't compare with previous version");
    } else if (error.message.includes("fatal: PATH not in the working tree")) {
      logger.info("\n⚠️ package.json not tracked in git, can't compare with previous version");
    } else {
      logger.info(`\n⚠️ Could not compare with git version: ${error.message}`);
    }
  }
}
