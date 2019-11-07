import { Client } from "../Client";

export class Cell {

	public x: number;
	public y: number;
	public radius: number;

	public r: number;
	public g: number;
	public b: number;

	public lastUpdateTime: number;

	public type: Cell.Type;
	public nick: string;

	public constructor(public id: number) {
		this.lastUpdateTime = 0;
	}

	public get mass(): number {
		return Math.round(Math.pow(this.radius / 10, 2));
	}

	public setMass(radius: number) {
		this.radius = radius;
	}

	public setColor(r: number, g: number, b: number): void {
		this.r = r;
		this.g = g;
		this.b = b;
	}
}

export namespace Cell {

	export enum Type {
		PLAYER,
		EJECTED,
		FOOD,
		VIRUS,
	}

}
