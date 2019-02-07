import { Base, Number_$type, runOn, Type, markType } from "igniteui-core/type";
import { IDataSourceVirtualDataProvider, IDataSourceVirtualDataProvider_$type } from "igniteui-core/IDataSourceVirtualDataProvider";
import { IDataSourceDataProvider } from "igniteui-core/IDataSourceDataProvider";
import { ISupportsDataChangeNotifications } from "igniteui-core/ISupportsDataChangeNotifications";
import { IDataSourceSupportsCount } from "igniteui-core/IDataSourceSupportsCount";
import { IDataSourcePage } from "igniteui-core/IDataSourcePage";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { IDataSourceExecutionContext } from "igniteui-core/IDataSourceExecutionContext";
import { IDataSourceDataProviderUpdateNotifier } from "igniteui-core/IDataSourceDataProviderUpdateNotifier";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { LinkedList, LinkedListNode } from "./util";
import { NotifyCollectionChangedEventArgs } from "igniteui-core/NotifyCollectionChangedEventArgs";
import { DataSourcePageRequestPriority } from "igniteui-core/DataSourcePageRequestPriority";
import { ODataVirtualDataSourceDataProviderWorker } from "./ODataVirtualDataSourceDataProviderWorker";
import { AsyncVirtualDataSourceProviderWorker } from "igniteui-core/AsyncVirtualDataSourceProviderWorker";
import { ODataVirtualDataSourceDataProviderWorkerSettings } from "./ODataVirtualDataSourceDataProviderWorkerSettings";
import { AsyncVirtualDataSourceDataProviderWorkerSettings } from "igniteui-core/AsyncVirtualDataSourceDataProviderWorkerSettings";
import { DataSourceDataProviderSchemaChangedEventArgs } from "igniteui-core/DataSourceDataProviderSchemaChangedEventArgs";
import { DataSourceSchemaPropertyType } from "igniteui-core/DataSourceSchemaPropertyType";
import { stringContains } from "igniteui-core/string";

