#!/usr/bin/env node

import { execSync, exec } from 'child_process';
import { readFileSync } from 'fs';
import chalk from 'chalk';

// Function to check if the Git repository is clean
function isGitClean(callback) {
  exec('git status --porcelain', (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error checking Git status: ${error.message}`))
      return
    }
    if (stderr) {
      console.error(chalk.red(`Error checking Git status: ${stderr}`))
      return
    }
    // If there are no pending changes, the repository is clean
    const isClean = stdout.trim() === ''
    callback(isClean)
  })
}

// Function to execute the suggested version
function executeNpmVersion(version, first) {
  let args = first ? '--allow-same-version' : ''
  execSync(`npm version ${version} ${args}`, (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error executing npm version: ${error.message}`))
      return
    }
    if (stderr) {
      console.error(chalk.red(`Error executing npm version: ${stderr}`))
      return
    }
    console.log(chalk.green(stdout))
  })
}

// Function to check for tags in git
function hasTags() {
  try {
    const tags = execSync('git tag').toString().split('\n')
    return tags.length > 0 && tags[0] !== ''
  } catch (error) {
    return false
  }
}

// Main execution
isGitClean((isClean) => {
  if (isClean) {
    console.log(chalk.green('The Git repository is clean. You can proceed with the version bump.'))
    // Check for tags in the repository
    if (!hasTags()) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      readline.question(
        chalk.yellow(`There are no tags in the repository. Would you like to create a tag for the initial version based on the value of 'version' in package.json? (y/n) `),
        (answer) => {
          if (answer.trim().toLowerCase() === 'y') {
            let initialVersion
            try {
              const packageJson = JSON.parse(
                readFileSync('./package.json', 'utf8')
              )
              initialVersion = packageJson.version
            } catch (err) {
              console.error(chalk.red('Could not read the package.json file'))
              process.exit(1)
            }
            executeNpmVersion(initialVersion, true)
            console.log(chalk.green(`Tag v${initialVersion} created.`))
          } else {
            console.log(chalk.yellow('A tag will not be created for the initial version.'))
          }
          readline.close()
        }
      )
    } else {
      // Read the current version from the package.json file
      let currentVersion
      try {
        const packageJson = JSON.parse(
          readFileSync('./package.json', 'utf8')
        )
        currentVersion = packageJson.version
      } catch (err) {
        console.error(chalk.red('Could not read the package.json file'))
        process.exit(1)
      }

      // Parse git commits to suggest the ideal version type
      const commitLog = execSync('git log --oneline').toString()
      let suggestedBump = 'patch' // Default
      if (commitLog.includes('BREAKING CHANGE')) {
        suggestedBump = 'major'
      } else if (commitLog.includes('feat')) {
        suggestedBump = 'minor'
      }

      // Display the suggested version
      const currentVersionArray = currentVersion.split('.')
      let suggestedVersion
      switch (suggestedBump) {
        case 'major':
          suggestedVersion = `${parseInt(currentVersionArray[0]) + 1}.0.0`
          break
        case 'minor':
          suggestedVersion = `${currentVersionArray[0]}.${
            parseInt(currentVersionArray[1]) + 1
          }.0`
          break
        case 'patch':
        default:
          suggestedVersion = `${currentVersionArray[0]}.${
            currentVersionArray[1]
          }.${parseInt(currentVersionArray[2]) + 1}`
          break
      }

      console.log(
        chalk.green(`Suggested version: ${currentVersion} -> ${suggestedVersion}`)
      )

      // Ask the user if they want to use the suggested version or specify an option
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      readline.question(
        chalk.yellow(`Would you like to use the suggested version (${suggestedVersion}) or specify an option (major, minor, patch)? (default: ${suggestedVersion}) `),
        (answer) => {
          const option = answer.trim().toLowerCase() || suggestedVersion
          const validOptions = ['major', 'minor', 'patch']
          if (validOptions.includes(option)) {
            suggestedBump = option
            switch (suggestedBump) {
              case 'major':
                suggestedVersion = `${parseInt(currentVersionArray[0]) + 1}.0.0`
                break
              case 'minor':
                suggestedVersion = `${currentVersionArray[0]}.${
                  parseInt(currentVersionArray[1]) + 1
                }.0`
                break
              case 'patch':
              default:
                suggestedVersion = `${currentVersionArray[0]}.${
                  currentVersionArray[1]
                }.${parseInt(currentVersionArray[2]) + 1}`
                break
            }
          }

          // Ask if this version will be release or prerelease
          readline.question(
            chalk.yellow(`Will this version be release or prerelease? (r/p) (default: r) `),
            (releaseType) => {
              const release = releaseType.trim().toLowerCase() || 'r'
              const finalVersion =
                release === 'r' ? suggestedVersion : `${suggestedVersion}-pre.${Date.now()}`
              console.log(chalk.green(`The final version is: ${finalVersion}`))
              executeNpmVersion(finalVersion)
              readline.close()
            }
          )
        }
      )
    }
  } else {
    console.error(
      chalk.red('The Git repository has pending changes. Please commit or discard the changes before continuing. Use: git status')
    )
    process.exit(1)
  }
})
