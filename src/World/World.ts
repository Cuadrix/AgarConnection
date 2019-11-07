import { Cell } from "./Cell";
import { Player } from "./Player";

export class World {

	public player: Player;
	public border: World.Border;
	public offset: World.Offset;
	public cells: Map<number, Cell>;
	public position: {
		x: number;
		y: number;
	};

	public constructor() {
		this.player = new Player(this);
		this.border = null;
		this.offset = null;
		this.position = {
			x: 0,
			y: 0,
		};
		this.cells = new Map();
	}

	public remove(id: number): boolean {
		if (this.cells.has(id)) {
			this.cells.delete(id);
			return true;
		} else {
			return false;
		}
	}

	public get(id: number): Cell {
		if (this.cells.has(id)) {
			return this.cells.get(id);
		} else {
			return null;
		}
	}

	public getOrCreate(id: number): Cell {
		let cell = this.get(id);
		if (!cell) {
			cell = new Cell(id);
			this.cells.set(id, cell);
		}
		return cell;
	}

}

export namespace World {

	export interface Border {
		left: number;
		top: number;
		right: number;
		bottom: number;
		width: number;
		height: number;
	}
	export interface Offset {
		x: number;
		y: number;
	}

}
