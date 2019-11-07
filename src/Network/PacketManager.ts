import { EventEmitter } from "events";
import { murmur2 } from "murmurhash-js";
import { Client } from "../Client";
import { Cell } from "../World/Cell";
import { Player } from "../World/Player";
import { Reader } from "./Reader";
import { Writer } from "./Writer";

export class PacketManager extends EventEmitter {

	public sendSpawn(client: Client, nick: string, token?: string) {
		let size = 2 + nick.length;
		if (token) {
			size += 1 + token.length;
		}
		const buf = new Writer(size);
		buf.writeUInt8(0);
		buf.writeString(nick);
		if (token) { buf.writeString(token); }
		client.socket.send(buf.dataView.buffer);
	}

	public sendHandShake(client: Client, protocol: number, clientVersionInt: number) {
		let buf = new Writer(5);
		buf.writeUInt8(254);
		buf.writeUInt32(protocol);
		client.socket.webSocket.send(buf.buffer);
		buf = new Writer(5);
		buf.writeUInt8(255);
		buf.writeUInt32(clientVersionInt);
		client.socket.webSocket.send(buf.buffer);
	}

	public decode(client: Client, data: ArrayBuffer): void {
		const buf = new Reader(data);
		const opcode = buf.readUInt8();
		switch (opcode) {
			case 16:
				for (let eatQueue = buf.readUInt16(); eatQueue--;) {
					const eaterID = buf.readUInt32();
					const victimID = buf.readUInt32();
					const eater = client.world.get(eaterID);
					const victim = client.world.get(victimID);
				}
				for (; !buf.endOfBuffer();) {
					const id = buf.readUInt32();
					if (id === 0) {
						break; // End of record
					}
					const cell = client.world.getOrCreate(id);
					cell.x = buf.readInt32();
					cell.y = buf.readInt32();
					cell.setMass(buf.readUInt16());
					const flags = buf.readUInt8();
					const flags2 = flags & 128 ? buf.readUInt8() : 0;
					if (flags & 1) {
						cell.type = Cell.Type.VIRUS;
					}
					if (flags & 2) {
						cell.setColor(buf.readUInt8(), buf.readUInt8(), buf.readUInt8());
					}
					if (flags & 4) {
						buf.readUTF8string();
					}
					if (flags & 8) {
						cell.nick = buf.readEscapedUTF8string();
					}
					if (flags & 32) {
						cell.type = Cell.Type.EJECTED;
					}
					if (flags2 & 1) {
						cell.type = Cell.Type.FOOD;
					}
					if (flags2 & 4) {
						buf.readUInt32();
					}
					if (cell.type !== Cell.Type.FOOD && cell.type !== Cell.Type.VIRUS && cell.type !== Cell.Type.EJECTED) {
						cell.type = Cell.Type.PLAYER;
					}
					if (client.world.player.ids.has(id)) {
						client.world.player.cells.set(id, cell);
					}
				}
				for (let removeQueue = buf.readUInt16(); removeQueue--;) {
					const id = buf.readUInt32();
					if (client.world.cells.has(id)) {
						client.world.cells.delete(id);
					}
					if (client.world.player.ids.has(id)) {
						client.world.player.ids.delete(id);
						client.world.player.cells.delete(id);
						if (client.world.player.ids.size === 0) {
							client.world.player.state = Player.State.STANDBY;
							this.emit("death");
						}
					}
				}
				break;

			case 17:
				client.world.position.x = buf.readFloat32();
				client.world.position.y = buf.readFloat32();
				client.world.player.state = Player.State.SPECTATING;
				break;

			case 32:
				const playerID = buf.readUInt32();
				client.world.player.state = Player.State.ALIVE;
				if (client.world.player.ids.size === 0) {
					this.emit("spawn");
				}
				client.world.player.ids.add(playerID);
				break;
			case 64:
				if (client.world.border) {
					break;
				}

				const left = buf.readFloat64();
				const top = buf.readFloat64();
				const right = buf.readFloat64();
				const bottom = buf.readFloat64();

				const width = (right - left) | 0;
				const height = (bottom - top) | 0;

				client.world.border = { left, top, right, bottom, width, height };

				const centerX = right + left >> 1;
				const centerY = bottom + top >> 1;

				const offsetX = 7071 + left;
				const offsetY = 7071 + top;
				client.world.offset = { x: offsetX, y: offsetY };
				client.world.position = { x: centerX, y: centerY };
				break;
			case 241:
				client.socket.decryptionKey = buf.readUInt32();
				client.socket.encryptionKey = murmur2(`${client.socket.url.match(/(live-arena-\w+\.agar\.io)/)[1]}${buf.readUTF8string()}`, 255);
				break;
			case 255:
				buf.decompress();
				this.decode(client, buf.dataView.buffer);
				break;
		}

	}
}
