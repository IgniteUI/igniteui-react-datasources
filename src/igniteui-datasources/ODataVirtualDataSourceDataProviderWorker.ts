import { AsyncVirtualDataSourceProviderWorker } from "igniteui-core/AsyncVirtualDataSourceProviderWorker";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { AsyncVirtualDataSourceProviderTaskDataHolder } from "igniteui-core/AsyncVirtualDataSourceProviderTaskDataHolder";
import { ODataVirtualDataSourceProviderTaskDataHolder } from "./ODataVirtualDataSourceProviderTaskDataHolder";
import { ODataVirtualDataSourceDataProviderWorkerSettings } from "./ODataVirtualDataSourceDataProviderWorkerSettings";
import { SortDescription } from "igniteui-core/SortDescription";
import { ISectionInformation, ISectionInformation_$type } from "igniteui-core/ISectionInformation";
import { AsyncDataSourcePageTaskHolder } from "igniteui-core/AsyncDataSourcePageTaskHolder";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { AsyncVirtualDataTask } from "igniteui-core/AsyncVirtualDataTask";
import { IDataSourceExecutionContext } from "igniteui-core/IDataSourceExecutionContext";
import { IDataSourcePage } from "igniteui-core/IDataSourcePage";
import { ODataDataSourcePage } from "./ODataDataSourcePage";
import { StringBuilder } from "igniteui-core/StringBuilder";
import { DefaultSectionInformation } from "igniteui-core/DefaultSectionInformation";
import { Convert } from "igniteui-core/Convert";
import { ODataSchemaProvider } from "./ODataSchemaProvider";
import { AsyncDataSourcePageRequest } from "igniteui-core/AsyncDataSourcePageRequest";
import { IFilterExpression } from "igniteui-core/IFilterExpression";
import { ODataDataSourceFilterExpressionVisitor } from "igniteui-core/ODataDataSourceFilterExpressionVisitor";
import { FilterExpressionVisitor } from "igniteui-core/FilterExpressionVisitor";
import { ListSortDirection } from "igniteui-core/ListSortDirection";
import { stringIsNullOrEmpty } from "igniteui-core/string";

declare let odatajs: any;

export class ODataVirtualDataSourceDataProviderWorker extends AsyncVirtualDataSourceProviderWorker {
	private _baseUri: string = null;
	private _entitySet: string = null;
	private _sortDescriptions: SortDescriptionCollection = null;
	private _filterExpressions: FilterExpressionCollection = null;
	private _desiredPropeties: string[] = null;
	protected get sortDescriptions(): SortDescriptionCollection {
		return this._sortDescriptions;
	}
	protected get filterExpressions(): FilterExpressionCollection {
		return this._filterExpressions;
	}
	protected get desiredProperties(): string[] {
		return this._desiredPropeties;
	}
	protected initialize(): void {
		super.initialize();
	}
	protected getTaskDataHolder(): AsyncVirtualDataSourceProviderTaskDataHolder {
		let holder: ODataVirtualDataSourceProviderTaskDataHolder = new ODataVirtualDataSourceProviderTaskDataHolder();
		return holder;
	}
	protected getCompletedTaskData(holder: AsyncVirtualDataSourceProviderTaskDataHolder, completed: number): void {
		super.getCompletedTaskData(holder, completed);
	}
	protected removeCompletedTaskData(holder: AsyncVirtualDataSourceProviderTaskDataHolder, completed: number): void {
		super.removeCompletedTaskData(holder, completed);
	}
	protected getTasksData(holder: AsyncVirtualDataSourceProviderTaskDataHolder): void {
		super.getTasksData(holder);
	}

	private *iter(coll: SortDescriptionCollection) {
		for (let i = 0; i < coll.size(); i++) {
			yield coll.get(i);
		}
	}
	private *iterFilter(coll: FilterExpressionCollection) {
		for (let i = 0; i < coll.size(); i++) {
			yield coll.get(i);
		}
	}

