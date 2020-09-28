import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { NotificationService, LookupService, FacilityService } from 'app/services';
import { NgxSpinnerService } from 'ngx-spinner'
import { AppConstant, MessageAlertDataModel } from "../../../app.constants";
import { Notification } from 'app/services/notification/notification.service';
import { MessageDialogComponent } from '../../../components/common/message-dialog/message-dialog.component';
import { MatDialog } from '@angular/material';
@Component({
  selector: 'app-zone-add',
  templateUrl: './zone-add.component.html',
  styleUrls: ['./zone-add.component.css']
})
export class ZoneAddComponent implements OnInit {
  checkSubmitStatus = false;
  isEdit = false;
  facilityList = [];
  zoneObject: any = {};
  zoneForm: FormGroup;
  zoneGuid: any;
  moduleName = 'Add New Zone';
  constructor( private router: Router,
    private _notificationService: NotificationService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,    
    private lookupService: LookupService,
    public _appConstant: AppConstant,
    private _service: FacilityService,
    public dialog: MatDialog,) { 
      //this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
      this.activatedRoute.params.subscribe(params => {
        if (params.zoneGuid != null) {
          this.getZoneDetail(params.zoneGuid);
          this.zoneGuid = params.zoneGuid;
          this.moduleName = "Edit Zone";
          this.isEdit = true;
        } else {
          this.zoneObject = { type: '',name:'',parentEntityGuid:'' }
        }
      }); 
    }

  ngOnInit() {
    this.createFormGroup();
    this.getFacilityLookup();
  }
  /**
  *For Get Zone detail
  *@param zoneGuid
  **/
 getZoneDetail(zoneGuid) {
  this.spinner.show();
  this._service.getFacilityDetails(zoneGuid).subscribe(response => {
    if (response.isSuccess === true) {
      this.spinner.hide();
      this.zoneObject = response.data;
     /* if(this.facilityObject.image){
        this.facilityObject.image=this.mediaUrl+this.facilityObject.image; 
        this.currentImage = this.facilityObject.image; 
        this.hasImage=true;
      } else {
        this.hasImage=false;
      } 
      this._service.getstatelist(response.data.countryGuid).subscribe(response => {
        this.stateList = response.data;
        setTimeout(() => {
          this.spinner.hide();
        }, 0);
      }); */
    }
  });
}
	/**
  * For create form
  */
 createFormGroup() {
  this.zoneForm = new FormGroup({
    parentEntityGuid: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    zoneid: new FormControl(''),
    type: new FormControl('', [Validators.required]),
    isActive: new FormControl(true),
    imageFile: new FormControl(''),
    guid: new FormControl(''),
  });
}

/**
  *For Add Zone
  **/
 manageaddZone() {

  this.checkSubmitStatus = true;
  if (this.isEdit) {
    this.zoneForm.get('guid').setValue(this.zoneGuid);
  } else {
    this.zoneForm.get('isActive').setValue(true);
  }
  if (this.zoneForm.status === "VALID") {
    this.spinner.show();
      this._service.addFacility(this.zoneForm.value).subscribe(response => {
        this.spinner.hide();
        if (response.isSuccess === true) {
          if (this.isEdit) {
            this._notificationService.handleResponse({message:"Zone has been updated successfully."},"success");
          } else {
            this._notificationService.handleResponse({message:"Zone has been added successfully."},"success");
          }
          this.router.navigate(['/zone']);
        } else {
          this._notificationService.handleResponse(response,"error");
        }
      });
   
  }
}
 /**
  * For convert text to lowercase
  */
 getdata(val) {
  if (val) {
    return val = val.toLowerCase();
  }
}
   /**
  * For Get Facility Lookup
  */
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

}
