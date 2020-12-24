const fetch = require('node-fetch');
const WebSocket = require('ws');
const wrtc = require('wrtc');
const SimplePeerJs = require('simple-peerjs');
const net = require('net');

const { header, MuxReader } = require('./mux');

let counter = 0;

async function main({ id: peerId, port }) {
  console.log('Connecting to peer', peerId);
  const connectionManager = new SimplePeerJs({ fetch, WebSocket, wrtc });
  const conn = await connectionManager.connect(peerId);

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
