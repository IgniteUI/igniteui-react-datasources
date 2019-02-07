import { AsyncVirtualDataSourceProviderTaskDataHolder } from "igniteui-core/AsyncVirtualDataSourceProviderTaskDataHolder";
import { Base, Type, markType } from "igniteui-core/type";

export class ODataVirtualDataSourceProviderTaskDataHolder extends AsyncVirtualDataSourceProviderTaskDataHolder {
	static $t: Type = markType(ODataVirtualDataSourceProviderTaskDataHolder, 'ODataVirtualDataSourceProviderTaskDataHolder', (<any>AsyncVirtualDataSourceProviderTaskDataHolder).$type);
}


