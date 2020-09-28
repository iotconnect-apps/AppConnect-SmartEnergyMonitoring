import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { CookieService } from 'ngx-cookie-service'

import { ApiConfigService, NotificationService } from 'app/services';

@Injectable({
  providedIn: 'root'
})
export class FacilityService {
  protected apiServer = ApiConfigService.settings.apiServer;
  cookieName = 'FM';
  constructor(private cookieService: CookieService,
    private _notificationService: NotificationService,
    private httpClient: HttpClient) {
    this._notificationService.apiBaseUrl = this.apiServer.baseUrl;
  }

  /**
   * Country list 
   * */
  getcountryList() {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/country').map(response => {
      return response;
    });
  }

  removeImage(entityId) {
    return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/entity/deleteimage/'+entityId,{}).map(response => {
      return response;
    });
  }


  /**
   * State list by country id
   * @param countryId
   */
  getstatelist(countryId) {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/state/' + countryId).map(response => {
      return response;
    });
  }

  /**
   * Zone type list
   */
  getZoneTypelist() {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/zonetype').map(response => {
      return response;
    });
  }

  /**
   * Add facility
   * @param data
   */
  addFacility(data) {
    const formData = new FormData();
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (data[key])
        formData.append(key, value);
    }

    return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/entity/manage', formData).map(response => {
      return response;
    });
  }

  /**
   * Get faility detail by facilityGuid
   * @param facilityGuid
   */
  getFacilityDetails(facilityGuid) {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/entity/' + facilityGuid).map(response => {
      return response;
    });
  }

  /**
   * Get faility dashboard overview by facilityGuid
   * @param facilityGuid
   */
  getFacilityOverview(facilityGuid) {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/dashboard/getfacilityoverview/' + facilityGuid).map(response => {
      return response;
      
    });
  }


getDeviceStatus(uniqueId) {

  return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/connectionstatus/' + uniqueId).map(response => {
    return response;
  });
}

  getAlerts(facilityGuid) {


    return this.httpClient.get<any>(this.apiServer.baseUrl + 'alert?entityGuid/' + facilityGuid).map(response => {
      return response;
    });
    // return this.http.get<any>(environment.baseUrl + 'alert', configHeader).map(response => {
    // 	return response;
    // });
  }

/**
   * Get list of zone
   * @param parameters
   */
  getZonelist(parameters) {

    const reqParameter = {
      params: {
        'parentEntityGuid': parameters.parentEntityGuid,
        'pageNo': parameters.pageNumber,
        'pageSize': parameters.pageSize,
        'searchText': parameters.searchText,
        'orderBy': parameters.sortBy
      },
      timestamp: Date.now()
    };

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/entity/zonesearch', reqParameter).map(response => {
      return response;
    });
  }
  /**
   * Get list of facility
   * @param parameters
   */
  getFacility(parameters) {

    const reqParameter = {
      params: {
        'parentEntityGuid': parameters.parentEntityGuid,
        'pageNo': parameters.pageNumber,
        'pageSize': parameters.pageSize,
        'searchText': parameters.searchText,
        'orderBy': parameters.sortBy
      },
      timestamp: Date.now()
    };

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/entity/search', reqParameter).map(response => {
      return response;
    });
  }

  /**
   * Update status
   * @param id
   * @param isActive
   */
  changeStatus(id, isActive) {
    let status = isActive == true ? false : true;
    return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/entity/updatestatus/' + id + '/' + status, {}).map(response => {
      return response;
    });
  }

  deleteFacility(facilityGuid) {

    return this.httpClient.put<any>(this.apiServer.baseUrl + 'api/entity/delete/' + facilityGuid, "").map(response => {
      return response;
    });
  }
  getsensorTelemetryData() {
    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/attributes').map(response => {
      return response;
    });
  }

  getMeterByFacility(parameters) {
    console.log(parameters);
    
    
    const reqParameter = {
      params: {
        'parentEntityGuid': parameters.parentEntityGuid,
        'entityGuid': parameters.entityGuid,
        'pageNo': parameters.pageNo,
        'pageSize': parameters.pageSize,
        'searchText': parameters.searchText,
        'orderBy': parameters.orderBy
      },
      timestamp: Date.now()
    };
    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/search',reqParameter).map(response => {
      return response;
    });
  }

  getEnergyConsumptionChartByMeteor(entityGuid, frequency) {
    let data = {
      "entityGuid": entityGuid,
      "frequency": frequency,
    }
    return this.httpClient.post<any>(this.apiServer.baseUrl + 'api/chart/getenergyconsumptionbymeter', data).map(response => {
      return response;
    });
  }

  getSensorDetails(sensorGuid) {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/lookup/deviceattributelookup/' + sensorGuid).map(response => {
      return response;
    });
  }
  getSensorLatestData(sensorGuid) {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/telemetry/' + sensorGuid).map(response => {
      return response;
    });
  }
  getwqiindexvalue(deviceGuid) {

    return this.httpClient.get<any>(this.apiServer.baseUrl + 'api/device/getaqiindexvalue/' + deviceGuid).map(response => {
      return response;
    });
  }
}
