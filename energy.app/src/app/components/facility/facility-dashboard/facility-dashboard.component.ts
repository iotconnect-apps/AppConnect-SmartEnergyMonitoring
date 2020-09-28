import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GoogleChartInterface } from 'ng2-google-charts/google-charts-interfaces';
//import * as Highcharts from 'highcharts';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { FacilityService, DashboardService, Notification, NotificationService, LookupService, DeviceService, AlertsService } from '../../../services';
import { MatDialog } from '@angular/material';
import { AppConstant, DeleteAlertDataModel, MessageAlertDataModel } from '../../../app.constants';

import { DeleteDialogComponent, MessageDialogComponent } from '../..';
import 'chartjs-plugin-streaming';
import { StompRService } from '@stomp/ng2-stompjs'
import { Message } from '@stomp/stompjs'
import { Observable, forkJoin } from 'rxjs';
import * as moment from 'moment-timezone'
import * as _ from 'lodash'
import { environment } from '@environment/environment';


@Component({
  selector: 'app-facility-dashboard',
  templateUrl: './facility-dashboard.component.html',
  styleUrls: ['./facility-dashboard.component.css'],
  providers: [StompRService]
})
export class FacilityDashboardComponent implements OnInit {
  dataobj = {};
  facilityObj: any = {};
  facilityGuid: any;
  zoneTypeList: any = [];
  public isChartLoaded = false;
  mediaUrl = "";
  searchParameters = {
    parentEntityGuid: '',
    pageNumber: 0,
    pageSize: -1,
    searchText: '',
    sortBy: 'name asc'
  };
  
  faciltyId: any;
  faciltyName: any;
  meters: any = [];
  public selectedZone: any;
  preyear = moment().subtract(1, 'years').format("YYYY");
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  columnArray: any = [];
  headFormate: any = {
    columns: this.columnArray,
    type: 'NumberFormat'
  };
  bgColor = '#fff';
  chartHeight = 320;
  chartWidth = '100%';
  currentyear = moment().format('YYYY');
  chart = {
    'EnergyConsumption': {
      chartType: 'ColumnChart',
      dataTable: [],
      options: {
        height: this.chartHeight,
        width: this.chartWidth,
        interpolateNulls: true,
        backgroundColor: this.bgColor,
        hAxis: {
          title: 'Date/Time',
          gridlines: {
            count: 5
          },
        },
        vAxis: {
          title: 'Values',
          gridlines: {
            count: 1
          },
        }
      },
      formatters: this.headFormate
    },
    'meterStatus': {
      chartType: 'ColumnChart',
      dataTable: [],
      options: {
        title: "",
        bar: { groupWidth: "25%" },
        colors: ['#5496d0'],
        height: this.chartHeight,
        width: this.chartWidth,
        interpolateNulls: true,
        backgroundColor: this.bgColor,
        hAxis: {
          title: 'Date/Time',
          titleTextStyle: {
            bold: true
          },
        },
        vAxis: {
          title: 'Values',
          titleTextStyle: {
            bold: true
          },
          viewWindow: {
            min: 0
          }
        }
      },
      formatters: this.headFormate
    }
  };
  // public mediaUrl:any=environment.mediaUrl
  alerts:any = [];
  constructor(
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    public _service: FacilityService,
    public dialog: MatDialog,
    public _appConstant: AppConstant,
    public dashboardService: DashboardService,
    private _notificationService: NotificationService,
    private lookupService: LookupService,
    public alertsService: AlertsService

  ) {
    
    
    this.dataobj = { guid: '', zoneguid: '' }
    this.activatedRoute.params.subscribe(params => {
      if (params.facilityGuid) {
        this.facilityGuid = params.facilityGuid
        this.faciltyId = params.facilityGuid
        this.getAlertList(this.facilityGuid)
        this.getFacilityOverview(this.facilityGuid);
        this.getZoneTypeLookup();
        this.getFacilityDetails(this.facilityGuid)
      }
    })
  }

  ngOnInit() {
    this.mediaUrl = this._notificationService.apiBaseUrl;
  }

  /**
	 * Get Energy Data on Change Event
   * @param event
	 * */
  changeenergy(event) {
    let type = 'd';
    if (event.value === 'Week') {
      type = 'w';
    } else if (event.value === 'Month') {
      type = 'm';
    }
    this.getMeterStatusChartData(type, this.selectedZone);
  }

