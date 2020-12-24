const SimplePeerJs = require('simple-peerjs');
const net = require('net');

const { header, MuxReader } = require('./mux');
const { simplePeerJsConf } = require('./conf');

let counter = 0;

async function main({ id: peerId, port, ice }) {
  console.log('Connecting to peer', peerId);
  const connectionManager = new SimplePeerJs(simplePeerJsConf({ ice }));
  const conn = await connectionManager.connect(peerId);

  conn.peer.on('error', err => {
    console.error('Error:', err.toString());
  });

  conn.peer.on('close', () => {
    console.log('Connection closed');
    process.exit(0);
  });

  console.log('Connected!');

  const tcpManager = {};
  const reader = new MuxReader();

  reader.on('data', ({ id, buffer }) => {
    socket = tcpManager[id];
    socket.write(buffer);
  });

  const server = net.createServer();

  server.on('connection', socket => {
    const id = counter++;

    tcpManager[id] = socket;

    socket.on('data', buffer => {
      conn.peer.send(header(id, buffer));
      conn.peer.send(buffer);
    });

    socket.on('end', () => {
      delete tcpManager[id];
    });
  });

  server.listen(port, () => {
    console.log('Listening to', port);
  });

  conn.peer.on('data', buffer => {
    reader.ingest(buffer);
  });
}

module.exports = main;
