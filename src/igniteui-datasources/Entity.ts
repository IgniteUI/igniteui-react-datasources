import { EntityProperty } from "./EntityProperty";
import { XElement } from "igniteui-core/XElement";
import { XName } from "igniteui-core/XName";
import { XContainer } from "igniteui-core/XContainer";
import { XAttribute } from "igniteui-core/XAttribute";
import { toArray } from './util';

export class Entity {
	private _properties: Map<string, EntityProperty> = null;
	private _primaryKey: string[] = null;
	constructor(name: string, entityNode: XElement) {
		this.name = name;
		this.loadProperties(entityNode);
		this.loadPrimaryKey(entityNode);
	}
	private _name: string = null;
	get name(): string {
		return this._name;
	}
	set name(value: string) {
		this._name = value;
	}
	get properties(): Map<string, EntityProperty> {
		if (null == this._properties) {
			this._properties = new Map<string, EntityProperty>();
		}
		return this._properties;
	}
	get primaryKey(): string[] {
		if (null == this._primaryKey) {
			this._primaryKey = [];
		}
		return this._primaryKey;
	}
	private loadProperties(entityNode: XElement): void {
		let children = toArray<XElement>(entityNode.elements());
		let elementCount = children.length;
		let nameAttr: XName = XName.get("Name", "");
		let typeAttr: XName = XName.get("Type", "");
		for (let i = 0; i < elementCount; i++) {
			let node: XElement = children[i] as XElement;
			if (node.name.localName == "Property") {
				let name: string = node.attribute(nameAttr).value;
				let type: string = node.attribute(typeAttr).value;
				this.properties.set(name, new EntityProperty(name, type));
			}
		}
		;
	}
	private loadPrimaryKey(entityNode: XElement): void {
		let children = toArray<XElement>(entityNode.elements());
		let elementCount = children.length;
		let nameAttr: XName = XName.get("Name", "");
		for (let i = 0; i < elementCount; i++) {
			let node: XElement = children[i] as XElement;
			if (node.name.localName == "Key") {
				let subChildren = toArray<XElement>(node.elements());
				let keyNodeCOunt = subChildren.length;
				for (let j = 0; j < keyNodeCOunt; j++) {
					let keyNode: XElement = subChildren[j] as XElement;
					if (keyNode.name.localName == "PropertyRef") {
						this.primaryKey.push(keyNode.attribute(nameAttr).value);
					}
				}
			}
		}
		;
	}
}


