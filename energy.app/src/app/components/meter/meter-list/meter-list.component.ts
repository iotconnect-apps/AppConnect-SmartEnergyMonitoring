import { Component, OnInit, Input, OnChanges } from '@angular/core'
import { Router } from '@angular/router'
import { NgxSpinnerService } from 'ngx-spinner'
import { MatDialog, MatTableDataSource, MatSort, MatPaginator } from '@angular/material'
import { DeleteDialogComponent } from '../../../components/common/delete-dialog/delete-dialog.component';
import { DeviceService, NotificationService, LookupService } from 'app/services';
import { AppConstant, DeleteAlertDataModel } from "../../../app.constants";

@Component({
  selector: 'app-meter-list',
  templateUrl: './meter-list.component.html',
  styleUrls: ['./meter-list.component.css']
})

export class MeterListComponent implements OnInit {
  zoneList = [];
  selectedFacility: any = '';
  selectedZone: any = '';
  isFilterShow: boolean = false;
  changeStatusDeviceName: any;
  changeStatusDeviceStatus: any;
  @Input() parentDeviceId: string;
  order = true;
  isSearch = false;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  reverse = false;
  orderBy = 'uniqueId';
  totalRecords = 0;
  searchParameters = {
    parentEntityGuid:'',
    entityGuid:'',
    pageNo: 0,
    pageSize: 10,
    searchText: '',
    sortBy: 'uniqueId asc'
  };
  displayedColumns: string[] = ['uniqueId', 'entityName ','subEntityName', 'isProvisioned'];
  dataSource = [];
  facilityList = [];
  deleteAlertDataModel: DeleteAlertDataModel;

  constructor(
    private spinner: NgxSpinnerService,
    private router: Router,
    public dialog: MatDialog,
    private deviceService: DeviceService,
    private _notificationService: NotificationService,
    public _appConstant: AppConstant,
    private lookupService: LookupService
  ) { }


  //Called whenever an input value changes
  ngOnInit() {
    this.getMeterList();
    this.getFacilityLookup();
  }
  /**
  * Show hide filter
  */
 showHideFilter() {
  this.isFilterShow = !this.isFilterShow;
}
/**
 * redirect route
 * */
  clickAdd() {
    this.router.navigate(['/meter/add']);
  }
/**
 * Order By field
 * */
  setOrder(sort: any) {
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.searchParameters.sortBy = sort.active + ' ' + sort.direction;
    this.getMeterList();
  }
/**
 * Delete Model
 * */
  deleteModel(SensorModel: any) {
    this.deleteAlertDataModel = {
      title: "Delete Sensor",
      message: this._appConstant.msgConfirm.replace('modulename', "sensor"),
      okButtonName: "Confirm",
      cancelButtonName: "Cancel",
    };
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '400px',
      height: 'auto',
      data: this.deleteAlertDataModel,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteMeter(SensorModel.guid);
      }
    });
  }
/**
 * Change Pagination
 * */
  ChangePaginationAsPageChange(pagechangeresponse) {
    this.searchParameters.pageNo = pagechangeresponse.pageIndex;
    this.searchParameters.pageSize = pagechangeresponse.pageSize;
    this.isSearch = true;
    this.getMeterList();
  }
/**
 * Search Text
 * */
  searchTextCallback(filterText) {
    this.searchParameters.searchText = filterText;
    this.searchParameters.pageNo = 0;
    this.getMeterList();
    this.isSearch = true;
  }

/**
 * Change Meter Status
 * */
  changeMeterStatus(sensorId, isActive) {
    this.spinner.show();
    this.deviceService.changeStatus(sensorId, isActive).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        this._notificationService.handleResponse({message:this._appConstant.msgStatusChange.replace("modulename", "Sensor")},"success");
        this.getMeterList();

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
 * Delete Meter
 * */
  deleteMeter(guid) {
    this.spinner.show();
    this.deviceService.deleteDevice(guid).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        this._notificationService.handleResponse({message:this._appConstant.msgDeleted.replace("modulename", "Sensor")},"success");
        this.getMeterList();
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
 * Get Meter
 * */
  getMeterList() {
    this.spinner.show();
    this.deviceService.getDeviceList(this.searchParameters).subscribe(response => {
      this.spinner.hide();
      if (response.isSuccess === true) {
        this.totalRecords = response.data.count;
        this.dataSource = response.data.items;
      }
      else {
        this._notificationService.handleResponse(response,"error");
        this.dataSource = [];
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
 * Get Zone Lookup by facilityid
 * */
changeFacilty(event) {
  if (event) {
    let facilityid = event.value;
    this.lookupService.getZonelookup(facilityid).
    subscribe(response => {
      if (response.isSuccess === true) {
        this.zoneList = response.data;
        
      } else {
        this._notificationService.handleResponse(response,"error");
      }
    }, error => {
      this.spinner.hide();
      this._notificationService.handleResponse(error,"error");
    })
  }
}
 /**
   * Filter list by facility and zone
   */
  filterBy(facility,selectedZone) {
    //this.deviceList = [];
    this.searchParameters = {
      parentEntityGuid: facility,
      entityGuid:selectedZone,
      pageNo: 0,
      pageSize: 10,
      searchText: "",
      sortBy: "name asc"
    };
    this.getMeterList();
  }
   /**
   * Clear filter for inventory list
   * */
  clearFilter() {
    this.isFilterShow = false;
    this.zoneList = [];
    this.selectedFacility = '';
    this.selectedZone = '';
    this.searchParameters = {
      parentEntityGuid: '',
      entityGuid:'',
      pageNo: 0,
      pageSize: 10,
      searchText: "",
      sortBy: "name asc"
    };
    this.getMeterList();

  }
}
