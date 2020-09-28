import { ChangeDetectorRef, ViewRef , OnInit, Component, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner'
import { DashboardService } from 'app/services/dashboard/dashboard.service';
import { Notification, NotificationService } from 'app/services';
import {Subscription} from 'rxjs/Subscription';
import { ChartReadyEvent, GoogleChartComponent } from 'ng2-google-charts'
import * as moment from 'moment-timezone'

@Component({
	selector: 'app-widget-chart-c',
	templateUrl: './widget-chart-c.component.html',
	styleUrls: ['./widget-chart-c.component.css']
})
export class WidgetChartCComponent implements OnInit,OnDestroy {
	chartHeight = 320;
	chartWidth = '100%';
	bgColor = '#fff';
	columnArray: any = [];
	headFormate: any = {
		columns: this.columnArray,
		type: 'NumberFormat'
	  };
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
	color: string[];
	columnChart = {
		chartType: "ColumnChart",
		dataTable: [],
		options: {
		  title: "",
		  bar: {groupWidth: "40%"},
		  vAxis: {
			title: "QTY",
			titleTextStyle: {
			  bold: true
			},
			viewWindow: {
			  min: 0
			}
		  },
		  hAxis: {
			titleTextStyle: {
			  bold: true
			},
		  },
		  legend: 'none',
		  height: "350",
		  chartArea: {height: '75%', width: '85%'},
		  seriesType: 'bars',
		  // series: { 1: { type: 'line' } },
		  colors: ['#41c363']
		}
	  };
	@Input() widget;
	@Input() gridster;
	@Input() count;
	@Input() resizeEvent: EventEmitter<any>;
	resizeSub: Subscription;
	@Input() chartTypeChangeEvent: EventEmitter<any>;
	chartTypeChangeSub: Subscription;
	

	@ViewChild('cchart', { static: false }) cchart: GoogleChartComponent;
	currentUser = JSON.parse(localStorage.getItem("currentUser"));
	
	
	soilNutritionsChart = {
		chartType: 'ColumnChart',
		dataTable: [],
		options: {
			width:200,
			height:200,
			legend: { position: 'right' },
			interpolateNulls: true,
			backgroundColor: this.bgColor,
			colors : ["#3366cc","#dc3912","#ff9900"],
			hAxis: {
				title: 'Days',
				gridlines: {
					count: 5
				},
				maxAlternation: 1, 
				showTextEvery: 1, 
				minTextSpacing: 8
			},
			vAxis: {
				title: '% pH Level',
				gridlines: {
					count: 1
				},
			}
		},
		formatters: this.headFormate
	};
	greenhouse= [];
	constructor(
		public dashboardService: DashboardService,
		private spinner: NgxSpinnerService,
		private _notificationService: NotificationService,
		private changeDetector : ChangeDetectorRef,
		){
	}

	ngOnInit() {
		this.soilNutritionsChart.options.width = (this.widget.properties.w > 0 ? parseInt((this.widget.properties.w - 40).toString()) : 200);
 		this.soilNutritionsChart.options.height = (this.widget.properties.h > 0 ? parseInt((this.widget.properties.h - 100).toString()) : 200);
		this.resizeSub = this.resizeEvent.subscribe((widget) => {
		});

		this.chartTypeChangeSub = this.chartTypeChangeEvent.subscribe((widget) => {
		});
		this.changeChartType(); 
		this.getenergyChartData();
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
  currentyear = moment().format('YYYY');
  preyear = moment().subtract(1, 'years').format("YYYY");
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
	changeChartType(){
		if(this.widget.widgetProperty.chartColor.length > 0){
			this.soilNutritionsChart.options.colors = [];
			for (var i = 0; i <= (this.widget.widgetProperty.chartColor.length - 1); i++) {
				this.soilNutritionsChart.options.colors.push(this.widget.widgetProperty.chartColor[i].color);
			}
		}
		
		this.chart['EnergyConsumption'].options.height = (this.widget.properties.h > 0 ? parseInt((this.widget.properties.h - 100).toString()) : 200);
		this.chart['EnergyConsumption'].chartType = 'ColumnChart';
		if(this.widget.widgetProperty.chartType && this.widget.widgetProperty.chartType != ''){
			this.chart['EnergyConsumption'].chartType = (this.widget.widgetProperty.chartType == 'bar' ? 'ColumnChart' : 'LineChart');
			if(this.soilNutritionsChart.dataTable.length > 1 && this.cchart){
				let ccWrapper = this.cchart.wrapper;
				ccWrapper.setChartType(this.soilNutritionsChart.chartType);
				this.cchart.draw();
				ccWrapper.draw();
			}
			if (this.changeDetector && !(this.changeDetector as ViewRef).destroyed) {
				this.changeDetector.detectChanges();
			}
		}
	}

	ngOnDestroy() {
		this.resizeSub.unsubscribe();
		this.chartTypeChangeSub.unsubscribe();
	}
}
