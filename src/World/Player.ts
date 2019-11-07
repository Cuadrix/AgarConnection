import { Cell } from "./Cell";
import { World } from "./World";

export class Player {

	public world: World;
	public state: Player.State;
	public cells: Map<number, Cell>;
	public ids: Set<number>;

	public constructor(world: World) {
		this.world = world;
		this.state = Player.State.STANDBY;
		this.cells = new Map();
		this.ids = new Set();
	}
}

export namespace Player {

	export enum State {
		ALIVE,
		SPECTATING,
		STANDBY,
	}

}
