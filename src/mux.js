const EventEmitter = require('events');

const State = {
  Idle: 0,
  Reading: 1,
};

class MuxReader extends EventEmitter {
  constructor() {
    super();
    this.state = State.Idle;
    this.current = {};
  }

  ingest(buffer, offset = 0) {
    if (buffer.length <= offset) return;

    const { state, current } = this;
    switch (state) {
      case State.Idle:
        current.id = buffer.readUInt32BE(offset);
        offset += 4;
        current.toRead = buffer.readUInt32BE(offset);
        offset += 4;

        this.state = State.Reading;
        this.ingest(buffer, offset);
        break;

      case State.Reading: {
        if (!current.accumulator) {
          current.acc = Buffer.allocUnsafe(current.toRead);
          current.offset = 0;
        }

        const copied = buffer.copy(current.acc, current.offset, offset);
        current.offset += copied;
        current.toRead -= copied;

        if (current.toRead <= 0) {
          this.emit('data', { id: current.id, buffer: current.acc });

          delete current.id;
          delete current.acc;
          delete current.offset;
          delete current.toRead;

          this.state = State.Idle;
        }

        break;
      }
    }
  }
}

function header(id, buffer) {
  const b = Buffer.allocUnsafe(4 * 2);
  b.writeUInt32BE(id, 0);
  b.writeUInt32BE(buffer.length, 4);
  return b;
}

module.exports = {
  header,
  MuxReader,
};