	constructor(settings: ODataVirtualDataSourceDataProviderWorkerSettings) {
		super(settings);
		this.doWork = this.doWork.bind(this);
		this._baseUri = settings.baseUri;
		this._entitySet = settings.entitySet;
		this._sortDescriptions = settings.sortDescriptions;
		this._groupDescriptions = settings.groupDescriptions;
		if (this._groupDescriptions != null && this._groupDescriptions.size() > 0) {
			this._sortDescriptions = new SortDescriptionCollection();
			for (let sd of this.iter(settings.sortDescriptions)) {
				this._sortDescriptions.add(sd);
			}
			for (let i = 0; i < this._groupDescriptions.size(); i++) {
				this._sortDescriptions.insert(i, this._groupDescriptions.get(i));
			}
		}
		this._filterExpressions = settings.filterExpressions;
		this._desiredPropeties = settings.propertiesRequested;
		window.setTimeout(this.doWork, 100);
	}
	protected processCompletedTask(completedTask: AsyncDataSourcePageTaskHolder, currentDelay: number, pageIndex: number, taskDataHolder: AsyncVirtualDataSourceProviderTaskDataHolder): void {
		let h: ODataVirtualDataSourceProviderTaskDataHolder = <ODataVirtualDataSourceProviderTaskDataHolder>taskDataHolder;
		let schema: IDataSourceSchema = null;
		let result: any = null;
		let schemaFetchCount: number = -1;
		let task: AsyncVirtualDataTask = <AsyncVirtualDataTask>completedTask.task;
		try {
			if (task.hasErrors) {
				this.retryIndex(pageIndex, currentDelay);
				return;
			}
			if (pageIndex == ODataVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
				result = <any>task.result;
				schemaFetchCount = <number>(result['@odata.count']);
			} else {
				result = <any>task.result;
			}
		}
		catch (e) {
			this.retryIndex(pageIndex, currentDelay);
			return;
		}
		if (schemaFetchCount >= 0) {
			this.actualCount = schemaFetchCount;
		} else {
			this.actualCount = <number>(result['@odata.count']);
		}
		schema = this.actualSchema;
		if (schema == null) {
			if (this._groupDescriptions.size() > 0) {
				this.resolveSchema((s: IDataSourceSchema) => this.resolveGroupInformation((g: ISectionInformation[]) => this.finishProcessingCompletedTask(task, pageIndex, s, result), () => {
					this.retryIndex(pageIndex, currentDelay);
					return;
				}), () => {
					this.retryIndex(pageIndex, currentDelay);
					return;
				});
			} else {
				this.resolveSchema((s: IDataSourceSchema) => this.finishProcessingCompletedTask(task, pageIndex, s, result), () => {
					this.retryIndex(pageIndex, currentDelay);
					return;
				});
			}
			return;
		}
		this.finishProcessingCompletedTask(task, pageIndex, schema, result);
	}
	private _groupInformation: ISectionInformation[] = null;
	private finishProcessingCompletedTask(task: AsyncVirtualDataTask, pageIndex: number, schema: IDataSourceSchema, result: any): void {
		let executionContext: IDataSourceExecutionContext;
		let pageLoaded: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void;
		let groupInformation: ISectionInformation[];
		this.actualSchema = schema;
		executionContext = this.executionContext;
		groupInformation = this._groupInformation;
		pageLoaded = this.pageLoaded;
		let page: ODataDataSourcePage = null;
		if (result != null) {
			page = new ODataDataSourcePage(result, schema, groupInformation, pageIndex);
			if (!this.isLastPage(pageIndex) && page.count() > 0 && !this.populatedActualPageSize) {
				this.populatedActualPageSize = true;
				this.actualPageSize = page.count();
			}
		} else {
			page = new ODataDataSourcePage(null, schema, groupInformation, pageIndex);
		}
		if (this.pageLoaded != null) {
			if (this.executionContext != null) {
				if (executionContext == null || pageLoaded == null) {
					this.shutdown();
					return;
				}
				executionContext.execute(() => pageLoaded(page, this.actualCount, this.actualPageSize));
			} else {
				if (pageLoaded == null) {
					this.shutdown();
					return;
				}
				pageLoaded(page, this.actualCount, this.actualPageSize);
			}
		}
	}
	private resolveGroupInformation(finishAction: (arg1: ISectionInformation[]) => void, failureAction: () => void): void {
		if (this._groupInformation != null) {
			finishAction(this._groupInformation);
			return;
		}
		let orderBy: string = null;
		let groupBy: string = null;
		let filter: string = null;
		if (this._groupDescriptions == null || this._groupDescriptions.size() == 0) {
			finishAction(null);
			return;
		}
		filter = this._filterString;
		this.updateFilterString();
		let sb: string = "";
		if (this.sortDescriptions != null) {
			let first: boolean = true;
			for (let sort of this.iter(this.sortDescriptions)) {
				if (first) {
					first = false;
				} else {
					sb += ", ";
				}
				if (sort.direction == ListSortDirection.Descending) {
					sb += " desc";
				} else {
					sb +=  " asc";
				}
			}
		}
		orderBy = sb.toString();
		let gsb: string = "";
		if (this._groupDescriptions != null) {
			let first1: boolean = true;
			for (let group of this.iter(this._groupDescriptions)) {
				if (first1) {
					first1 = false;
				} else {
					sb += ", ";
				}
				gsb += group.propertyName;
			}
		}
		groupBy = gsb.toString();
		let commandText = this._entitySet + "?$orderby=" + orderBy + "&$apply=";
		if (!stringIsNullOrEmpty(filter)) {
			commandText += "filter(" + filter + ")/";
		}
		commandText += "groupby((" + groupBy + "), aggregate($count as $__count))";
		try {
			let groupInformation: ISectionInformation[] = [];
			let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.groupSuccess(data, response, finishAction, failureAction, groupInformation);
			let failure_: (arg1: any) => void = (err: any) => this.groupError(err, finishAction, failureAction, groupInformation);
			let run_: () => void = null;
			
					var headers = { 'Content - Type': 'application / json', Accept: 'application / json' };
					var request = {
						requestUri: commandText,
						enableJsonpCallback: true,
						method: 'GET',
						headers: headers,
						data: null
					};
					run_ = function () { odatajs.oData.request(
						request,
						success_,
						failure_
					) };
				    ;
			run_();
		}
		catch (e) {
			failureAction();
		}
	}
	private groupError(err: any, finishAction: (arg1: ISectionInformation[]) => void, failureAction: () => void, groupInformation: ISectionInformation[]): void {
		this._groupInformation = null;
	}
	private groupSuccess(data: any, response: any, finishAction: (arg1: ISectionInformation[]) => void, failureAction: () => void, groupInformation: ISectionInformation[]): void {
		let groupNames: string[] = [];
		for (let group of this.iter(this._groupDescriptions)) {
			groupNames.push(group.propertyName);
		}
		let groupNamesArray = groupNames;
		console.log(<string>data);
		this._groupInformation = null;
		finishAction(null);
	}
	private static addGroup(groupInformation: ISectionInformation[], groupNames: string[], groupNamesArray: string[], currentIndex: number, group: Map<string, any>): void {
		let groupValues: any[] = [];
		for (let name of groupNames) {
			if (group.has(name)) {
				groupValues.push(group.get(name));
			}
		}
		let groupCount = 0;
		if (group.has("$__count")) {
			groupCount = Convert.toInt321(group.get("$__count"));
		}
		let groupInfo: DefaultSectionInformation = new DefaultSectionInformation(currentIndex, currentIndex + (groupCount - 1), groupNamesArray, groupValues);
		groupInformation.push(groupInfo);
	}
	private resolveSchema(finishAction: (arg1: IDataSourceSchema) => void, failureAction: () => void): void {
		let success_: (arg1: string) => void = (res: string) => {
			let sp: ODataSchemaProvider = new ODataSchemaProvider(res);
			let schema = sp.getODataDataSourceSchema(this._entitySet);
			finishAction(schema);
		};
		let failure_: () => void = () => failureAction();
		let baseUri_ = this._baseUri;
		var request = new XMLHttpRequest();
			request.onreadystatechange = function () {
				if (request.readyState === 4) {
					if (request.status === 200) {
						success_(request.responseText);
					} else {
						failure_();
					}
				}
			}

			request.open('Get', baseUri_ + '/$metadata');
			request.send();;
	}
	private _filterString: string = null;
	private _selectedString: string = null;
	static readonly schemaRequestIndex: number = -1;
	private _groupDescriptions: SortDescriptionCollection = null;
	protected makeTaskForRequest(request: AsyncDataSourcePageRequest, retryDelay: number): void {
		let actualPageSize: number = 0;
		let sortDescriptions: SortDescriptionCollection = null;
		actualPageSize = this.actualPageSize;
		sortDescriptions = this.sortDescriptions;
		let requestUrl: string = this._baseUri;
		requestUrl += "/" + this._entitySet;
		let queryStarted: boolean = false;
		this.updateFilterString();
		if (this._filterString != null) {
			if (!queryStarted) {
				queryStarted = true;
				requestUrl += "?";
			} else {
				requestUrl += "&";
			}
			requestUrl += "$filter=" + this._filterString;
		}
		if (this.sortDescriptions != null) {
			let sortString: string = null;
			for (let sort of this.iter(this.sortDescriptions)) {
				if (sortString == null) {
					sortString = "";
				} else {
					sortString += ", ";
				}
				if (sort.direction == ListSortDirection.Descending) {
					sortString += sort.propertyName + " desc";
				} else {
					sortString += sort.propertyName;
				}
			}
			if (sortString != null) {
				if (!queryStarted) {
					queryStarted = true;
					requestUrl += "?";
				} else {
					requestUrl += "&";
				}
				requestUrl += "$orderby=" + sortString;
			}
		}
		if (this.desiredProperties != null && this.desiredProperties.length > 0) {
			let selectString: string = "";
			let first: boolean = true;
			let $t = this.desiredProperties;
			for (let i = 0; i < $t.length; i++) {
				let select = $t[i];
				if (first) {
					first = false;
				} else {
					selectString += ", ";
				}
				selectString += select;
			}
			if (!queryStarted) {
				queryStarted = true;
				requestUrl += "?";
			} else {
				requestUrl += "&";
			}
			requestUrl += "$select=" + selectString;
		}
		let task: AsyncVirtualDataTask = new AsyncVirtualDataTask();
		if (request.index == ODataVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
			this.executeRequest(requestUrl, queryStarted, 0, actualPageSize, task);
		} else {
			this.executeRequest(requestUrl, queryStarted, request.index * actualPageSize, actualPageSize, task);
		}
		request.taskHolder = new AsyncDataSourcePageTaskHolder();
		(request.taskHolder as any).task = task;
		this.tasks.add(request);
	}
	private updateFilterString(): void {
		if (this.filterExpressions != null && this.filterExpressions.size() > 0 && this._filterString == null) {
			let sb: string = "";
			let first: boolean = true;
			for (let expr of this.iterFilter(this.filterExpressions)) {
				if (first) {
					first = false;
				} else {
					sb += " AND ";
				}
				let visitor: ODataDataSourceFilterExpressionVisitor = new ODataDataSourceFilterExpressionVisitor(0);
				visitor.visit(expr);
				let txt = visitor.toString();
				if (this.filterExpressions.size() > 1) {
					txt = "(" + txt + ")";
				}
				sb += (txt);
			}
			this._filterString = sb;
		}
	}
	private executeRequest(requestUrl: string, queryStarted: boolean, skip: number, top: number, task: AsyncVirtualDataTask): void {
		if (!queryStarted) {
			queryStarted = true;
			requestUrl += "?";
		} else {
			requestUrl += "&";
		}
		requestUrl += "$skip=" + skip + "&$top=" + top + "&$count=true";
		let requestUrl_ = requestUrl;
		let self_ = this;
		let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.success(task, data, response);
		let failure_: (arg1: any) => void = (err: any) => this.error(task, err);
		let run_: () => void = null;
		
					var headers = { 'Content - Type': 'application / json', Accept: 'application / json' };
					var request = {
						requestUri: requestUrl_,
						enableJsonpCallback: true,
						method: 'GET',
						headers: headers,
						data: null
					};
					run_ = function () { odatajs.oData.request(
						request,
						success_,
						failure_
					) };
				;
		task.run = run_;
	}
	private success(t: AsyncVirtualDataTask, data: any, response: any): void {
		t.result = data;
		t.isCompleted = true;
	}
	private error(t: AsyncVirtualDataTask, result: any): void {
		t.isCompleted = true;
		t.hasErrors = true;
	}
}


