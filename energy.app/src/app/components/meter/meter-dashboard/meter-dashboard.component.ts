import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material';
import { AppConstant } from 'app/app.constants';
import {  Notification, NotificationService,AlertsService, DashboardService, DeviceService } from 'app/services';
import { StompRService } from '@stomp/ng2-stompjs'
import { Message } from '@stomp/stompjs'
import { Subscription } from 'rxjs'
import { Observable } from 'rxjs';
import * as moment from 'moment-timezone'
import * as _ from 'lodash'
import 'chartjs-plugin-streaming';

@Component({
  selector: 'app-meter-dashboard',
  templateUrl: './meter-dashboard.component.html',
  styleUrls: ['./meter-dashboard.component.css'],
  providers: [StompRService]
})
export class MeterDashboardComponent implements OnInit {
  preyear = moment().subtract(1, 'years').format("YYYY");
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
    }
  };
  deviceIsConnected = false;
  isConnected = false;
  subscription: Subscription;
  messages: Observable<Message>;
  cpId = '';
  subscribed;
  stompConfiguration = {
    url: '',
    headers: {
      login: '',
      passcode: '',
      host: ''
    },
    heartbeat_in: 0,
    heartbeat_out: 2000,
    reconnect_delay: 5000,
    debug: true
  }
  chartColors: any = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)',
    cerise: 'rgb(255,0,255)',
    popati: 'rgb(0,255,0)',
    dark: 'rgb(5, 86, 98)',
    solid: 'rgb(98, 86, 98)',
    tenwik: 'rgb(13, 108, 179)',
    redmek: 'rgb(143, 25, 85)',
    yerows: 'rgb(249, 43, 120)',
    redies: 'rgb(225, 208, 62)',
    orangeies: 'rgb(225, 5, 187)',
    yellowies: 'rgb(74, 210, 80)',
    greenies: 'rgb(74, 210, 165)',
    blueies: 'rgb(128, 96, 7)',
    purpleies: 'rgb(8, 170, 196)',
    greyies: 'rgb(122, 35, 196)',
    ceriseies: 'rgb(243, 35, 196)',
    popatiies: 'rgb(243, 35, 35)',
    darkies: 'rgb(87, 17, 35)',
    solidies: 'rgb(87, 71, 35)',

  };
  datasets: any[] = [
    {
      label: 'Dataset 1 (linear interpolation)',
      backgroundColor: 'rgb(153, 102, 255)',
      borderColor: 'rgb(153, 102, 255)',
      fill: false,
      lineTension: 0,
      borderDash: [8, 4],
      data: []
    }
  ];
  optionsdata: any = {
    type: 'line',
    scales: {

      xAxes: [{
        type: 'realtime',
        time: {
          stepSize: 10
        },
        realtime: {
          duration: 90000,
          refresh: 1000,
          delay: 2000,
          //onRefresh: '',

          // delay: 2000

        }

      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'CurrentFlow(Volts)'
        }
      }]

    },
    tooltips: {
      mode: 'nearest',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false
    }

  };
  public canvasWidth = 500
  public needleValue:any = ''
  public centralLabel = ''
  public name = ''
  public bottomLabel = ''
  public options = {
      hasNeedle: true,
      needleColor: 'gray',
      needleUpdateSpeed: 1000,
      arcColors: ['rgb(44, 151, 222)', 'lightgray'],
      arcDelimiters: [30],
      rangeLabel: ['0', '1500'],
      needleStartValue: 50,
  }
  meterGuid: any;
  alerts = [];
  uniqueId: any;
  currentReading: any;
  isActive: any;
  entityName: any;
  voltageReading: any;
  constructor( private activatedRoute: ActivatedRoute,
    public dashboardService: DashboardService,
    private stompService: StompRService,private deviceService: DeviceService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    public _appConstant: AppConstant,
    private _notificationService: NotificationService,
    public alertsService: AlertsService,) { 
    this.activatedRoute.params.subscribe(params => {
      if (params.meterGuid) {
        this.meterGuid = params.meterGuid
        this.getmeterdetail(this.meterGuid)
      }

    })
  }

  ngOnInit() {
    this.getenergyChartData()
    this.getAlertList()
    this.getMeterTelemetryData()
  }
  /**
   * Get data for Energy chart
   * */
  getenergyChartData() {
    let obj = { deviceGuid: this.meterGuid};
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
   * Meter Detail by Meterguid
   * @param Meterguid
   */
  getmeterdetail(Meterguid){
    this.spinner.show();
    this.dashboardService.getMeterDetail(Meterguid).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true ) {
        this.entityName = response.data.entityName
        this.isActive = response.data.isActive
        this.uniqueId = response.data.uniqueId
        this.currentReading = response.data.currentReading
        this.voltageReading = response.data.voltageReading
        this.needleValue = response.data.voltageReading * 100 /1500;
        
      }
    })
  }
  getLocalDate(lDate) {
    var utcDate = moment.utc(lDate, 'YYYY-MM-DDTHH:mm:ss.SSS');
    // Get the local version of that date
    var localDate = moment(utcDate).local();
    let res = moment(localDate).format('MMM DD, YYYY hh:mm:ss A');
    return res;

  }
