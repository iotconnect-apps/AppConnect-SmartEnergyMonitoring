import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CookieService } from 'ngx-cookie-service'
import { ApiConfigService, NotificationService } from 'app/services';

@Injectable()

export class DashboardService {
	cookieName = 'FM';
	protected apiServer = ApiConfigService.settings.apiServer;
	constructor(
		private http: HttpClient,
		private cookieService: CookieService,
		private _notificationService: NotificationService
	) {
		this._notificationService.apiBaseUrl = this.apiServer.baseUrl;
	}
	getMeterDetail(deviceid){
		return this.http.get<any>(this.apiServer.baseUrl + 'api/device/' + deviceid).map(response => {
			return response;
		});
	}
	getmeterTelemetryData() {
		return this.http.get<any>(this.apiServer.baseUrl + 'api/lookup/attributes').map(response => {
			return response;
		});
	}
	getEnergyChartData(data){
		return this.http.post<any>(this.apiServer.baseUrl + 'api/chart/getenergyconsumption', data).map(response => {
			return response;
		});
	}
	getMeterStatus(data){
		return this.http.post<any>(this.apiServer.baseUrl + 'api/chart/getenergyconsumptionbymeter', data).map(response => {
			return response;
		});
	}
	getEnergyPieChartData(data){
		return this.http.get<any>(this.apiServer.baseUrl + 'api/chart/getenergyconsumptionbyfacility/' + data).map(response => {
			return response;
		});
	}
	getDashboardStatistics() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get(this.apiServer.baseUrl + 'api/dashboard/statistics', configHeader).map(response => {
			return response;
		});
	}

	getNotificationList() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get(this.apiServer.baseUrl + 'api/dashboard/notification', configHeader).map(response => {
			return response;
		});
	}

	getTruckUsage() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get(this.apiServer.baseUrl + 'api/dashboard/getTruckUsage', configHeader).map(response => {
			return response;
		});
	}

	getTruckActivity() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get(this.apiServer.baseUrl + 'api/dashboard/getTruckActivity', configHeader).map(response => {
			return response;
		});
	}

	getTruckGraph() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get(this.apiServer.baseUrl + 'api/dashboard/getTruckGraph', configHeader).map(response => {
			return response;
		});
	}

	getStompCon() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get(this.apiServer.baseUrl + 'api/dashboard/getStompConfiguration', configHeader).map(response => {
			return response;
		});
	}

	getDeviceAttributeHistoricalData(data) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.post(this.apiServer.baseUrl + 'api/dashboard/getDeviceAttributeHistoricalData', data, configHeader).map(response => {
			return response;
		});
	}

	getSensors(data) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.post(this.apiServer.baseUrl + 'api/dashboard/getDeviceAttributes', data, configHeader).map(response => {
			return response;
		});
	}

	tripStatus(id, data) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.put<any>(this.apiServer.baseUrl + 'api/trip/' + id + '/status', data, configHeader).map(response => {
			return response;
		});
	}

	startSimulator(id, isSalesTemplate = true) {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get<any>(this.apiServer.baseUrl + 'api/trip/startSimulator/' + id + '/' + isSalesTemplate, configHeader).map(response => {
			return response;
		});
	}

	getDashboardoverview() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get<any>(this.apiServer.baseUrl + 'api/dashboard/overview', configHeader).map(response => {
			return response;
		});
	}

	getAllAlerts() {
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get<any>(this.apiServer.baseUrl + 'api/alert', configHeader).map(response => {
			return response;
		});
	}

	getFacilitylist(parameters) {
		const parameter = {
			params: {
				'pageNo': parameters.pageNo + 1,
				'pageSize': parameters.pageSize,
				'searchText': parameters.searchText
			},
			timestamp: Date.now()
		};
		var configHeader = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.cookieService.get(this.cookieName + 'access_token')
			}
		};

		return this.http.get<any>(this.apiServer.baseUrl + 'api/entity/search', parameter).map(response => {
			return response;
		});
	}
	deleteFacility(facilityGuid) {


		return this.http.put<any>(this.apiServer.baseUrl + 'api/entity/delete/' + facilityGuid, "").map(response => {
			return response;
		});
	}

	// Convert timestamp ti since time
	timeSince(date) {
		date = new Date(date)
		let minute = 60;
		let hour = minute * 60;
		let day = hour * 24;
		let month = day * 30;
		let year = day * 365;

		let suffix = ' ago';

		let elapsed = Math.floor((Date.now() - date) / 1000);

		if (elapsed < minute) {
			return 'just now';
		}

		// get an array in the form of [number, string]
		let a = elapsed < hour && [Math.floor(elapsed / minute), 'minute'] ||
			elapsed < day && [Math.floor(elapsed / hour), 'hour'] ||
			elapsed < month && [Math.floor(elapsed / day), 'day'] ||
			elapsed < year && [Math.floor(elapsed / month), 'month'] ||
			[Math.floor(elapsed / year), 'year'];

		// pluralise and append suffix
		return a[0] + ' ' + a[1] + (a[0] === 1 ? '' : 's') + suffix;
	}


}
