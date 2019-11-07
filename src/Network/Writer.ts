class Writer {

	public offset: number;
	private message: any;

	constructor(size?: number) {
		this.message = size ? Buffer.alloc(size) : Buffer.allocUnsafe(65535);
		this.offset = 0;

	}

	public get buffer(): Buffer {
		return this.message.buffer;
	}

	public get dataView(): DataView {
		return new DataView(this.buffer);
	}

	public writeUInt8(value: number): void {
		this.message.writeUInt8(value, this.offset++);
	}

	public writeInt8(value: number): void {
		this.message.writeInt8(value, this.offset++);
	}

	public writeUInt16(value: number): void {
		this.message.writeUInt16LE(value, this.offset);
		this.offset += 2;
	}

	public writeInt16(value: number): void {
		this.message.writeInt16LE(value, this.offset);
		this.offset += 2;
	}

	public writeUInt24(value: number): void {
		this.message.writeUIntLE(value, this.offset, 3);
		this.offset += 3;
	}

	public writeInt24(value: number): void {
		this.message.writeIntLE(value, this.offset, 3);
		this.offset += 3;
	}

	public writeUInt32(value: number): void {
		this.message.writeUInt32LE(value, this.offset);
		this.offset += 4;
	}

	public writeInt32(value: number): void {
		this.message.writeInt32LE(value, this.offset);
		this.offset += 4;
	}

	public writeString(msg: string): void {
		for (let i = 0; i < msg.length; i++) { this.writeUInt8(msg.charCodeAt(i)); }
		this.writeUInt8(0);
	}

	public writeString16(msg: string): void {
		for (let i = 0; i < msg.length; i++) { this.writeUInt16(msg.charCodeAt(i)); }
		this.writeUInt16(0);
	}
	public writeStringHSLO(msg: string): void {
		this.writeUInt8(msg.length);
		for (let i = 0; i < msg.length; i++) { this.writeUInt8(msg.charCodeAt(i)); }
	}

	public writeString16HSLO(msg: string): void {
		this.writeUInt8(msg.length);
		for (let i = 0; i < msg.length; i++) { this.writeUInt16(msg.charCodeAt(i)); }
	}

}
export { Writer };