/**
 * Get Alert List 
 * */
getAlertList() {
  this.alerts = [];
  let parameters = {
    pageNo: 0,
    pageSize: 10,
    searchText: '',
    orderBy: 'eventDate desc',
    deviceGuid: this.meterGuid,
    entityGuid: ''
  };
  this.spinner.show();
  this.alertsService.getAlerts(parameters).subscribe(response => {
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
/**
   * Get Telemetry data By Meter
   */
  getMeterTelemetryData() {
    this.spinner.show();
    this.dashboardService.getmeterTelemetryData().subscribe(response => {
      if (response.isSuccess === true) {
        this.getStompConfig();
        this.spinner.hide();
        let temp = [];
        response.data.forEach((element, i) => {
          var colorNames = Object.keys(this.chartColors);
          var colorName = colorNames[i % colorNames.length];
          var newColor = this.chartColors[colorName];
          var graphLabel = {
            label: element.text,
            backgroundColor: 'rgb(153, 102, 255)',
            borderColor: newColor,
            fill: false,
            cubicInterpolationMode: 'monotone',
            data: []
          }
          temp.push(graphLabel);
        });
        this.datasets = temp;
      } else {
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
   * Get Stom Config
   */
  getStompConfig() {

    this.deviceService.getStompConfig('LiveData').subscribe(response => {
      if (response.isSuccess) {
        this.stompConfiguration.url = response.data.url;
        this.stompConfiguration.headers.login = response.data.user;
        this.stompConfiguration.headers.passcode = response.data.password;
        this.stompConfiguration.headers.host = response.data.vhost;
        this.cpId = response.data.cpId;
        this.initStomp();
      }
    });
  }
  /**
   * Init Stom Config
   */
  initStomp() {
    let config = this.stompConfiguration;
    this.stompService.config = config;
    this.stompService.initAndConnect();
    this.stompSubscribe();
  }
/**
   * Subscribe Topic
   */
  public stompSubscribe() {
    if (this.subscribed) {
      return;
    }

    this.messages = this.stompService.subscribe('/topic/' + this.cpId + '-' + this.uniqueId);
    this.subscription = this.messages.subscribe(this.on_next);
    this.subscribed = true;
  }
  /**
   * Get Telemetry  Data
   * @param Message
   */
  public on_next = (message: Message) => {
    let obj: any = JSON.parse(message.body);
    let reporting_data = obj.data.data.reporting
    this.isConnected = true;

    let dates = obj.data.data.time;
    let now = moment();
    if (obj.data.data.status == undefined && obj.data.msgType == 'telemetry' && obj.data.msgType != 'device' && obj.data.msgType != 'simulator') {
      this.deviceIsConnected = true;
      this.optionsdata = {
        type: 'line',
        scales: {

          xAxes: [{
            type: 'realtime',
            time: {
              stepSize: 5
            },
            realtime: {
              duration: 90000,
              refresh: 7000,
              delay: 2000,
              onRefresh: function (chart: any) {
                if (chart.height) {
                  if (obj.data.data.status != 'on') {
                    chart.data.datasets.forEach(function (dataset: any) {

                      dataset.data.push({

                        x: now,

                        y: reporting_data[dataset.label]

                      });

                    });
                  }
                } else {

                }

              },

              // delay: 2000

            }

          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'CurrentFlow(Volts)'
            }
          }]

        },
        tooltips: {
          mode: 'nearest',
          intersect: false
        },
        hover: {
          mode: 'nearest',
          intersect: false
        }

      }
    } else if (obj.data.msgType === 'simulator' || obj.data.msgType === 'device') {
      if (obj.data.data.status === 'off') {
        this.deviceIsConnected = false;
        this.optionsdata = {
       type: 'line',
    scales: {

      xAxes: [{
        type: 'realtime',
        time: {
          stepSize: 10
        },
        realtime: {
          duration: 90000,
          refresh: 1000,
          delay: 2000,
          //onRefresh: '',

          // delay: 2000

        }

      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'CurrentFlow(Volts)'
        }
      }]

    },
    tooltips: {
      mode: 'nearest',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false
    }

  };
      } else {
        this.deviceIsConnected = true;
      }
    }
    obj.data.data.time = now;
		
  }
}
