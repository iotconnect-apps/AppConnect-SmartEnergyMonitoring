
import { Component, OnInit, ElementRef,ViewChild } from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Notification, NotificationService, FacilityService } from '../../../services';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppConstant, MessageAlertDataModel,DeleteAlertDataModel } from '../../../app.constants';

import { Location } from '@angular/common';
import { MatDialog } from '@angular/material';
import { MessageDialogComponent,DeleteDialogComponent } from '../..';

@Component({
  selector: 'app-add-new-facility',
  templateUrl: './add-new-facility.component.html',
  styleUrls: ['./add-new-facility.component.css']
})
export class AddNewFacilityComponent implements OnInit {

  @ViewChild('myFile', { static: false }) myFile: ElementRef;
  handleImgInput = false;
  hasImage = false;
  validstatus = false;
  MessageAlertDataModel: MessageAlertDataModel;
  deleteAlertDataModel: DeleteAlertDataModel;
  moduleName = "Add Facility";
  fileUrl: any;
  fileName = '';
  fileToUpload: any;
  facilityGuid = '';
  isEdit = false;
  facilityForm: FormGroup;
  checkSubmitStatus = false;
  countryList = [];
  stateList = [];
  mediaUrl: any;
  buttonname = 'Submit';
  facilityObject:any = {};
  currentImage:any;

  constructor(
    private router: Router,
    private _notificationService: NotificationService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private _service: FacilityService,
    public _appConstant: AppConstant,
    public location: Location,
    public dialog: MatDialog,
  ) {
    this.createFormGroup();
    this.activatedRoute.params.subscribe(params => {
      if (params.facilityGuid != 'add') {
        this.getFacilityDetails(params.facilityGuid);
        this.facilityGuid = params.facilityGuid;
        this.moduleName = "Edit Facility";
        this.isEdit = true;
        this.buttonname = 'Update'
      } else {
        this.facilityObject = { name: '', zipcode: '', countryGuid: '', stateGuid: '', isactive: 'true', city: '', latitude: '', longitude: '' }
      }
    });
  }

  ngOnInit() {
    this.mediaUrl = this._notificationService.apiBaseUrl;
    this.getcountryList();
  }
/**
  *For Remove Image
  **/
  imageRemove() {
    this.myFile.nativeElement.value = "";
    if (this.facilityObject['image'] == this.currentImage) {
      if (this.isEdit && this.hasImage) {
        this.facilityForm.get('imageFile').setValue('');
        if (!this.handleImgInput) {
          this.handleImgInput = false;
          this.deleteImgModel();
        }
        else {
          this.handleImgInput = false;
        }
      } else {
        this.spinner.hide();
        this.facilityObject['image'] = null;
        this.facilityForm.get('imageFile').setValue('');
      }
    }
    else {
      if (this.currentImage) {
        this.spinner.hide();
        this.facilityObject['image'] = this.currentImage;
        this.fileToUpload = false;
        this.fileName = '';
      }
      else {
        this.spinner.hide();
        this.facilityObject['image'] = null;
        this.facilityForm.get('imageFile').setValue('');
        this.fileToUpload = false;
        this.fileName = '';
      }
    }

  }
/**
  *For Delete Image Model
  **/

  deleteImgModel() {
    this.deleteAlertDataModel = {
      title: "Delete Image",
      message: this._appConstant.msgConfirm.replace('modulename', "Facility Image"),
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
        this.deletefacilityImg();
      }
    });
  }
/**
  *For Delete Facility Image
  **/
  deletefacilityImg() {
    this.spinner.show();
    this._service.removeImage(this.facilityGuid).subscribe(response => {
      this.spinner.hide();
      this.spinner.hide();
        if (response.isSuccess === true) {
          this.facilityObject['image']=null;
          this.currentImage = '';
          this.facilityForm.get('imageFile').setValue('');
        } else {
          this._notificationService.handleResponse(response,"error");
        }
    }, error => {
      this.spinner.hide();
      this._notificationService.handleResponse(error,"error");
    });
  }

