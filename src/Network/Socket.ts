import { EventEmitter } from "events";

export class Socket extends EventEmitter {

	public static rotateKey(key: number): number {
		key = Math.imul(key, 1540483477) | 0;
		key = (Math.imul(key >>> 24 ^ key, 1540483477) | 0) ^ 114296087;
		return (Math.imul(key >>> 13 ^ key, 1540483477) | 0) >>> 15 ^ (Math.imul(key >>> 13 ^ key, 1540483477) | 0);
	}

	public static xorMessageBytes(message: DataView, key: number): DataView {
		for (let i = 0; i < message.byteLength; i++) {
			message.setUint8(i, message.getUint8(i) ^ key >>> i % 4 * 8 & 255);
		}

		return message;
	}

	public webSocket: WebSocket;
	public url: string;
	public encryptionKey: number;
	public decryptionKey: number;
	public clientVersionInt: number;
	public protocolVersionInt: number;

	public connect(url: string): void {
		this.webSocket = new WebSocket(this.url = url);

		this.webSocket.binaryType = "arraybuffer";

		this.webSocket.addEventListener("open", () => this.emit("open"));
		this.webSocket.addEventListener("message", (event: MessageEvent) => this.onMessage(event.data));
		this.webSocket.addEventListener("close", () => {
			this.emit("close");
			this.disconnect();
		});
	}

	public send(buffer: ArrayBuffer): void {
		if (this.isActive) {
			if (this.encryptionKey) {
				let view = new DataView(buffer);
				view = Socket.xorMessageBytes(view, this.encryptionKey);
				this.encryptionKey = Socket.rotateKey(this.encryptionKey);
				this.webSocket.send(buffer);
			}
		}
	}

	public onMessage(buffer: ArrayBuffer): void {
		let view = new DataView(buffer);
		if (this.decryptionKey) {
			view = Socket.xorMessageBytes(view, this.decryptionKey ^ this.clientVersionInt);
		}
		this.emit("message", view.buffer);
	}

	public disconnect() {
		if (this.isActive) {
			this.webSocket.close();
		}

		this.webSocket = null;
		this.url = null;
	}

	public get isActive(): boolean {
		return this.webSocket !== null && this.webSocket.readyState === WebSocket.OPEN;
	}

}
