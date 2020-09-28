import { Component, OnInit, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { NgxSpinnerService } from 'ngx-spinner'
import { UserService } from 'app/services/user/user.service';
import { MatDialog, MatPaginator, MatSort, MatTableDataSource } from '@angular/material'
import { DeleteDialogComponent } from '../../../components/common/delete-dialog/delete-dialog.component';
import { tap } from 'rxjs/operators';
import { AppConstant, DeleteAlertDataModel } from "../../../app.constants";
import { Notification, NotificationService, FacilityService, LookupService } from 'app/services';
import { empty } from 'rxjs';

@Component({
	selector: 'app-zone-list',
	templateUrl: './zone-list.component.html',
	styleUrls: ['./zone-list.component.css']
})

export class ZoneListComponent implements OnInit {
	selectedFacility: any = '';
	isFilterShow: boolean = false;
	changeStatusDeviceName:any;
	changeStatusDeviceStatus:any;
	changeDeviceStatus:any;
	deleteAlertDataModel: DeleteAlertDataModel;
	currentUser = JSON.parse(localStorage.getItem("currentUser"));
	zoneList = [];
	facilityList = [];
	totalRecords = 0;
	pageSizeOptions: number[] = [5, 10, 25, 100];
	moduleName = "Zones";
	displayedColumns: string[] = ['type', 'name', 'totalDevices', 'parentEntityName','action'];
	order = true;
	isSearch = false;
	reverse = false;
	orderBy = 'name';
	searchParameters = {
        parentEntityGuid: '',
		pageNumber: 0,
		pageSize: 10,
		searchText: '',
		sortBy: 'type asc'
	};
	dataSource: MatTableDataSource<any>;
	@ViewChild('paginator', { static: false }) paginator: MatPaginator;
	@ViewChild(MatSort, { static: false }) sort: MatSort;

	constructor(
		public dialog: MatDialog,
		private spinner: NgxSpinnerService,
		private router: Router,
		private userService: UserService,
		public _appConstant: AppConstant,
		private _notificationService: NotificationService,
		public _service: FacilityService,
		private lookupService: LookupService
	) { }

  ngOnInit() {
		this.getZoneList();
		this.getFacilityLookup();
	}
 /**
  * Show hide filter
  */
 showHideFilter() {
	this.isFilterShow = !this.isFilterShow;
  }
	applyFilter(filterValue: string) {
		filterValue = filterValue.trim(); // Remove whitespace
		filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
		this.dataSource.filter = filterValue;
	}
	clickAdd() {
		this.router.navigate(['/zone/add']);
	}

	setOrder(sort: any) {
		console.log(sort);
		if (!sort.active || sort.direction === '') {
			return;
		}
		this.searchParameters.sortBy = sort.active + ' ' + sort.direction;
		this.getZoneList();
	}

	log(obj) {
		console.log(obj);
	}
	onPageSizeChangeCallback(pageSize) {
		this.searchParameters.pageSize = pageSize;
		this.searchParameters.pageNumber = 1;
		this.isSearch = true;
		this.getZoneList();
	}

	ChangePaginationAsPageChange(pagechangeresponse) {
		this.searchParameters.pageNumber = pagechangeresponse.pageIndex;
		this.searchParameters.pageSize = pagechangeresponse.pageSize;
		this.isSearch = true;
		this.getZoneList();
	}

	searchTextCallback(filterText) {
		this.searchParameters.searchText = filterText;
		this.searchParameters.pageNumber = 0;
		this.getZoneList();
		this.isSearch = true;
	}

	getZoneList() {
		this.spinner.show();
		this._service.getZonelist(this.searchParameters).subscribe(response => {
			this.spinner.hide();
			if (response.data.items) {
				this.totalRecords = response.data.count;
				// this.isSearch = false;
				this.zoneList = response.data.items;
			}
			else {
				this._notificationService.handleResponse(response,"error");
				this.zoneList = [];
			}
		}, error => {
			this.spinner.hide();
			this._notificationService.handleResponse(error,"error");
		});
	}

	onKey(filterValue: string) {
		this.applyFilter(filterValue);
	}

	deleteModel(zoneModel: any) {
		this.deleteAlertDataModel = {
			title: "Delete Zone",
			message: this._appConstant.msgConfirm.replace('modulename', "Zone"),
			okButtonName: "Yes",
			cancelButtonName: "No",
		};
		const dialogRef = this.dialog.open(DeleteDialogComponent, {
			width: '400px',
			height: 'auto',
			data: this.deleteAlertDataModel,
			disableClose: false
		});
		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				this.deleteZone(zoneModel.guid);
			}
		});
	}

	deleteZone(guid) {
		this.spinner.show();
		this._service.deleteFacility(guid).subscribe(response => {
			this.spinner.hide();
			if (response.isSuccess === true) {
				this._notificationService.handleResponse({message:this._appConstant.msgDeleted.replace("modulename", "Zone")},"success");
				this.getZoneList();

			}
			else {
				this._notificationService.handleResponse(response,"error");
			}

		}, error => {
			this.spinner.hide();
			this._notificationService.handleResponse(error,"error");
		});
	}

	activeInactiveuser(id: string, isActive: boolean, fname: string, lname: string) {
		var status = isActive == false ? this._appConstant.activeStatus : this._appConstant.inactiveStatus;
		var mapObj = {
			statusname: status,
			fieldname: fname + " " + lname,
			modulename: ""
		};
		this.deleteAlertDataModel = {
			title: "Status",
			message: this._appConstant.msgStatusConfirm.replace(/statusname|fieldname|modulename/gi, function (matched) {
				return mapObj[matched];
			}),
			okButtonName: "Yes",
			cancelButtonName: "No",
		};
		const dialogRef = this.dialog.open(DeleteDialogComponent, {
			width: '400px',
			height: 'auto',
			data: this.deleteAlertDataModel,
			disableClose: false
		});
		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				this.changeUserStatus(id, isActive);

			}
		});

	}
	changeUserStatus(id, isActive) {

		this.spinner.show();
		this.userService.changeStatus(id, isActive).subscribe(response => {
			this.spinner.hide();
			if (response.isSuccess === true) {
				this._notificationService.handleResponse({message:this._appConstant.msgDeleted.replace("modulename", "User")},"success");
				this.getZoneList();

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
 * Get facilities Lookup by companyId
 * */
getFacilityLookup() {
	let currentUser = JSON.parse(localStorage.getItem('currentUser'));
	this.lookupService.getsensor(currentUser.userDetail.companyId).
	  subscribe(response => {
		if (response.isSuccess === true) {
		  this.facilityList = response.data;
		  this.facilityList = this.facilityList.filter(word => word.isActive == true);
		} else {
			this._notificationService.handleResponse(response,"error");
		}
	  }, error => {
		this.spinner.hide();
		this._notificationService.handleResponse(error,"error");
	  })
  
  }
   /**
   * Filter list by facility and zone
   */
  filterBy(entityGuid) {
    //this.deviceList = [];
    this.searchParameters = {
	parentEntityGuid: entityGuid,
      pageNumber: 0,
      pageSize: 10,
      searchText: "",
      sortBy: "type asc"
    };
    this.getZoneList();
  }
   /**
   * Clear filter for inventory list
   * */
  clearFilter() {
    this.isFilterShow = false;
    //this.deviceList = [];
    this.selectedFacility = '';
    this.searchParameters = {
		parentEntityGuid: '',
		pageNumber: 0,
      	pageSize: 10,
      	searchText: "",
      	sortBy: "type asc"
    };
    this.getZoneList();

  }
}
