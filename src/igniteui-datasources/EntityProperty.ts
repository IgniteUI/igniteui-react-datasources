export class EntityProperty {
	constructor(name: string, schemaType: string) {
		this.name = name;
		this.type = schemaType;
	}
	private _name: string = null;
	get name(): string {
		return this._name;
	}
	set name(value: string) {
		this._name = value;
	}
	private _isNullable: boolean = false;
	get isNullable(): boolean {
		return this._isNullable;
	}
	set isNullable(value: boolean) {
		this._isNullable = value;
	}
	private _type: string = null;
	get type(): string {
		return this._type;
	}
	set type(value: string) {
		this._type = value;
	}
}


