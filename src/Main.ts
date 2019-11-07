import { Client } from "./Client";
import { PacketManager } from "./Network/PacketManager";
import { Socket } from "./Network/Socket";

(window as any).AgarConnection = new class {

	public url: string;
	public client: Client;
	public protocolVersionInt: number;
	public clientVersionInt: number;
	public packetManager: PacketManager;

	public constructor() {
		this.protocolVersionInt = 22;
		this.clientVersionInt = 31000;
		this.packetManager = new PacketManager();
	}

	public connect(url: string) {
		this.url = url;

		const socket = new Socket();
		socket.protocolVersionInt = this.protocolVersionInt;
		socket.clientVersionInt = this.clientVersionInt;
		socket.connect(this.url);

		socket.on("open", () => {
			this.packetManager.sendHandShake(client, this.protocolVersionInt, this.clientVersionInt);
		});
		socket.on("message", (data: ArrayBuffer) => {
			this.packetManager.decode(client, data);
		});

		const client: Client = new Client(socket);
		this.client = client;
	}

}();
