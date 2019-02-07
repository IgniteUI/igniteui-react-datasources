import { Entity } from "./Entity";
import { EntitySet } from "./EntitySet";
import { XElement } from "igniteui-core/XElement";
import { XName } from "igniteui-core/XName";

export class Schema {
	private _entities: Map<string, Entity> = null;
	private _entitySets: Map<string, EntitySet> = null;
	constructor(namespace: string, entityTypeElements: XElement[], entitySetElements: XElement[]) {
		this.namespace = namespace;
		this.loadEntities(entityTypeElements);
		this.loadEntitySets(entitySetElements);
	}
	get entities(): Map<string, Entity> {
		if (null == this._entities) {
			this._entities = new Map<string, Entity>();
		}
		return this._entities;
	}
	get entitySets(): Map<string, EntitySet> {
		if (null == this._entitySets) {
			this._entitySets = new Map<string, EntitySet>();
		}
		return this._entitySets;
	}
	private _namespace: string = null;
	get namespace(): string {
		return this._namespace;
	}
	set namespace(value: string) {
		this._namespace = value;
	}
	private loadEntities(entityTypeElements: XElement[]): void {
		let list = entityTypeElements;
		let elementCount = list.length;
		let name: XName = XName.get("Name", "");
		for (let i = 0; i < elementCount; i++) {
			let node: XElement = list[i];
			let entity: Entity = new Entity(node.attribute(name).value, node);
			this.entities.set(entity.name, entity);
		}
		;
	}
	private loadEntitySets(entitySetElements: XElement[]): void {
		let list = entitySetElements;
		let elementCount = list.length;
		let nameAttr: XName = XName.get("Name", "");
		let entityType: XName = XName.get("EntityType", "");
		for (let i = 0; i < elementCount; i++) {
			let node: XElement = list[i];
			let entitySet: EntitySet = new EntitySet(node.attribute(nameAttr).value, node.attribute(entityType).value);
			this.entitySets.set(entitySet.name, entitySet);
		}
		;
	}
}