  /**
   * Get Meter status chart data
   * */
  getMeterStatusChartData(frequency, zoneId) {
    this.spinner.show();
    let obj = {
      companyGuid: this.currentUser.userDetail.companyId,
      entityGuid: zoneId, frequency: frequency
    };
    let data = [
      ['Meter', 'Meter Status']
    ]
    this.dashboardService.getMeterStatus(obj).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        if (response.data.length) {
          response.data.forEach(element => {
            data.push([element.uniqueId, parseFloat(element['value'])]);
          });
          this.createChart('meterStatus', data, '', 'Consumption(KW)');
        } else {
          this.chart.meterStatus.dataTable = [];
        }
      }
      else {
        this.chart.meterStatus.dataTable = [];
        this._notificationService.handleResponse(response,"error");
      }
    }, error => {
      this.chart.meterStatus.dataTable = [];
      this.spinner.hide();
      this._notificationService.handleResponse(error,"error");
    });


  }

  /**
   * Get data for Energy chart
   * */
  getenergyChartData(zoneId) {
    this.spinner.show();
    let obj = { entityGuid: zoneId };
    //let data = []
    this.dashboardService.getEnergyChartData(obj).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        let data = []
        data.push(['KW', moment().subtract(1, 'years').format("YYYY"), moment().format('YYYY')]);
        response.data.forEach(element => {
          data.push([element.month, parseFloat(element.energyValue[0].value), parseFloat(element.energyValue[1].value)]);
        });
        this.createChart('EnergyConsumption', data, '', 'KW');
      }
      else {
        this._notificationService.handleResponse(response,"error");
      }
    }, error => {
      this.spinner.hide();
      this._notificationService.handleResponse(error,"error");
    });

  }

  /**
   * Create chart
   * @param key
   * @param data
   * @param hAxisTitle
   * @param vAxisTitle
   */
  createChart(key, data, hAxisTitle, vAxisTitle) {
    let chartType = 'ColumnChart';
    let legend = { position: 'none' };
    var hAxis = {
      title: hAxisTitle,
      gridlines: {
        count: 5
      },
      slantedText: true,
      slantedTextAngle: 45,
    };
    if (key === 'EnergyConsumption') {
      legend = { position: 'right' };

    }
    this.chart[key] = {
      chartType: chartType,
      dataTable: data,
      options: {
        height: this.chartHeight,
        width: this.chartWidth,
        interpolateNulls: true,
        legend: legend,
        backgroundColor: this.bgColor,
        hAxis: hAxis,
        vAxis: {
          title: vAxisTitle,
        }
      },
      formatters: this.headFormate
    };
  }


  /**
   * For :  Get All Lerts By Facility 
   * @param facilityId For
   */
  getAlertList(facilityId) {
    this.alerts = [];
    let parameters = {
      pageNo: 0,
      pageSize: 10,
      searchText: '',
      orderBy: 'eventDate desc',
      deviceGuid: "",
      entityGuid: facilityId,
    };
    this.spinner.show();
    this.alertsService.getAlerts(parameters).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        if (response.data.count > 0) {
          this.alerts = response.data.items;
        }

      }
      else {
        this.alerts = [];
        this._notificationService.handleResponse(response,"error");

      }
    }, error => {
      this.alerts = [];
      this._notificationService.handleResponse(error,"error");
    });
  }

  /**
  *For Convert UTC date to local date
  **/
  getLocalDate(lDate) {
    var utcDate = moment.utc(lDate, 'YYYY-MM-DDTHH:mm:ss.SSS');
    // Get the local version of that date
    var localDate = moment(utcDate).local();
    let res = moment(localDate).format('MMM DD, YYYY hh:mm:ss A');
    return res;
  }


/**
 * For get facility detail
 * @param facilityGuid for
 */
  getFacilityDetails(facilityGuid) {
    this.spinner.show();
    this._service.getFacilityDetails(facilityGuid).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        let facility = response.data.guid.toUpperCase();
        response.data.guid = facility;
        this.faciltyName = response.data.name;
        this.faciltyId = response.data.guid;
        this.dataobj = response.data;
      }
      else {
        if (response.message) {
          this._notificationService.handleResponse(response,"error");
        }
      }
    }, error => {
      this.spinner.hide();
      this._notificationService.handleResponse(error,"error");
    });
  }

  /**
   * For Get Facility Overview
   * @param facilityGuid 
   */
  getFacilityOverview(facilityGuid) {
    this.spinner.show();
    this._service.getFacilityOverview(facilityGuid).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        this.facilityObj = response.data;
      }
      else {
        if (response.message) {
          this._notificationService.handleResponse(response,"error");
        }
      }
    }, error => {
      this.spinner.hide();
      this._notificationService.handleResponse(error,"error");
    });
  }

/**
 * For Get Zone Lookup
 */
  getZoneTypeLookup() {
    this.lookupService.getZonelookup(this.facilityGuid).
      subscribe(response => {
        if (response.isSuccess === true && response.data != '' && response.data != undefined) {
          this.zoneTypeList = response['data'];
          this.selectedZone = this.zoneTypeList[0].guid;
          this.getenergyChartData(this.selectedZone);
          let type = 'd';
          this.getMeterStatusChartData(type, this.selectedZone);
          this.getMeterByFacility(this.facilityGuid, this.selectedZone);
        } else {
          if (response.message) {
            this._notificationService.handleResponse(response,"error");
          }
        }
      }, error => {
        this.spinner.hide();
        this._notificationService.handleResponse(error,"error");
      })

  }

  /**
   * For On Zone Change Event
   * @param zoneId 
   */
  onZoneChange(zoneId) {
    this.selectedZone = zoneId.value;
    this.getenergyChartData(this.selectedZone);
    let type = 'd';
    this.getMeterStatusChartData(type, this.selectedZone);
    this.getMeterByFacility(this.facilityGuid, this.selectedZone);
  }


  /**
 * 
 * @param facilityId 
 * For Get Meter By Facility
 */
  getMeterByFacility(facilityId, zoneId) {
    this.meters = [];
    let params = {
      'parentEntityGuid': facilityId,
      'entityGuid': zoneId,
      'pageNo': 1,
      'pageSize': 100,
      'searchText': '',
      'orderBy': ''
    };
    this.isChartLoaded = false;
    this._service.getMeterByFacility(params).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        if (response.data.items.length > 0) {
          this.meters = response.data.items;
        }
      }
      setTimeout(() => {
        this.isChartLoaded = true;
      }, 200);
    });

  }
}
