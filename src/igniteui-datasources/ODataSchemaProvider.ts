import { Schema } from "./Schema";
import { XDocument } from "igniteui-core/XDocument";
import { XElement } from "igniteui-core/XElement";
import { XName } from "igniteui-core/XName";
import { XContainer } from "igniteui-core/XContainer";
import { Enumerable } from "igniteui-core/Enumerable";
import { XNamespace } from "igniteui-core/XNamespace";
import { XObject } from "igniteui-core/XObject";
import { XAttribute } from "igniteui-core/XAttribute";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { DataSourceSchemaPropertyType } from "igniteui-core/DataSourceSchemaPropertyType";
import { EntitySet } from "./EntitySet";
import { Entity } from "./Entity";
import { EntityProperty } from "./EntityProperty";
import { ODataDataSourceSchema } from "igniteui-core/ODataDataSourceSchema";
import { XmlNodeType } from "igniteui-core/xml";
import { toArray, first } from './util';
import { fromEnum, typeCast } from "igniteui-core/type";

export class ODataSchemaProvider {
	private _entityTypeSchemaNamespace: string = null;
	private _entitySetSchemaNamespace: string = null;
	static nS: XNamespace = XNamespace.get("http://docs.oasis-open.org/odata/ns/edm");
	constructor(metadataDocument: string) {
		if (null == metadataDocument) {
			return;
		}
		let xmlDoc: XDocument = XDocument.parse(metadataDocument);
		let schemaElements = toArray<XElement>(first(fromEnum(first(fromEnum(xmlDoc.elements())).elements())).elements1(XName.get("Schema", ODataSchemaProvider.nS.namespaceName)));
		if (null == schemaElements) {
			return;
		}
		let entitySetElements: XElement[] = null;
		let entityTypeElements: XElement[] = null;
		let elementCount = schemaElements.length;
		let entityContainer: XName = XName.get("EntityContainer", ODataSchemaProvider.nS.namespaceName);
		let entitySet: XName = XName.get("EntitySet", ODataSchemaProvider.nS.namespaceName);
		let namespaceAttribute: XName = XName.get("Namespace", "");
		let entityType: XName = XName.get("EntityType", ODataSchemaProvider.nS.namespaceName);
		for (let i = 0; i < elementCount; i++) {
			let node: XElement = schemaElements[i];
			if (node.nodeType != XmlNodeType.Element) {
				continue;
			}
			let schemaElement: XElement = <XElement>schemaElements[i];
			if (null == entitySetElements) {
				let nodes = toArray<XElement>(schemaElement.elements1(entityContainer));
				if (null != nodes && nodes.length > 0) {
					entitySetElements = toArray((typeCast<XElement>((<any>XElement).$type, nodes[0])).elements1(entitySet));
					if (null != entitySetElements) {
						this._entitySetSchemaNamespace = schemaElement.attribute(namespaceAttribute).value;
					}
				}
			}
			if (null == entityTypeElements) {
				entityTypeElements = toArray<XElement>(schemaElement.elements1(entityType));
				if (null != entityTypeElements) {
					this._entityTypeSchemaNamespace = schemaElement.attribute(namespaceAttribute).value;
				}
			}
		}
		if (null == entitySetElements || null == entityTypeElements) {
			return;
		}
		this.schema = new Schema(this._entityTypeSchemaNamespace, entityTypeElements, entitySetElements);
	}
	private _schema: Schema = null;
	private get schema(): Schema {
		return this._schema;
	}
	private set schema(value: Schema) {
		this._schema = value;
	}
	getODataDataSourceSchema(entitySet: string): IDataSourceSchema {
		if (this.schema == null) {
			return null;
		}
		let valueNames: string[] = [];
		let valueTypes: DataSourceSchemaPropertyType[] = [];
		let primaryKey: string[] = [];
		let es: EntitySet = this.schema.entitySets.get(entitySet);
		if (null != es) {
			let entity: Entity = this.schema.entities.get(es.entityName);
			if (null != entity) {
				for (let property of entity.properties.values()) {
					valueNames.push(property.name);
					if (property.type == "Edm.String") {
						valueTypes.push(DataSourceSchemaPropertyType.StringValue);
					} else if (property.type == "Edm.Int16" || property.type == "Edm.Int32") {
						valueTypes.push(DataSourceSchemaPropertyType.IntValue);
					} else if (property.type == "Edm.Boolean") {
						valueTypes.push(DataSourceSchemaPropertyType.BooleanValue);
					} else if (property.type == "Edm.Byte") {
						valueTypes.push(DataSourceSchemaPropertyType.ShortValue);
					} else if (property.type == "Edm.DateTime" || property.type == "Edm.DateTimeOffset") {
						valueTypes.push(DataSourceSchemaPropertyType.DateTimeValue);
					} else if (property.type == "Edm.Int64" ) {
						valueTypes.push(DataSourceSchemaPropertyType.LongValue);
					} else if (property.type == "Edm.Decimal") {
						valueTypes.push(DataSourceSchemaPropertyType.DecimalValue);
					} else if (property.type == "Edm.SByte") {
						valueTypes.push(DataSourceSchemaPropertyType.ShortValue);
					} else {
						valueTypes.push(DataSourceSchemaPropertyType.ObjectValue);
					}
				}
				for (let k of entity.primaryKey) {
					primaryKey.push(k);
				}
			}
		}
		return new ODataDataSourceSchema(valueNames, valueTypes, primaryKey);
	}
}


