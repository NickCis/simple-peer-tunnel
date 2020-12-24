const fetch = require('node-fetch');
const WebSocket = require('ws');
const wrtc = require('wrtc');
const SimplePeerJs = require('simple-peerjs');
const net = require('net');
const { header, MuxReader } = require('./mux');

async function main({ address }) {
  console.log('Starting...');
  console.log('Will redirect connections to', address);
  const [host, port] = address.split('://').slice(-1).pop().split(':');
  const connectionManager = new SimplePeerJs({ fetch, WebSocket, wrtc });
  const peerId = await connectionManager.id;

  console.log('My peer id:', peerId);

  connectionManager.on('connect', conn => {
    console.log('New peer connected:', conn.peerId);
    const reader = new MuxReader();
    const tcpManager = {};

    reader.on('data', async ({ id, buffer }) => {
      if (!tcpManager[id]) {
        tcpManager[id] = new Promise((rs, rj) => {
          const socket = new net.Socket();

          socket.on('error', err => {
            rj(err);
          });

          socket.on('data', buffer => {
            conn.peer.send(header(id, buffer));
            conn.peer.send(buffer);
          });

          socket.on('end', () => {
            delete tcpManager[id];
          });

          socket.connect(port || 80, host || 'localhost', () => {
            rs(socket);
          });
        });
      }

      try {
        const socket = await tcpManager[id];
        socket.write(buffer);
      } catch (e) {
        console.error(e.toString());
      }
    });

    conn.peer.on('data', data => {
      reader.ingest(data);
    });
  });
}

module.exports = main;
