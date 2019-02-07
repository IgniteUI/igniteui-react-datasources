import { IDataSourcePage, IDataSourcePage_$type } from "igniteui-core/IDataSourcePage";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { ISectionInformation } from "igniteui-core/ISectionInformation";
import { DataSourceSchemaPropertyType } from "igniteui-core/DataSourceSchemaPropertyType";

export class ODataDataSourcePage implements IDataSourcePage {
	private _actualData: Map<string, any>[] = null;
	private _schema: IDataSourceSchema = null;
	private _pageIndex: number = 0;
	private _groupInformation: ISectionInformation[] = null;
	constructor(sourceData_: any, schema: IDataSourceSchema, groupInformation: ISectionInformation[], pageIndex: number) {
		if (sourceData_ == null) {
			this._actualData = null;
		} else {
			let count = <number>(sourceData_.value.length);
			this._actualData = <Map<string, any>[]>[];
			let dateProps = new Set<string>();
			for (let i = 0; i < schema.propertyNames.length; i++) {
				if (schema.propertyTypes[i] == DataSourceSchemaPropertyType.DateTimeValue || schema.propertyTypes[i] == DataSourceSchemaPropertyType.DateTimeOffsetValue) {
					dateProps.add(schema.propertyNames[i]);
				}
			}
			let value_: any;
			for (let i_ = 0; i_ < count; i_++) {
				let currItem_ = sourceData_.value[i_];
				let dict = new Map<string, any>();
				let properties = <any[]>Array.from(Object.keys(currItem_));
				let values = <any[]>(properties.map((k) => currItem_[k]));
				for (let i1 = 0; i1 < properties.length; i1++) {
					value_ = values[i1];
					if (dateProps.has(<string>properties[i1])) {
						value_ = new Date(value_);
					}
					dict.set(<string>properties[i1], value_);
				}
				this._actualData[i_] = dict;
			}
		}
		this._schema = schema;
		this._groupInformation = groupInformation;
		this._pageIndex = pageIndex;
	}
	count(): number {
		return this._actualData.length;
	}
	getItemAtIndex(index: number): any {
		return this._actualData[index];
	}
	getItemValueAtIndex(index: number, valueName: string): any {
		let item = this._actualData[index];
		if (!item.has(valueName)) {
			return null;
		}
		return item.get(valueName);
	}
	pageIndex(): number {
		return this._pageIndex;
	}
	schema(): IDataSourceSchema {
		return this._schema;
	}
	getGroupInformation(): ISectionInformation[] {
		return this._groupInformation;
	}
}


