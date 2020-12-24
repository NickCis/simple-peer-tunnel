#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const peer = require('./peer');
const host = require('./host');

const argv = yargs(hideBin(process.argv))
  .command(
    'host [address]',
    'start accepting peers to forward connection',
    yargs => {
      yargs.positional('address', {
        describe: 'peers will be forwarded to the specified address',
        default: 'localhost:80',
      });
    }
  )
  .command('peer <id>', 'connect to peer', yargs => {
    yargs
      .positional('id', {
        describe: 'peer id to connect',
      })
      .option('port', {
        alias: 'p',
        describe: 'port to listen',
        default: 8080,
      });
  })
  .demandCommand()
  .help().argv;

function main() {
  const [command] = argv._;

  switch (command) {
    case 'peer':
      peer(argv);
      break;

    case 'host':
      host(argv);
      break;
  }
}

main();
