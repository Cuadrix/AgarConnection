const errInvalidSource = new Error("invalid source");
const errShortBuffer = new Error("short buffer");
class Reader {

	public dataView: DataView;
	public index: number = 0;
	public maxIndex: number = 0;
	public buffer: Buffer;

	constructor(ab: any) {
		this.dataView = new DataView(ab);
		this.buffer = Buffer.from(new Uint8Array(ab).buffer);
		this.maxIndex = this.dataView.byteLength;

	}

	public readUInt8() {
		const ue = this.dataView.getUint8(this.index);
		return this.index++ , ue;
	}

	public readInt8() {
		const ue = this.dataView.getInt8(this.index);
		return this.index++ , ue;
	}

	public readUInt16() {
		const ue = this.dataView.getUint16(this.index, true);
		return this.index += 2, ue;
	}

	public readInt16() {
		const ue = this.dataView.getInt16(this.index, true);
		return this.index += 2, ue;
	}

	public readUInt32() {
		const ue = this.dataView.getUint32(this.index, true);
		return this.index += 4, ue;
	}

	public readInt32() {
		const ue = this.dataView.getInt32(this.index, true);
		return this.index += 4, ue;
	}

	public readFloat32() {
		const ue = this.dataView.getFloat32(this.index, true);
		return this.index += 4, ue;
	}

	public readFloat64() {
		const ue = this.dataView.getFloat64(this.index, true);
		return this.index += 8, ue;
	}

	public readUTF8string() {
		let ue = "";
		for (; !this.endOfBuffer();) {
			const fe = this.readUInt8();
			if (0 === fe) { break; }
			ue += String.fromCharCode(fe);
		}
		return ue;
	}

	public readUTF8stringHSLO() {
		let str: string = "";
		const count = this.readUInt8();
		for (let i = 0; i < count; i++) {
			const char = this.readUInt8();
			str += String.fromCharCode(char);
		}
		return str;
	}

	public readEscapedUTF8string(hslo: boolean = false) {
		let ue: string;
		if (hslo === true) {
			ue = this.readUTF8stringHSLO();
		} else {
			ue = this.readUTF8string();
		}
		return decodeURIComponent(escape(ue));
	}

	public readUTF16string() {
		let ue = "";
		for (; !this.endOfBuffer();) {
			const fe = this.readUInt16();
			if (0 === fe) { break; }
			ue += String.fromCharCode(fe);
		}
		return ue;
	}

	public readUTF16stringHSLO() {
		let str: string = "";
		const count = this.readUInt8();
		for (let i = 0; i < count; i++) {
			const char = this.readUInt16();
			str += String.fromCharCode(char);
		}
		return str;
	}

	public readEscapedUTF16string(hslo: boolean = false) {
		let ue: string;
		if (hslo === true) {
			ue = this.readUTF16stringHSLO();
		} else {
			ue = this.readUTF16string();
		}
		return decodeURIComponent(escape(ue));
	}

	public decompress() {
		const ue = new Uint8Array(this.dataView.buffer);
		const fe = this.readUInt32();
		const he = new Uint8Array(fe);
		this.uncompressBlock(ue.slice(5), he);
		this.dataView = new DataView(he.buffer), this.index = 0, this.maxIndex = this.dataView.byteLength;
	}

	public endOfBuffer() {
		return this.index >= this.maxIndex;
	}

	private copy(dest: Uint8Array, src: Uint8Array, di: number, si: number, len: number): void {
		for (let i = 0; i < len; ++i) {
			dest[di++] = src[si++];
		}
	}

	private uncompressBlock(src: Uint8Array, dest: Uint8Array): number {
		const sn = src.length;
		const dn = dest.length;
		if (sn === 0) {
			return 0;
		}
		for (let si = 0, di = 0; ;) {
			let lLen = src[si] >> 4;
			let mLen = src[si] & 0xf;
			if (++si === sn) {
				throw errInvalidSource;
			}
			if (lLen > 0) {
				if (lLen === 0xf) {
					while (src[si] === 0xff) {
						lLen += 0xff;
						if (++si === sn) {
							throw errInvalidSource;
						}
					}
					lLen += src[si];
					if (++si === sn) {
						throw errInvalidSource;
					}
				}
				if (dn - di < lLen || si + lLen > sn) {
					throw errShortBuffer;
				}
				this.copy(dest, src, di, si, lLen);
				di += lLen;
				si += lLen;
				if (si >= sn) {
					return di;
				}
			}

			si += 2;
			if (si >= sn) {
				throw errInvalidSource;
			}
			const offset = src[si - 2] | (src[si - 1] << 8);
			if (di - offset < 0 || offset === 0) {
				throw errInvalidSource;
			}
			if (mLen === 0xf) {
				while (src[si] === 0xff) {
					mLen += 0xff;
					if (++si === sn) {
						throw errInvalidSource;
					}
				}
				mLen += src[si];
				if (++si === sn) {
					throw errInvalidSource;
				}
			}
			mLen += 4;
			if (dn - di <= mLen) {
				throw errShortBuffer;
			}
			for (; mLen >= offset; mLen -= offset) {
				this.copy(dest, dest, di, di - offset, offset);
				di += offset;
			}
			this.copy(dest, dest, di, di - offset, mLen);
			di += mLen;
		}
	}

}
export { Reader };