/**
  *For Load Form
  **/

  createFormGroup() {
    this.facilityForm = new FormGroup({
      parentEntityGuid: new FormControl(''),
      countryGuid: new FormControl(null, [Validators.required]),
      stateGuid: new FormControl(null, [Validators.required]),
      city: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      zipcode: new FormControl('', [Validators.required, Validators.pattern('^[A-Z0-9 _]*$')]),
      description: new FormControl(''),
      address: new FormControl('', [Validators.required]),
      address2: new FormControl(''),
      isActive: new FormControl('', [Validators.required]),
      guid: new FormControl(null),
      latitude: new FormControl('', [Validators.required, Validators.pattern('^(\\+|-)?(?:90(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\\.[0-9]{1,6})?))$')]),
      longitude: new FormControl('', [Validators.required, Validators.pattern('^(\\+|-)?(?:180(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\\.[0-9]{1,6})?))$')]),
      imageFile: new FormControl(''),
    });
  }
/**
  *For Handle Image
  *@param event
  **/
  handleImageInput(event) {
    this.handleImgInput = true;
    let files = event.target.files;
    var that=this;
    if (files.length) {
      let fileType = files.item(0).name.split('.');
      let imagesTypes = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG'];
      if (imagesTypes.indexOf(fileType[fileType.length - 1]) !== -1) {
        this.validstatus = true;
        this.fileName = files.item(0).name;
        this.fileToUpload = files.item(0);
        if (event.target.files && event.target.files[0]) {
          var reader = new FileReader();
          reader.readAsDataURL(event.target.files[0]);
          reader.onload = (innerEvent: any) => {
            this.fileUrl = innerEvent.target.result;
            that.facilityObject.image=this.fileUrl;
          }
        }
      } else {
        this.imageRemove();
        this.MessageAlertDataModel = {
          title: "Facility Image",
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
  *For country List
  **/
  getcountryList() {
    this._service.getcountryList().subscribe(response => {
      this.countryList = response.data;
    });
  }
/**
  *For Change country
  *@param event
  **/
  changeCountry(event) {
    this.facilityForm.controls['stateGuid'].setValue(null, { emitEvent: true })
    if (event) {
      let id = event.value;
      this.spinner.show();
      this._service.getstatelist(id).subscribe(response => {
        this.spinner.hide();
        this.stateList = response.data;
      });
    }
  }
/**
  *For Get lowercase
  *@param val
  **/
  getdata(val) {
    return val = val.toLowerCase();
  }
/**
  *For Add facility
  **/
  manageFacility() {

    this.checkSubmitStatus = true;
    if (this.isEdit) {
      this.facilityForm.get('guid').setValue(this.facilityGuid);
      this.facilityForm.get('isActive').setValue(this.facilityObject['isActive']);
    } else {
      this.facilityForm.get('isActive').setValue(true);
    }
    if (this.facilityForm.status === "VALID") {
      if (this.validstatus == true || !this.facilityForm.value.imageFile) {
      if (this.fileToUpload) {
        this.facilityForm.get('imageFile').setValue(this.fileToUpload);
      }
      this.spinner.show();
      let currentUser = JSON.parse(localStorage.getItem('currentUser'));
      this.facilityForm.get('parentEntityGuid').setValue(currentUser.userDetail.entityGuid);

        this._service.addFacility(this.facilityForm.value).subscribe(response => {
          this.spinner.hide();
          if (response.isSuccess === true) {
            if (this.isEdit) {
              this._notificationService.handleResponse({message:"Facility has been updated successfully."},"success");
            } else {
              this._notificationService.handleResponse({message:"Facility has been added successfully."},"success");
            }
            this.router.navigate(['/facilities']);
          } else {
            this._notificationService.handleResponse(response,"error");
          }
        });
      } else {
        this.MessageAlertDataModel = {
          title: "Facility Image",
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
  *For Get facility detail
  *@param facilityGuid
  **/
  getFacilityDetails(facilityGuid) {
    this.spinner.show();
    this._service.getFacilityDetails(facilityGuid).subscribe(response => {
      if (response.isSuccess === true) {

        this.facilityObject = response.data;
        if(this.facilityObject.image){
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
        });
      }
    });
  }
}
