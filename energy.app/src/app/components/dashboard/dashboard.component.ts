import * as moment from 'moment-timezone'
import { Component, OnInit } from '@angular/core'
import { NgxSpinnerService } from 'ngx-spinner'
import { Router } from '@angular/router'
import { AppConstant, DeleteAlertDataModel } from "../../app.constants";
import { MatDialog } from '@angular/material'
import { facilityobj } from './dashboard-model';
import { DashboardService, Notification, DeviceService,NotificationService, AlertsService } from '../../services';
/*Dynamic Dashboard Code*/
import {ChangeDetectorRef , EventEmitter, ViewChild} from '@angular/core';
import { DynamicDashboardService } from 'app/services/dynamic-dashboard/dynamic-dashboard.service';
import {DisplayGrid, CompactType, GridsterConfig, GridsterItem, GridsterItemComponent, GridsterPush, GridType, GridsterComponentInterface, GridsterItemComponentInterface} from 'angular-gridster2';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
/*Dynamic Dashboard Code*/
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})

export class DashboardComponent implements OnInit {
  usageByenergyChart = {
		chartType: "PieChart",
    dataTable: [],
		options: {
      width: 370,
      height: 350,
      chartArea: {left: '70', width: '98%', height: '95%'},
      pieSliceText: 'value',
      title: "",
      pieHole: 0.5,
		}
	};
  facilityobj = new facilityobj();
  lat = 32.897480;
  lng = -97.040443;
  mediaUrl = "";
  facilityList: any = [];
  isShowLeftMenu = true;
  isSearch = false;
  mapview = true;
  totalAlerts: any;
  totalFacilities: any;
  totalZones: any;
  totalIndoorZones: any;
  totalOutdoorZones: any;

