import { Socket } from "./Network/Socket";
import { World } from "./World/World";

export class Client {

	public socket: Socket;
	public world: World;

	public constructor(socket: Socket) {
		this.socket = socket;
		this.world = new World();
	}

}
