const App = new class {
    constructor() {
        this.url = "";
        this.socket = null;
        this.protocol = 21;
        this.clientVersionString = "3.5.7";
        this.cells = new Map;
        this.playerids = new Set;
        this.connectionOpened = false;
        this.clientKey = null;
        this.protocolKey = null;
        this.border = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        }
    }
    sendAction(action) {
        var view = new DataView(new ArrayBuffer(1));
        view.setUint8(0, action);
        this.sendPacket(view);
    }
    spectate() {
        this.sendAction(1);
    }
    freespectate() {
        this.sendAction(18);
    }
    split() {
        this.sendAction(17);
    }
    feed() {
        this.sendAction(21);
    }
    get clientVersion() {
        return this.clientVersionString.replace(/\./g, "0")
    };
    send(packet) {
        if (this.socket != null && this.socket.readyState === WebSocket.OPEN) this.socket.send(packet);
    }
    sendPacket(packet) {
        if (this.connectionOpened === true) {
            packet = this.shiftMessage(packet, this.clientKey);
            this.clientKey = this.shiftKey(this.clientKey);
        }
        this.send(packet);
    }
    resetConnection() {
        if (this.socket != null) this.socket.close();
        this.border = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        }
        this.connectionOpened = false;
        this.clientKey = null;
        this.protocolKey = null;
        this.cells.clear()
        this.playerids.clear();
    }
    connect(ip) {
        this.resetConnection();
        this.socket = new WebSocket(ip);
        this.url = ip;
        this.socket.binaryType = "arraybuffer";
        this.socket.onmessage = (packet) => {
            packet = new DataView(packet.data)
            if (this.protocolKey) {
                packet = this.shiftMessage(packet, this.protocolKey ^ this.clientVersion)
            }
            this.readPacket(packet);
        }
        this.socket.onopen = () => {
            this.handshake1();
            this.handshake2();
            this.connectionOpened = true;
        }
    }
    handshake1() {
        const PACKET254 = new DataView(new ArrayBuffer(5));
        PACKET254.setUint8(0, 254);
        PACKET254.setUint32(1, this.protocol, true);
        this.sendPacket(PACKET254);
    }
    handshake2() {
        const PACKET255 = new DataView(new ArrayBuffer(5));
        PACKET255.setUint8(0, 255);
        PACKET255.setUint32(1, this.clientVersion, true);
        this.sendPacket(PACKET255);
    }
    readPacket(packet) {
        const buf = new Reader(packet);
        const opCode = buf.readUInt8();
        switch (opCode) {
            case 241:
                this.protocolKey = buf.readUInt32();
                console.info("Received protocol key: " + this.protocolKey);
                this.clientKey = this.generateClientKey(this.url, new Uint8Array(buf.dataView.buffer, buf.index));
                console.info("Received client key: " + this.clientKey);
                break;
            case 226: // Ping Pong
                var packet = buf.readUInt16();
                var pong = new DataView(new ArrayBuffer(3));
                pong.setUint8(0, 227);
                pong.setUint16(1, packet)
                this.sendPacket(pong);
                break;
            case 255:
                this.compressedPacket(buf)
                break;
            default:
                console.warn("Unknown Opcode: " + opCode);
                break;
        }
    }
    compressedPacket(buf) {
        buf.decompress();
        const opCode = buf.readUInt8();
        switch (opCode) {
            case 16:
                this.worldUpdate(buf)
                break;
            case 64:
                this.borderUpdate(buf)
                break;
        }
    }
    worldUpdate(buf) {
        var length = buf.readUInt16();
        for (; length--;) {
            const killedID = buf.readUInt32(),
                killerID = buf.readUInt32();
        }
        for (; !buf.endOfBuffer();) {
            const id = buf.readUInt32();
            if (0 === id) break; //Read until id = 0
            var cell = this.newCell(id);
            cell.x = buf.readInt32();
            cell.y = buf.readInt32();
            cell.size = buf.readUInt16();
            const flags = buf.readUInt8(),
                flags2 = 128 & flags ? buf.readUInt8() : 0;
            if (1 & flags && (cell.isVirus = !0), 2 & flags) {
                const r = buf.readUInt8(),
                    g = buf.readUInt8(),
                    b = buf.readUInt8();
                cell.setColor(r, g, b)
            }
            4 & flags && (cell.setSkin(buf.readUTF8string()));
            8 & flags && (cell.nick = buf.readEscapedUTF8string());
            32 & flags && (cell.isEjected = !0);
            1 & flags2 && (cell.isFood = !0);
            2 & flags2 && (cell.isFriend = !0);
            4 & flags2 && (cell.account = buf.readUInt32());
            if (this.playerids.has(id)) cell.isMe = true;
            this.cells.set(id, cell);
        }
        for (length = buf.readUInt16(); length--;) {
            const removedID = buf.readUInt32();
            this.removeCell(removedID);
        }
    }
    newCell(id) {
        var cell;
        if (this.cells.has(id)) {
            cell = this.cells.get(id);
        } else {
            cell = new Cell(id);
        }
        return cell;
    }
    removeCell(id) {
        this.cells.delete(id);
        if (this.playerids.has(id)) this.playerids.delete(id);
    }
    borderUpdate(buf) {
        this.border.left = buf.readFloat64();
        this.border.top = buf.readFloat64();
        this.border.right = buf.readFloat64();
        this.border.bottom = buf.readFloat64();
    }
    generateClientKey(d, t) {
        if (!d.length || !t.byteLength) {
            return null;
        }
        var x = null;
        var s = d.match(/(ws+:\/\/)([^:]*)(:\d+)/)[2];
        var newLength = s.length + t.byteLength;
        var result = new Uint8Array(newLength);
        var i = 0;
        for (; i < s.length; i++) {
            result[i] = s.charCodeAt(i);
        }
        result.set(t, s.length);
        var view = new DataView(result.buffer);
        var newEnd = newLength - 1;
        var j = 0 | 4 + (-4 & newEnd - 4);
        var v = 255 ^ newEnd;
        var index = 0;
        for (; 3 < newEnd;) {
            x = 0 | Math.imul(view.getInt32(index, true), 1540483477);
            v = (0 | Math.imul(x >>> 24 ^ x, 1540483477)) ^ (0 | Math.imul(v, 1540483477));
            newEnd = newEnd - 4;
            index = index + 4;
        }
        switch (newEnd) {
            case 3:
                v = result[j + 2] << 16 ^ v;
                v = result[j + 1] << 8 ^ v;
                break;
            case 2:
                v = result[j + 1] << 8 ^ v;
                break;
            case 1:
                break;
            default:
                x = v;
        }
        return (
            x != v && (x = 0 | Math.imul(result[j] ^ v, 1540483477)),
            (x = x ^ (v = x >>> 13)),
            (x = 0 | Math.imul(x, 1540483477)),
            (x = x ^ (v = x >>> 15)),
            x
        );
    }
    shiftKey(e) {
        return (
            (e = 0 | Math.imul(e, 1540483477)),
            (e = 114296087 ^ (0 | Math.imul((e >>> 24) ^ e, 1540483477))),
            ((e = 0 | Math.imul((e >>> 13) ^ e, 1540483477)) >>> 15) ^ e
        );
    }
    shiftMessage(a, t) {
        var i = 0;
        for (; i < a.byteLength; i++) {
            a.setUint8(i, a.getUint8(i) ^ 255 & t >>> 8 * (i % 4));
        }
        return a;
    }
}
class Cell {
    constructor(id) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.name = "";
        this.skin = "";
        this.hex = "#000";
        this.isVirus = false;
        this.isFood = false;
        this.isFriend = false;
        this.isEjected = false;
        this.account = null;
        this.isMe = false;
    }
    setSkin(skin) {
        this.skin = skin;
    }
    setColor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

}
class Reader {
    constructor(view) {
        this.dataView = view, this.index = 0, this.maxIndex = view.byteLength
    }
    readUInt8() {
        const view = this.dataView.getUint8(this.index, !0);
        return this.index++, view
    }
    readInt8() {
        const view = this.dataView.getInt8(this.index, !0);
        return this.index++, view
    }
    readUInt16() {
        const view = this.dataView.getUint16(this.index, !0);
        return this.index += 2, view
    }
    readInt16() {
        const view = this.dataView.getInt16(this.index, !0);
        return this.index += 2, view
    }
    readUInt32() {
        const view = this.dataView.getUint32(this.index, !0);
        return this.index += 4, view
    }
    readInt32() {
        const view = this.dataView.getInt32(this.index, !0);
        return this.index += 4, view
    }
    readFloat32() {
        const view = this.dataView.getFloat32(this.index, !0);
        return this.index += 4, view
    }
    readFloat64() {
        const view = this.dataView.getFloat64(this.index, !0);
        return this.index += 8, view
    }
    skipByte() {
        this.index++
    }
    skipBytes(bytes) {
        this.index += bytes;
    }
    readUTF8string() {
        let string = '';
        for (; !this.endOfBuffer();) {
            const char = this.readUInt8();
            if (0 === char) break;
            string += String.fromCharCode(char)
        }
        return string
    }
    readEscapedUTF8string() {
        const string = this.readUTF8string();
        return decodeURIComponent(escape(string))
    }
    decompress() {
        const ue = new Uint8Array(this.dataView.buffer),
            fe = this.readUInt32(),
            he = new Uint8Array(fe);
        LZ4.decodeBlock(ue.slice(5), he), this.dataView = new DataView(he.buffer), this.index = 0, this.maxIndex = this.dataView.byteLength
    }
    endOfBuffer() {
        return this.index >= this.maxIndex
    }
}