export class ODataVirtualDataSourceDataProvider extends Base implements IDataSourceVirtualDataProvider {
	static $t: Type = markType(ODataVirtualDataSourceDataProvider, 'ODataVirtualDataSourceDataProvider', (<any>Base).$type, [IDataSourceVirtualDataProvider_$type]);
	private _worker: ODataVirtualDataSourceDataProviderWorker = null;
	private _requests: LinkedList<number> = new LinkedList<number>();
	private _callback: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void = null;
	constructor() {
		super();
		this._sortDescriptions = new SortDescriptionCollection();
		this._sortDescriptions.onChanged = () => this.sortDescriptions_CollectionChanged(null, null);
		this._groupDescriptions = new SortDescriptionCollection();
		this._groupDescriptions.onChanged = () => this.groupDescriptions_CollectionChanged(null, null);
		this._filterExpressions = new FilterExpressionCollection();
		this._filterExpressions.onChanged = () => this.filterExpressions_CollectionChanged(null, null);
	}
	private filterExpressions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	private sortDescriptions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	private groupDescriptions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	addPageRequest(pageIndex: number, priority: DataSourcePageRequestPriority): void {
		if (this.deferAutoRefresh) {
			return;
		}
		if (this._worker != null && this._worker.isShutdown) {
			this._worker = null;
			this._callback = null;
		}
		if (this._worker == null) {
			this.createWorker();
		}
		if (priority == DataSourcePageRequestPriority.High) {
			this._requests.addFirst(pageIndex);
		} else {
			this._requests.addLast(pageIndex);
		}
		if (!this._worker.addPageRequest(pageIndex, priority)) {
			this._worker = null;
			this._callback = null;
			this.addPageRequest(pageIndex, priority);
		}
	}
	private createWorker(): void {
		if (!this.valid()) {
			return;
		}
		this._callback = runOn(this, this.raisePageLoaded);
		let settings = this.getWorkerSettings();
		this._worker = new ODataVirtualDataSourceDataProviderWorker(settings);
	}
	private valid(): boolean {
		return this.entitySet != null && this.baseUri != null;
	}
	private getWorkerSettings(): ODataVirtualDataSourceDataProviderWorkerSettings {
		return ((() => {
			let $ret = new ODataVirtualDataSourceDataProviderWorkerSettings();
			$ret.baseUri = this._baseUri;
			$ret.entitySet = this._entitySet;
			$ret.pageSizeRequested = this._pageSizeRequested;
			$ret.timeoutMilliseconds = this._timeoutMilliseconds;
			$ret.pageLoaded = this._callback;
			$ret.executionContext = this._executionContext;
			$ret.sortDescriptions = this._sortDescriptions;
			$ret.groupDescriptions = this._groupDescriptions;
			$ret.filterExpressions = this._filterExpressions;
			$ret.propertiesRequested = this._propertiesRequested;
			return $ret;
		})());
	}
	removePageRequest(pageIndex: number): void {
		let current = this._requests.first;
		while (current != null) {
			if (current.value == pageIndex) {
				this._requests.remove(current);
			}
			current = current.next;
		}
		if (this._worker == null) {
			return;
		}
		this._worker.removePageRequest(pageIndex);
	}
	removeAllPageRequests(): void {
		this._requests.clear();
		if (this._worker == null) {
			return;
		}
		this._worker.removeAllPageRequests();
	}
	close(): void {
		if (this._worker != null) {
			this._worker.shutdown();
			this._worker = null;
			this._callback = null;
		}
	}
	private _pageLoaded: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void = null;
	get pageLoaded(): (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void {
		return this._pageLoaded;
	}
	set pageLoaded(value: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void) {
		this._pageLoaded = value;
		this.queueAutoRefresh();
	}
	private raisePageLoaded(page: IDataSourcePage, fullCount: number, actualPageSize: number): void {
		if (this._pageLoaded != null) {
			this._currentFullCount = fullCount;
			if (this._currentSchema == null) {
				let currentSchema: IDataSourceSchema = null;
				if (page != null) {
					currentSchema = page.schema();
				}
				this._currentSchema = currentSchema;
				if (this.schemaChanged != null) {
					this.schemaChanged(this, new DataSourceDataProviderSchemaChangedEventArgs(this._currentSchema, this._currentFullCount));
				}
			}
			if (page.pageIndex() != ODataVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
				this._pageLoaded(page, fullCount, actualPageSize);
			}
		}
	}
	private killWorker(): void {
		if (this._worker != null) {
			this._worker.shutdown();
			this._worker = null;
			this._callback = null;
		}
	}
	private _pageSizeRequested: number = 50;
	get pageSizeRequested(): number {
		return this._pageSizeRequested;
	}
	set pageSizeRequested(value: number) {
		this._pageSizeRequested = value;
		this.queueAutoRefresh();
	}
	private _baseUri: string = null;
	get baseUri(): string {
		return this._baseUri;
	}
	set baseUri(value: string) {
		let oldValue = this._baseUri;
		this._baseUri = value;
		if (oldValue != this._baseUri) {
			this.queueAutoRefresh();
			if (this.valid() && this.deferAutoRefresh) {
				this.queueSchemaFetch();
			}
		}
	}
	private _entitySet: string = null;
	get entitySet(): string {
		return this._entitySet;
	}
	set entitySet(value: string) {
		let oldValue = this._entitySet;
		this._entitySet = value;
		if (oldValue != this._entitySet) {
			this.queueAutoRefresh();
			if (this.valid() && this.deferAutoRefresh) {
				this.queueSchemaFetch();
			}
		}
	}
	private _timeoutMilliseconds: number = 10000;
	get timeoutMilliseconds(): number {
		return this._timeoutMilliseconds;
	}
	set timeoutMilliseconds(value: number) {
		this._timeoutMilliseconds = value;
		this.queueAutoRefresh();
	}
	getItemValue(item: any, valueName: string): any {
		let dic = <Map<string, any>>item;
		if (dic.has(valueName)) {
			return dic.get(valueName);
		} else {
			return null;
		}
	}
	schemaChanged: (sender: any, args: DataSourceDataProviderSchemaChangedEventArgs) => void = null;
	private _currentFullCount: number = 0;
	private _currentSchema: IDataSourceSchema = null;
	get actualCount(): number {
		return this._currentFullCount;
	}
	get actualSchema(): IDataSourceSchema {
		return this._currentSchema;
	}
	private _executionContext: IDataSourceExecutionContext = null;
	get executionContext(): IDataSourceExecutionContext {
		return this._executionContext;
	}
	set executionContext(value: IDataSourceExecutionContext) {
		this._executionContext = value;
		this.queueAutoRefresh();
	}
	private _updateNotifier: IDataSourceDataProviderUpdateNotifier = null;
	get updateNotifier(): IDataSourceDataProviderUpdateNotifier {
		return this._updateNotifier;
	}
	set updateNotifier(value: IDataSourceDataProviderUpdateNotifier) {
		this._updateNotifier = value;
	}
	private _deferAutoRefresh: boolean = false;
	get deferAutoRefresh(): boolean {
		return this._deferAutoRefresh;
	}
	set deferAutoRefresh(value: boolean) {
		this._deferAutoRefresh = value;
		if (!this._deferAutoRefresh) {
			this.queueAutoRefresh();
		}
		if (this._deferAutoRefresh && this.valid() && this._currentSchema == null) {
			this.queueSchemaFetch();
		}
	}
	get isSortingSupported(): boolean {
		return true;
	}
	get isGroupingSupported(): boolean {
		return true;
	}
	get isFilteringSupported(): boolean {
		return true;
	}
	private _sortDescriptions: SortDescriptionCollection = null;
	get sortDescriptions(): SortDescriptionCollection {
		return this._sortDescriptions;
	}
	private _groupDescriptions: SortDescriptionCollection = null;
	get groupDescriptions(): SortDescriptionCollection {
		return this._groupDescriptions;
	}
	private _propertiesRequested: string[] = null;
	get propertiesRequested(): string[] {
		return this._propertiesRequested;
	}
	set propertiesRequested(value: string[]) {
		this._propertiesRequested = value;
		this.queueAutoRefresh();
	}
	private _filterExpressions: FilterExpressionCollection = null;
	get filterExpressions(): FilterExpressionCollection {
		return this._filterExpressions;
	}
	get notifyUsingSourceIndexes(): boolean {
		return true;
	}
	get isItemIndexLookupSupported(): boolean {
		return false;
	}
	get isKeyIndexLookupSupported(): boolean {
		return false;
	}
	notifySetItem(index: number, oldItem: any, newItem: any): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifySetItem(index, oldItem, newItem);
		}
	}
	notifyClearItems(): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifyClearItems();
		}
	}
	notifyInsertItem(index: number, newItem: any): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifyInsertItem(index, newItem);
		}
	}
	notifyRemoveItem(index: number, oldItem: any): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifyRemoveItem(index, oldItem);
		}
	}
	_schemaFetchQueued: boolean = false;
	queueSchemaFetch(): void {
		if (this._schemaFetchQueued) {
			return;
		}
		if (this.executionContext != null) {
			this._schemaFetchQueued = true;
			this.executionContext.enqueueAction(runOn(this, this.doSchemaFetchInternal));
		}
	}
	doSchemaFetchInternal(): void {
		if (!this._schemaFetchQueued) {
			return;
		}
		this._schemaFetchQueued = false;
		this.schemaFetchInternal();
	}
	schemaFetchInternal(): void {
		this.schemaFetchInternalOverride();
	}
	protected schemaFetchInternalOverride(): void {
		if (!this.deferAutoRefresh) {
			return;
		}
		this.removeAllPageRequests();
		this.killWorker();
		this.createWorker();
		this.addSchemaRequest();
	}
	private addSchemaRequest(): void {
		this._worker.addPageRequest(ODataVirtualDataSourceDataProviderWorker.schemaRequestIndex, DataSourcePageRequestPriority.High);
	}
	_autoRefreshQueued: boolean = false;
	queueAutoRefresh(): void {
		if (this.deferAutoRefresh) {
			return;
		}
		if (this._autoRefreshQueued) {
			return;
		}
		if (this.executionContext != null) {
			this._autoRefreshQueued = true;
			this.executionContext.enqueueAction(runOn(this, this.doRefreshInternal));
		}
	}
	doRefreshInternal(): void {
		if (this.deferAutoRefresh) {
			this._autoRefreshQueued = false;
			return;
		}
		if (!this._autoRefreshQueued) {
			return;
		}
		this._autoRefreshQueued = false;
		this.refreshInternal();
	}
	refreshInternal(): void {
		this.refreshInternalOverride();
	}
	protected refreshInternalOverride(): void {
		this.removeAllPageRequests();
		this.killWorker();
		this.createWorker();
		this._worker.addPageRequest(0, DataSourcePageRequestPriority.Normal);
	}
	flushAutoRefresh(): void {
		this.doRefreshInternal();
	}
	refresh(): void {
		this.refreshInternal();
	}
	indexOfItem(item: any): number {
		return -1;
	}
	indexOfKey(key: any[]): number {
		return -1;
	}
	resolveSchemaPropertyType(propertyPath: string): DataSourceSchemaPropertyType {
		if (this.actualSchema == null) {
			return DataSourceSchemaPropertyType.ObjectValue;
		}
		if (stringContains(propertyPath, ".")) {
			return DataSourceSchemaPropertyType.ObjectValue;
		}
		for (let i = 0; i < this.actualSchema.propertyNames.length; i++) {
			let name = this.actualSchema.propertyNames[i];
			if (name == propertyPath) {
				return this.actualSchema.propertyTypes[i];
			}
		}
		return DataSourceSchemaPropertyType.ObjectValue;
	}
}


