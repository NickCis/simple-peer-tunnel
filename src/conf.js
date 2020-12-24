const fetch = require('node-fetch');
const WebSocket = require('ws');
const wrtc = require('wrtc');

function simplePeerJsConf({ ice } = {}) {
  const conf = { fetch, WebSocket, wrtc };

  if (ice && ice.length) {
    const iceServers = [];

    for (const server of ice) {
      const url = new URL(server);
      const iceServer = {
        urls: [
          [url.protocol, url.host, url.pathname, url.search, url.hash]
            .filter(Boolean)
            .join(''),
        ],
      };

      if (url.username && url.password) {
        iceServer.username = decodeURIComponent(url.username);
        iceServer.credential = decodeURIComponent(url.password);
      }

      iceServers.push(iceServer);
    }

    conf.simplePeer = {
      config: { iceServers },
    };
  }

  return conf;
}

module.exports = {
  simplePeerJsConf,
};
