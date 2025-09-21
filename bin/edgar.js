#!/usr/bin/env node

// Edgar CLI Entry Point
// This file serves as the main entry point for the Edgar CLI

// Enable source map support for better debugging
require('source-map-support').install();

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

if (majorVersion < 18) {
  console.error(`Edgar requires Node.js 18 or newer. You are running Node.js ${nodeVersion}.`);
  process.exit(1);
}

// Load the main CLI module
const { EdgarCLI } = require('../dist/cli/index.js');

// Create CLI instance
const cli = new EdgarCLI();

// Run the CLI with command line arguments
cli.run(process.argv.slice(2)).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});