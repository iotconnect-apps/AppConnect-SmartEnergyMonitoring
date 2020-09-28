import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { NotificationService, LookupService } from 'app/services';
import { NgxSpinnerService } from 'ngx-spinner'
import { AppConstant, MessageAlertDataModel } from "../../../app.constants";
import { MessageDialogComponent } from '../../../components/common/message-dialog/message-dialog.component';
import { MatDialog } from '@angular/material';
export interface StatusList {
  id: boolean;
  status: string;
}
@Component({
  selector: 'app-meter-add',
  templateUrl: './meter-add.component.html',
  styleUrls: ['./meter-add.component.css']
})
export class MeterAddComponent implements OnInit {
  @ViewChild('myFile', { static: false }) myFile: ElementRef;
  validstatus = false;
  MessageAlertDataModel: MessageAlertDataModel;
  unique = false;
  currentUser: any;
  fileUrl: any;
  fileName = '';
  fileToUpload: any = null;
  status;
  moduleName = "Add Meter";
  parentDeviceObject: any = {};
  deviceObject = {};
  deviceGuid = '';
  parentDeviceGuid = '';
  isEdit = false;
  sensorForm: FormGroup;
  checkSubmitStatus = false;
  templateList = [];
  tagList = [];
  zoneList = [];
  facilityList = [];
  statusList: StatusList[] = [
    {
      id: true,
      status: 'Active'
    },
    {
      id: false,
      status: 'In-active'
    }

  ];
  sensorObject: any = {};

  sensorGuid: any;
  constructor(
    private router: Router,
    private _notificationService: NotificationService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private lookupService: LookupService,
    public _appConstant: AppConstant,
    public dialog: MatDialog,
  ) {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.activatedRoute.params.subscribe(params => {
      if (params.sensorGuid != null) {
        this.sensorGuid = params.sensorGuid;
        this.moduleName = "Edit Meter";
        this.isEdit = true;
      } else {
        this.sensorObject = { sensorGuid: '', entityGuid: '', name: '', templateGuid: '', uniqueId: '' }
      }
    });
  }

  // before view init
  ngOnInit() {
    this.createFormGroup();
    this.getFacilityLookup();
  }

  /**
    * Load FormGroup
    */

  createFormGroup() {
    this.sensorForm = new FormGroup({
      imageFile: new FormControl(''),
      guid: new FormControl(''),
      companyGuid: new FormControl(null),
      name: new FormControl('', [Validators.required]),
      sensorGuid: new FormControl('', [Validators.required]),
      entityGuid: new FormControl('', [Validators.required]),
      uniqueId: new FormControl('', [Validators.required, Validators.pattern('^[A-Za-z0-9]+$')]),
      tag: new FormControl(''),
      note: new FormControl(''),
      isProvisioned: new FormControl(false),
      isActive: new FormControl(true),
      specification: new FormControl(''),
      description: new FormControl('')
    });
  }
  /**
	 * Get facility
	 */
  getFacilityLookup() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.lookupService.getsensor(currentUser.userDetail.companyId).
      subscribe(response => {
        if (response.isSuccess === true) {
          this.facilityList = response.data;
          this.facilityList = this.facilityList.filter(word => word.isActive == true);
        } else {
          this._notificationService.handleResponse(response, "error");
        }
      }, error => {
        this.spinner.hide();
        this._notificationService.handleResponse(error, "error");
      })

  }
	/**
	 * Add device
	 */

  addSensor() {
    this.checkSubmitStatus = true;
    this.sensorForm.get('guid').setValue(null);
    if (this.sensorForm.status === "VALID") {
      if (this.validstatus == true || !this.sensorForm.value.imageFile) {
        if (this.fileToUpload) {
          this.sensorForm.get('imageFile').setValue(this.fileToUpload);
        }
        if (this.isEdit) {
          this.sensorForm.registerControl("guid", new FormControl(''));
          this.sensorForm.patchValue({ "guid": this.sensorGuid });
        }
        this.spinner.show();
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.sensorForm.get('companyGuid').setValue(currentUser.userDetail.companyId);
        this.lookupService.addUpdateSensor(this.sensorForm.value).subscribe(response => {
          if (response.isSuccess === true) {
           
            if (response.data.updatedBy != null) {
              this._notificationService.handleResponse({ message: "Meter has been updated successfully." }, "success");
            } else {
              this._notificationService.handleResponse({ message: "Meter has been added successfully." }, "success");
            }
            this.router.navigate(['meter']);
          } else {
            this._notificationService.handleResponse(response, "error");
          }
          this.spinner.hide();
        })
      } else {
        this.imageRemove();
        this.MessageAlertDataModel = {
          title: "Sensor Image",
          message: "Invalid Image Type.",
          message2: "Upload .jpg, .jpeg, .png Image Only.",
          okButtonName: "OK",
        };
        const dialogRef = this.dialog.open(MessageDialogComponent, {
          width: '400px',
          height: 'auto',
          data: this.MessageAlertDataModel,
          disableClose: false
        });
      }
    }
  }
  /**
	 * Convert Lowercase
	 */
  getdata(val) {
    if (val) {
      return val = val.toLowerCase();
    }
  }
  /**
	 * Get Zone
	 */
  getZone(parentEntityId) {
    this.lookupService.getZonelookup(parentEntityId).
      subscribe(response => {
        if (response.isSuccess === true) {
          this.zoneList = response.data;
        } else {
          this._notificationService.handleResponse(response, "error");
        }
      }, error => {
        this.spinner.hide();
        this._notificationService.handleResponse(error, "error");
      })
  }
  /**
    * Handle Image Input
    */
  handleImageInput(event) {
    let files = event.target.files;
    if (files.length) {
      let fileType = files.item(0).name.split('.');
      let imagesTypes = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG'];
      if (imagesTypes.indexOf(fileType[fileType.length - 1]) !== -1) {
        this.validstatus = true;
        this.fileName = files.item(0).name;
        this.fileToUpload = files.item(0);
      } else {
        this.imageRemove();
        this.MessageAlertDataModel = {
          title: "Sensor Image",
          message: "Invalid Image Type.",
          message2: "Upload .jpg, .jpeg, .png Image Only.",
          okButtonName: "OK",
        };
        const dialogRef = this.dialog.open(MessageDialogComponent, {
          width: '400px',
          height: 'auto',
          data: this.MessageAlertDataModel,
          disableClose: false
        });
      }
    }

    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (innerEvent: any) => {
        this.fileUrl = innerEvent.target.result;
      }
    }
  }

  /**
  * Remove image
  * */
  imageRemove() {
    this.myFile.nativeElement.value = "";
    this.fileUrl = null;
    this.sensorForm.get('imageFile').setValue('');
    this.fileToUpload = false;
    this.fileName = '';
  }
}