  deleteAlertDataModel: DeleteAlertDataModel;
  searchParameters = {
    pageNumber: 0,
    pageNo: 0,
    pageSize: 10,
    searchText: '',
    sortBy: 'uniqueId asc'
  };
  ChartHead = ['Date/Time'];
  chartData = [];
  datadevice: any = [];
  columnArray: any = [];
  headFormate: any = {
    columns: this.columnArray,
    type: 'NumberFormat'
  };
  bgColor = '#fff';
  chartHeight = 320;
  chartWidth = '100%';
  currentyear = moment().format('YYYY');
  preyear = moment().subtract(1, 'years').format("YYYY");
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
    }
  };
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  totalConnected: any;
  totalDisconnected: any;
  totalEnergy: any;
  totalDevices: any;
  totalEnergydata: any;
  activeUserCount:any; 
  inactiveUserCount: any;
  	/*Dynamic Dashboard Code*/
	@ViewChild('gridster',{static:false}) gridster;
	isDynamicDashboard : boolean = true;
	options: GridsterConfig;
	dashboardWidgets: Array<any> = [];
	dashboardList = [];
	dashboardData = {
   		id : '',
   		index : 0,
   		dashboardName : '',
   		isDefault : false,
   		widgets : []
   	};
   	resizeEvent: EventEmitter<any> = new EventEmitter<any>();
   	alertLimitchangeEvent: EventEmitter<any> = new EventEmitter<any>();
	chartTypeChangeEvent: EventEmitter<any> = new EventEmitter<any>();
	zoomChangeEvent: EventEmitter<any> = new EventEmitter<any>();
	telemetryDeviceChangeEvent: EventEmitter<any> = new EventEmitter<any>();
	telemetryAttributeChangeEvent: EventEmitter<any> = new EventEmitter<any>();
	sideBarSubscription : Subscription;
	deviceData: any = [];
	/*Dynamic Dashboard Code*/
  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private dashboardService: DashboardService,
    private _notificationService: NotificationService,
    public _appConstant: AppConstant,
    public dialog: MatDialog,
    public _service: AlertsService,
    public dynamicDashboardService: DynamicDashboardService,
    private deviceService: DeviceService

  ) {
    /*Dynamic Dashboard Code*/
		this.sideBarSubscription = this.dynamicDashboardService.isToggleSidebarObs.subscribe((toggle) => {
			console.log("Sidebar clicked");
			if(this.isDynamicDashboard && this.dashboardList.length > 0){
				/*this.spinner.show();
				this.changedOptions();
		    	let cond = false;
		    	Observable.interval(700)
				.takeWhile(() => !cond)
				.subscribe(i => {
					console.log("Grid Responsive");
					cond = true;
					this.checkResponsiveness();
					this.spinner.hide();
				});*/
			}
	    })
		/*Dynamic Dashboard Code*/
    this.mediaUrl = this._notificationService.apiBaseUrl;
  }

  ngOnInit() {
    let frequency = 'd';
    this.getDashbourdCount();
    this.getDeviceList();
/*Dynamic Dashboard Code*/
this.options = {
  gridType: GridType.Fixed,
  displayGrid: DisplayGrid.Always,
  initCallback: this.gridInit.bind(this),
  itemResizeCallback: this.itemResize.bind(this),
  fixedColWidth: 20,
  fixedRowHeight: 20,
  keepFixedHeightInMobile: false,
  keepFixedWidthInMobile: false,
  mobileBreakpoint: 640,
  pushItems: false,
  draggable: {
    enabled: false
  },
  resizable: {
    enabled: false
  },
  enableEmptyCellClick: false,
  enableEmptyCellContextMenu: false,
  enableEmptyCellDrop: false,
  enableEmptyCellDrag: false,
  enableOccupiedCellDrop: false,
  emptyCellDragMaxCols: 50,
  emptyCellDragMaxRows: 50,

  minCols: 60,
  maxCols: 192,
  minRows: 62,
  maxRows: 375,
  setGridSize: true,
  swap: true,
  swapWhileDragging: false,
  compactType: CompactType.None,
  margin : 0,
  outerMargin : true,
  outerMarginTop : null,
  outerMarginRight : null,
  outerMarginBottom : null,
  outerMarginLeft : null,
};
/*Dynamic Dashboard Code*/
  }

  getAlertList() {
    let parameters = {
      pageNo: 0,
      pageSize: 8,
      searchText: '',
      orderBy: 'eventDate desc',
      deviceGuid: '',
      entityGuid: '',
    };
    this.spinner.show();
    this._service.getAlerts(parameters).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        if (response.data.count) {
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
/*Dynamic Dashboard Code*/
getDashboards(){
  this.spinner.show();
  this.dashboardList = [];
  let isAnyDefault = false;
  let systemDefaultIndex = 0;
  this.dynamicDashboardService.getUserWidget().subscribe(response => {
    this.isDynamicDashboard = false;
    for (var i = 0; i <= (response.data.length - 1); i++) {
      response.data[i].id = response.data[i].guid;
      response.data[i].widgets = JSON.parse(response.data[i].widgets);
      this.dashboardList.push(response.data[i]);
      if(response.data[i].isDefault === true){
        isAnyDefault = true;
        this.dashboardData.index = i;
        this.isDynamicDashboard = true;
      }
      if(response.data[i].isSystemDefault === true){
        systemDefaultIndex = i;
      }
    }
    /*Display Default Dashboard if no data*/
    if(!isAnyDefault){
      this.dashboardData.index = systemDefaultIndex;
      this.isDynamicDashboard = true;
      this.dashboardList[systemDefaultIndex].isDefault = true;
    }
    /*Display Default Dashboard if no data*/
    this.spinner.hide();
    if(this.isDynamicDashboard){
      this.editDashboard('view','n');
    }
    else{
      let frequency = 'd';
      this.getFacilityList();
      this.getAlertList();
      this.getenergyChartData();
      this.getEnergyUsagePieChartData(frequency);
    }
  }, error => {
    this.spinner.hide();
    /*Load Old Dashboard*/
    let frequency = 'd';
    this.getFacilityList();
    this.getAlertList();
    this.getenergyChartData();
    this.getEnergyUsagePieChartData(frequency);
    /*Load Old Dashboard*/
    this._notificationService.handleResponse(error,"error");
  });
}

editDashboard(type : string = 'view',is_cancel_btn : string = 'n'){
  this.spinner.show();
  this.dashboardWidgets = [];

  this.dashboardData.id = '';
  this.dashboardData.dashboardName = '';
  this.dashboardData.isDefault = false;
  for (var i = 0; i <= (this.dashboardList[this.dashboardData.index].widgets.length - 1); i++) {
    this.dashboardWidgets.push(this.dashboardList[this.dashboardData.index].widgets[i]);
  }

  if (this.options.api && this.options.api.optionsChanged) {
    this.options.api.optionsChanged();
  }
  this.spinner.hide();
}

gridInit(grid: GridsterComponentInterface) {
  if (this.options.api && this.options.api.optionsChanged) {
    this.options.api.optionsChanged();
  }
  /*let cond = false;
    Observable.interval(500)
  .takeWhile(() => !cond)
  .subscribe(i => {
    cond = true;
    this.checkResponsiveness();
  });*/
}

checkResponsiveness(){
  if(this.gridster){
    let tempWidth = 20;
    if(this.gridster.curWidth >= 640 && this.gridster.curWidth <= 1200){
      /*tempWidth = Math.floor((this.gridster.curWidth / 60));
      this.options.fixedColWidth = tempWidth;*/
    }
    else{
      this.options.fixedColWidth = tempWidth;
    }
    for (var i = 0; i <= (this.dashboardWidgets.length - 1); i++) {
      if(this.gridster.curWidth < 640){
        for (var g = 0; g <= (this.gridster.grid.length - 1); g++) {
          if(this.gridster.grid[g].item.id == this.dashboardWidgets[i].id){
            this.dashboardWidgets[i].properties.w = this.gridster.grid[g].el.clientWidth;
          }
        }
      }
      else{
        this.dashboardWidgets[i].properties.w = (tempWidth * this.dashboardWidgets[i].cols);
      }
      this.resizeEvent.emit(this.dashboardWidgets[i]);
    }
    this.changedOptions();
  }
}

changedOptions() {
  if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
}

itemResize(item: any, itemComponent: GridsterItemComponentInterface) {
  this.resizeEvent.emit(item);
}

deviceSizeChange(size){
  this.checkResponsiveness();
}

getDeviceList(){
  this.spinner.show();
  this.deviceData = [];
  this.deviceService.getdevices().subscribe(response => {
    this.spinner.hide();
    if (response.isSuccess === true){
      this.deviceData = response.data;
    }
    else
      this._notificationService.handleResponse(response,"error");
    this.getDashboards();
  }, error => {
    this.spinner.hide();
    this._notificationService.handleResponse(error,"error");
  });
}
/*Dynamic Dashboard Code*/
  convertToFloat(value) {
    return parseFloat(value)
  }
 /**
   * Get data for Energy chart
   * */
  getenergyChartData() {
    let obj = { companyGuid: this.currentUser.userDetail.companyId};
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
    this.getEnergyUsagePieChartData(type)

  }
   /**
   * Get Energy usage pie chart data
   * */
  getEnergyUsagePieChartData(frequency) {
    this.dashboardService.getEnergyPieChartData(frequency).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        if (response.data.energyConsumptionByFacility != '') {
          this.totalEnergydata = response.data.totalEnergy;
         let data = []
        data.push(["Task", "Hours per Day"]);
        response.data.energyConsumptionByFacility.forEach(element => {
        data.push([element.name , parseFloat(element.value)]);
        });
        this.usageByenergyChart = {
          chartType: "PieChart",
          dataTable: data,
          options: {
            width: 370,
            height: 350,
            chartArea: {left: '70', width: '98%', height: '95%'},
            pieSliceText: 'value',
            title: "",
            pieHole: 0.5,
          },
        };
      }else{
        this.usageByenergyChart.dataTable = [];
      }
      }
      else {
        this.usageByenergyChart.dataTable = [];
        this._notificationService.handleResponse(response,"error");
        
      }
    }, error => {
      this.usageByenergyChart.dataTable = [];
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
      dataTable:  data,
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
	 * Get count of variables for Dashboard
	 * */
  getDashbourdCount() {
    this.spinner.show();
    this.dashboardService.getDashboardoverview().subscribe(response => {
      if (response.isSuccess === true) {
        this.totalAlerts = response.data.totalAlerts;
        this.totalFacilities = response.data.totalEntities;
        this.totalConnected = response.data.totalConnected;
        this.totalDisconnected = response.data.totalDisconnected;
        this.totalDevices = response.data.totalDevices;
        this.totalEnergy = response.data.totalEnergy;
        this.activeUserCount = (response.data.activeUserCount) ? response.data.activeUserCount : 0
        this.inactiveUserCount = (response.data.inactiveUserCount) ? response.data.inactiveUserCount : 0
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
	 * Get Alerts for Dashboard
	 * */
  public alerts: any = [];
/**
   * Get Facility list
   * */
  getFacilityList() {
    this.facilityList = [];
    this.spinner.show();
    this.dashboardService.getFacilitylist(this.searchParameters).subscribe(response => {
      if (response.isSuccess === true) {
        this.facilityList = response.data.items

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
   * Get local date
   * */
  error
  getLocalDate(lDate) {
    var utcDate = moment.utc(lDate, 'YYYY-MM-DDTHH:mm:ss.SSS');
    // Get the local version of that date
    var localDate = moment(utcDate).local();
    let res = moment(localDate).format('MMM DD, YYYY hh:mm:ss A');
    return res;

  }

}
