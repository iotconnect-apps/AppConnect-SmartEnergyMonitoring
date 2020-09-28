import { ChangeDetectorRef, ViewRef , OnInit, Component, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner'
import { DashboardService } from 'app/services/dashboard/dashboard.service';
import { Notification, NotificationService } from 'app/services';
import {Subscription} from 'rxjs/Subscription';
import { ChartReadyEvent, GoogleChartComponent } from 'ng2-google-charts'

@Component({
	selector: 'app-widget-chart-a',
	templateUrl: './widget-chart-a.component.html',
	styleUrls: ['./widget-chart-a.component.css']
})
export class WidgetChartAComponent implements OnInit,OnDestroy {
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
	columnArray: any = [];
	headFormate: any = {
		columns: this.columnArray,
		type: 'NumberFormat'
	};
	bgColor = ['#5496d0'];
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
	totalEnergydata: any;
	constructor(
		public dashboardService: DashboardService,
		private spinner: NgxSpinnerService,
		private _notificationService: NotificationService,
		private changeDetector : ChangeDetectorRef,
		){
	}

	ngOnInit() {
		let frequency = 'd';
		
		console.log("======>",this.widget);
		
		/*if(this.widget.widgetProperty.chartColor.length > 0){
			this.soilNutritionsChart.options.colors = [];
			for (var i = 0; i <= (this.widget.widgetProperty.chartColor.length - 1); i++) {
				this.soilNutritionsChart.options.colors.push(this.widget.widgetProperty.chartColor[i].color);
			}
		} */
		this.soilNutritionsChart.options.width = (this.widget.properties.w > 0 ? parseInt((this.widget.properties.w - 40).toString()) : 200);
 		this.soilNutritionsChart.options.height = (this.widget.properties.h > 0 ? parseInt((this.widget.properties.h - 100).toString()) : 200);
		this.resizeSub = this.resizeEvent.subscribe((widget) => {
			/*if(widget.id == this.widget.id){
				this.widget = widget;
				this.changeChartType();
			}*/
		});

		this.chartTypeChangeSub = this.chartTypeChangeEvent.subscribe((widget) => {
			/*if(widget.id == this.widget.id){
				this.changeChartType();
			}*/
		});
		this.changeChartType(); 
		//this.getinventorystatus();
		this.getEnergyUsagePieChartData(frequency);
	}

	

	changeChartType(){
		if(this.widget.widgetProperty.chartColor.length > 0){
			this.soilNutritionsChart.options.colors = [];
			for (var i = 0; i <= (this.widget.widgetProperty.chartColor.length - 1); i++) {
				this.soilNutritionsChart.options.colors.push(this.widget.widgetProperty.chartColor[i].color);
			}
		}
		this.soilNutritionsChart.options.width = (this.widget.properties.w > 0 ? parseInt((this.widget.properties.w - 40).toString()) : 200);
 		this.soilNutritionsChart.options.height = (this.widget.properties.h > 0 ? parseInt((this.widget.properties.h - 100).toString()) : 200);
		this.soilNutritionsChart.chartType = 'ColumnChart';
		if(this.widget.widgetProperty.chartType && this.widget.widgetProperty.chartType != ''){
			this.soilNutritionsChart.chartType = (this.widget.widgetProperty.chartType == 'bar' ? 'ColumnChart' : 'LineChart');
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

	 /** MY
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
	ngOnDestroy() {
		this.resizeSub.unsubscribe();
		this.chartTypeChangeSub.unsubscribe();
	}
}
