const stream = require("stream");

// Transformablestream allows you to read and write from incoming streams
class TransformableStream extends stream.Transform {
	constructor() {
		super();
		stream.Transform.call(this, { objectMode: true });
	}
	_transform(value, encoding, callback) {
		this.push(value);
		callback();
	}
}

module.exorts = TransformableStream;
