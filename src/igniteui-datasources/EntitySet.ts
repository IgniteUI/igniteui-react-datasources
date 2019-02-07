export class EntitySet {
	constructor(name: string, entityType: string) {
		this.name = name;
		this.entityType = entityType;
		if (entityType.indexOf(".") >= 0) {
			let parts: string[] = entityType.split('.');
			if (parts.length == 2) {
				this.entityNamespace = parts[0];
				this.entityName = parts[1];
			} else {
				let i: number = entityType.lastIndexOf('.');
				this.entityNamespace = entityType.substr(0, i);
				this.entityName = entityType.substr(i + 1);
			}
		} else {
			this.entityNamespace = entityType;
			this.entityName = entityType;
		}
	}
	private _entityName: string = null;
	get entityName(): string {
		return this._entityName;
	}
	set entityName(value: string) {
		this._entityName = value;
	}
	private _entityNamespace: string = null;
	get entityNamespace(): string {
		return this._entityNamespace;
	}
	set entityNamespace(value: string) {
		this._entityNamespace = value;
	}
	private _entityType: string = null;
	get entityType(): string {
		return this._entityType;
	}
	set entityType(value: string) {
		this._entityType = value;
	}
	private _name: string = null;
	get name(): string {
		return this._name;
	}
	set name(value: string) {
		this._name = value;
	}
}


