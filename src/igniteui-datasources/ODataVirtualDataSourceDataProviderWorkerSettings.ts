import { AsyncVirtualDataSourceDataProviderWorkerSettings } from "igniteui-core/AsyncVirtualDataSourceDataProviderWorkerSettings";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { Base, Type, markType } from "igniteui-core/type";

export class ODataVirtualDataSourceDataProviderWorkerSettings extends AsyncVirtualDataSourceDataProviderWorkerSettings {
	static $t: Type = markType(ODataVirtualDataSourceDataProviderWorkerSettings, 'ODataVirtualDataSourceDataProviderWorkerSettings', (<any>AsyncVirtualDataSourceDataProviderWorkerSettings).$type);
	private _baseUri: string = null;
	get baseUri(): string {
		return this._baseUri;
	}
	set baseUri(value: string) {
		this._baseUri = value;
	}
	private _entitySet: string = null;
	get entitySet(): string {
		return this._entitySet;
	}
	set entitySet(value: string) {
		this._entitySet = value;
	}
	private _sortDescriptions: SortDescriptionCollection = null;
	get sortDescriptions(): SortDescriptionCollection {
		return this._sortDescriptions;
	}
	set sortDescriptions(value: SortDescriptionCollection) {
		this._sortDescriptions = value;
	}
	private _filterExpressions: FilterExpressionCollection = null;
	get filterExpressions(): FilterExpressionCollection {
		return this._filterExpressions;
	}
	set filterExpressions(value: FilterExpressionCollection) {
		this._filterExpressions = value;
	}
	private _propertiesRequested: string[] = null;
	get propertiesRequested(): string[] {
		return this._propertiesRequested;
	}
	set propertiesRequested(value: string[]) {
		this._propertiesRequested = value;
	}
	private _groupDescriptions: SortDescriptionCollection = null;
	get groupDescriptions(): SortDescriptionCollection {
		return this._groupDescriptions;
	}
	set groupDescriptions(value: SortDescriptionCollection) {
		this._groupDescriptions = value;
	}
}


