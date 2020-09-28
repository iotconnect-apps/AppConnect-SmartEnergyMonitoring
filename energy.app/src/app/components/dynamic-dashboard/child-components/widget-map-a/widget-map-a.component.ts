import { ChangeDetectorRef, ViewRef , OnInit, Component, Input, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner'
import { DashboardService } from 'app/services/dashboard/dashboard.service';
import { Notification, NotificationService } from 'app/services';
import { Subscription } from 'rxjs/Subscription';
import { AgmMap} from '@agm/core';


@Component({
	selector: 'app-widget-map-a',
	templateUrl: './widget-map-a.component.html',
	styleUrls: ['./widget-map-a.component.css']
})
export class WidgetMapAComponent implements OnInit, OnDestroy {
	searchParameters = {
		pageNumber: 0,
		pageNo: 0,
		pageSize: 10,
		searchText: '',
		sortBy: 'uniqueId asc'
	  };
	lat = 32.897480;
	lng = -97.040443;
	@Input() widget;
	@Input() count;
	@Input() resizeEvent: EventEmitter<any>;
	@Input() zoomChangeEvent: EventEmitter<any>;
	resizeSub: Subscription;
	zoomSub: Subscription;

	@ViewChild(AgmMap,{static:false}) myMap : any;
	mapHeight = '300px';
	facilityList = [];
	constructor(
		public dashboardService: DashboardService,
		private spinner: NgxSpinnerService,
		private _notificationService: NotificationService,
		private changeDetector: ChangeDetectorRef,
		) {
	}

	ngOnInit() {
		this.mapHeight = (this.widget.properties.h > 0 ? parseInt((this.widget.properties.h - 70).toString())+'px' : this.mapHeight);
		this.widget.widgetProperty.zoom = (this.widget.widgetProperty.zoom && this.widget.widgetProperty.zoom > 0 ? parseInt(this.widget.widgetProperty.zoom) : 10);
		this.resizeSub = this.resizeEvent.subscribe((widget) => {
			if(widget.id == this.widget.id){
				this.widget = widget;
				this.resizeMap();
			}
		});
		this.zoomSub = this.zoomChangeEvent.subscribe((widget) => {
			if(widget && widget.id == this.widget.id){
				this.widget = widget
				this.resizeMap();
			}
		});
		this.resizeMap();
		this.getFacilityList()
	}
	/**
   * Search Text
   * @param filterText
   */
  search(filterText) {
    this.searchParameters.searchText = filterText;
    this.searchParameters.pageNo = 0;
    this.getFacilityList();
  }
	/**
   * get facility List
   */
  getFacilityList() {
    this.facilityList = [];
    this.spinner.show();
    this.dashboardService.getFacilitylist(this.searchParameters).subscribe(response => {
      this.spinner.hide();
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

	resizeMap(){
		this.mapHeight = (this.widget.properties.h > 0 ? parseInt((this.widget.properties.h - 70).toString())+'px' : this.mapHeight);
		if(this.myMap){
			this.myMap.triggerResize();
		}
	}

	ngOnDestroy() {
		this.resizeSub.unsubscribe();
		this.zoomSub.unsubscribe();
	}
}
