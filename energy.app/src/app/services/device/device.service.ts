import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CookieService } from 'ngx-cookie-service'
import { ApiConfigService, NotificationService } from 'app/services';

@Injectable({
	providedIn: 'root'
})

export class DeviceService {
	cookieName = 'FM';
	protected apiServer = ApiConfigService.settings.apiServer;
	constructor(
		private cookieService: CookieService,
		private httpClient: HttpClient,
		private _notificationService: NotificationService
	) {
		this._notificationService.apiBaseUrl = this.apiServer.baseUrl;
	}
	getdevices() {
		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device').map(response => {
			return response;
		});
	}
	getGatewayLookup() {

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/gateway').map(response => {

			return response;
		});
	}
	getsubcribesyncdata() {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/subscriber/getlastsyncdetails').map(response => {
			return response;
		});
	}

	getChildDevices(parentID, parameters) {

		const parameter = {
			params: {
				'parentDeviceGuid': parentID,
				'pageNo': parameters.pageNo + 1,
				'pageSize': parameters.pageSize,
				'orderBy': parameters.sortBy
			},
			timestamp: Date.now()
		};

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/childdevicelist', parameter).map(response => {
			return response;
		});
	}

	/**
	 * Delete Hardware kit by guid
	 * @param guid
	 */
	deleteHardwarekit(guid) {


		return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/hardwarekit/delete/' + guid, "").map(response => {
			return response;
		});
	}

	deleteDevice(deviceGuid) {


		return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/device/delete/' + deviceGuid, "").map(response => {
			return response;
		});
	}

	uploadPicture(deviceGuid, file) {

		const data = new FormData();
		data.append('image', file);

		return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/device/' + deviceGuid + '/image', data).map(response => {
			return response;
		});
	}

	getDeviceDetails(deviceGuid) {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/' + deviceGuid).map(response => {
			return response;
		});
	}

	addUpdateDevice(data) {

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/device/manage', data).map(response => {
			return response;
		});
	}

	changeStatus(deviceId, isActive) {
		let status = isActive == true ? false : true;
		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/device/updatestatus/' + deviceId + '/' + status, {}).map(response => {
			return response;
		});
	}

	getallkittypes() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};
		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/alltemplate', configHeader).map(response => {
			return response;
		});
	}

	getkittypes() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};
		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/template', configHeader).map(response => {
			return response;
		});
	}

	addUpdateHardwarekit(data, isEdit) {

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/hardwarekit/manage?isEdit=' + isEdit, data).map(response => {
			return response;
		});
	}

	getHardware(parameters) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const parameter = {
			params: {
				'isAssigned': parameters.isAssigned,
				'pageNo': parameters.pageNo + 1,
				'pageSize': parameters.pageSize,
				'searchText': parameters.searchText,
				'orderBy': parameters.sortBy
			},
			timestamp: Date.now()
		};
		var reqParameter = Object.assign(parameter, configHeader);

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/hardwarekit/search', reqParameter).map(response => {
			return response;
		});
	}

	getsubscribers(parameters) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const parameter = {
			params: {
				'pageNo': parameters.pageNo + 1,
				'pageSize': parameters.pageSize,
				'searchText': parameters.searchText,
				'orderBy': parameters.sortBy
			},
			timestamp: Date.now()
		};
		var reqParameter = Object.assign(parameter, configHeader);

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/subscriber/search', reqParameter).map(response => {
			return response;
		});
	}

	getHardwarkitDetails(hardwareGuid) {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/hardwarekit/' + hardwareGuid).map(response => {
			return response;
		});
	}

	uploadFile(data) {

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/hardwarekit/verifykit', data).map(response => {
			return response;
		});
	}

	getHardwarkitDownload() {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/hardwarekit/download').map(response => {
			return response;
		});
	}

	getsubscriberDetail(params) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const parameter = {
			params: {
				'userEmail': params.email
			},
			timestamp: Date.now()
		};
		var reqParameter = Object.assign(parameter, configHeader);

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/subscriber/getsubscriberdetails', reqParameter).map(response => {
			return response;
		});
	}

	getSubscriberKitList(parameters) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const parameter = {
			params: {
				'companyID': parameters.companyID,
				'pageNo': parameters.pageNo + 1,
				'pageSize': parameters.pageSize,
				'searchText': parameters.searchText,
				'orderBy': parameters.sortBy
			},
			timestamp: Date.now()
		};
		var reqParameter = Object.assign(parameter, configHeader);

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/subscriber/getsubscriberkitdetails', reqParameter).map(response => {
			return response;
		});
	}

	uploadData(data) {

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/hardwarekit/uploadkit', data).map(response => {
			return response;
		});
	}

	getgeneraters() {
		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/generator').map(response => {
			return response;
		});
	}

	addUpdateLocation(data) {

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/location/manage', data).map(response => {
			return response;
		});
	}

	getLocationDetails(locationGuid) {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/location/' + locationGuid).map(response => {
			return response;
		});
	}

	addUpdateGenrator(data) {
		const formData = new FormData();
		for (const key of Object.keys(data)) {
			const value = data[key];
			if (data[key])
				formData.append(key, value);
		}

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/generator/manage', formData).map(response => {
			return response;
		});
	}

	// Get Gateway Count
	checkkitCode(data) {

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/generator/ValidateKit/' + data).map(response => {
			return response;
		});
	}

	getgenraterDetails(genraterGuid) {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/generator/' + genraterGuid).map(response => {
			return response;
		});
	}

	deleteGenerator(generatorGuid) {


		return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/generator/delete/' + generatorGuid, "").map(response => {
			return response;
		});
	}

	changegeneratorStatus(generatorId, isActive) {
		let status = isActive == true ? false : true;
		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/generator/updatestatus/' + generatorId + '/' + status, {}).map(response => {
			return response;
		});
	}

	getDeviceList(parameters) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const parameter = {
			params: {
				//'parentEntityGuid': parameters.parentEntityGuid,
				//'entityGuid': parameters.entityGuid,
				'pageNo': parameters.pageNo + 1,
				'pageSize': parameters.pageSize,
				'searchText': parameters.searchText,
				'orderBy': parameters.sortBy
			},
			timestamp: Date.now()
		};
		if(parameters.parentEntityGuid ){
			parameter.params["parentEntityGuid"] = parameters.parentEntityGuid;
			parameter.params["entityGuid"] = parameters.entityGuid;
		}
		
		var reqParameter = Object.assign(parameter, configHeader);

		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/search', reqParameter).map(response => {
			return response;
		});
	}

	getgenraterStatistics(genraterGuid) {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/dashboard/getgeneratordetail/' + genraterGuid).map(response => {
			return response;
		});
	}

	getgenraterTelemetryData(templateGuid) {
		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/devicetags/' + templateGuid).map(response => {
			return response;
		});
	}

	getgenraterMedia(genraterGuid) {


		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/generator/' + genraterGuid).map(response => {
			return response;
		});
	}

	UploadmediaGenrator(data, genraterGuid) {
		const formData = new FormData();
		for (const key of Object.keys(data)) {
			const value = data[key];
			formData.append('files', value);
		}

		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/generator/fileupload/' + genraterGuid, formData).map(response => {
			return response;
		});
	}

	deleteFiles(generatorGuid, fileguid) {


		return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/generator/deletemediafile/' + generatorGuid + '/' + fileguid, "").map(response => {
			return response;
		});
	}

	//key : UIAlert || LiveData
	getStompConfig(key) {
		return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/configuration/' + key).map(response => {
			return response;
		});
	}
	// Get getWaterUsageChartData
	getFuelUsageChartData(data) {
		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/chart/getfuelusage', data).map(response => {
			return response;
		});
	}

	// Get Gateway Count
	getEnergyUsageChartData(data) {
		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/chart/getenergyusage', data).map(response => {
			return response;
		});
	}

	// Get Gateway Count
	getGeneraytorBatteryStatusChartData(data) {
		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/chart/getgeneratorbatterystatus', data).map(response => {
			return response;
		});
	}

	// Get Gateway Count
	getGeneraterUsagePieChartData(data) {
		return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/chart/getgeneratorusage', data).map(response => {
			return response;
		});
	}
}
