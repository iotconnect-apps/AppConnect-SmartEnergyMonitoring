using component.helper;
using component.logger;
using iot.solution.common;
using iot.solution.data;
using iot.solution.entity;
using iot.solution.model.Repository.Interface;
using iot.solution.service.Interface;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Xml.Serialization;
using Entity = iot.solution.entity;
using IOT = IoTConnect.Model;
using Model = iot.solution.model.Models;
using Response = iot.solution.entity.Response;
using LogHandler = component.services.loghandler;
namespace iot.solution.service.Implementation
{
    public class DeviceService : IDeviceService
    {
        private readonly IDeviceRepository _deviceRepository;
        private readonly IHardwareKitRepository _hardwareKitRepository;
        private readonly ILookupService _lookupService;
        private readonly IotConnectClient _iotConnectClient;
        private readonly LogHandler.Logger _logger;
        public string ConnectionString = component.helper.SolutionConfiguration.Configuration.ConnectionString;
        public DeviceService(IDeviceRepository deviceRepository, ILookupService lookupService,IHardwareKitRepository hardwareKitRepository, LogHandler.Logger logger)
        {
            _logger = logger;
            _deviceRepository = deviceRepository;
            _lookupService = lookupService;
            _hardwareKitRepository = hardwareKitRepository;
            _iotConnectClient = new IotConnectClient(SolutionConfiguration.BearerToken, SolutionConfiguration.Configuration.EnvironmentCode, SolutionConfiguration.Configuration.SolutionKey);
        }

        public List<Entity.Device> Get()
        {
            try
            {
                return _deviceRepository.GetAll().Where(e => !e.IsDeleted && e.CompanyGuid == SolutionConfiguration.CompanyId).Select(p => Mapper.Configuration.Mapper.Map<Entity.Device>(p)).ToList();
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex);
                return null;
            }
        }
        public Entity.DeviceDetail Get(Guid id)
        {
            try
            {
                return _deviceRepository.Get(id);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex);
                return null;
            }
        }
       
        private String ObjectToXMLGeneric<T>(T filter)
        {

            string xml = null;
            using (StringWriter sw = new StringWriter())
            {

                XmlSerializer xs = new XmlSerializer(typeof(T));
                xs.Serialize(sw, filter);
                try
                {
                    xml = sw.ToString();

                }
                catch (Exception e)
                {
                    throw e;
                }
            }
            return xml;
        }
        public Entity.ActionStatus Manage(Entity.DeviceModel request)
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                
                var dbDevice = Mapper.Configuration.Mapper.Map<Entity.Device, Model.Device>(request);
                if (request.Guid == null || request.Guid == Guid.Empty)
                {
                    ////provision kit with kitcode and unique id 
                    //var kitDeviceList = _deviceRepository.ProvisionKit(new ProvisionKitRequest { DeviceGuid = new Guid(), KitCode = request.KitCode, UniqueId = request.UniqueId });
                    //if (kitDeviceList != null && kitDeviceList.Data != null && kitDeviceList.Data.Any())
                    //{                     
                        string templateGuid = _lookupService.GetIotTemplateGuidByCode();
                        if (!string.IsNullOrEmpty(templateGuid))
                        {
                            request.TemplateGuid = new Guid(templateGuid);
                            request.CompanyGuid = SolutionConfiguration.CompanyId;
                            
                            var addDeviceResult = _iotConnectClient.Device.Add(Mapper.Configuration.Mapper.Map<IOT.AddDeviceModel>(request)).Result;
                            //
                            if (addDeviceResult != null && addDeviceResult.status && addDeviceResult.data != null)
                            {
                                request.Guid = Guid.Parse(addDeviceResult.data.newid.ToUpper());
                                IOT.DataResponse<IOT.AcquireDeviceResult> acquireResult = _iotConnectClient.Device.AcquireDevice(request.UniqueId, new IOT.AcquireDeviceModel()).Result;
                                if (request.ImageFile != null)
                                {
                                    // upload image                                     
                                    dbDevice.Image = SaveDeviceImage(request.Guid.Value, request.ImageFile);
                                }
                                dbDevice.Guid = request.Guid.Value;
                                dbDevice.IsProvisioned = acquireResult.status;
                                dbDevice.IsActive = true;
                                dbDevice.CompanyGuid = SolutionConfiguration.CompanyId;
                                dbDevice.CreatedDate = DateTime.Now;
                                dbDevice.CreatedBy = SolutionConfiguration.CurrentUserId;
                                actionStatus = _deviceRepository.Manage(dbDevice);
                                actionStatus.Data = (Guid)(actionStatus.Data);
                                if (!actionStatus.Success)
                                {
                                    _logger.ErrorLog(new Exception($"Device is not added in solution database, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                                    var deleteEntityResult = _iotConnectClient.Device.Delete(request.Guid.Value.ToString()).Result;
                                    if (deleteEntityResult != null && deleteEntityResult.status)
                                    {
                                        _logger.ErrorLog(new Exception($"Device is not deleted from iotconnect"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);

                                        actionStatus.Success = false;
                                        actionStatus.Message = new UtilityHelper().IOTResultMessage(deleteEntityResult.errorMessages);
                                    }
                                }
                                //else
                                //{
                                //    //Update companyid in hardware kit
                                //    var hardwareKit = _hardwareKitRepository.GetByUniqueId(t => t.KitCode == request.KitCode && t.UniqueId == request.UniqueId);
                                //    if (hardwareKit != null)
                                //    {
                                //        hardwareKit.CompanyGuid = SolutionConfiguration.CompanyId;
                                //        _hardwareKitRepository.Update(hardwareKit);
                                //    }
                                //}
                            }
                            else
                            {

                                actionStatus.Data = Guid.Empty;
                                actionStatus.Success = false;
                                actionStatus.Message = new UtilityHelper().IOTResultMessage(addDeviceResult.errorMessages);

                            }
                        }
                        else
                        {
                            actionStatus.Success = false;
                            actionStatus.Data = Guid.Empty;
                            actionStatus.Message = "Template not found in IoTConnect";
                    }
                    //}
                    //else
                    //{
                    //    _logger.ErrorLog(new Exception($"Device KitCode or UniqueId is not valid"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                    //    actionStatus.Data = Guid.Empty;
                    //    actionStatus.Success = false;
                    //    actionStatus.Message = "Device KitCode or UniqueId is not valid!";
                    //}
                }
                else
                {
                    var olddbDevice = _deviceRepository.FindBy(x => x.Guid.Equals(request.Guid)).FirstOrDefault();
                    if (olddbDevice == null)
                    {
                        throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Device");
                    }
                    var updateEntityResult = _iotConnectClient.Device.Update(request.Guid.ToString(), Mapper.Configuration.Mapper.Map<IOT.UpdateDeviceModel>(request)).Result;
                    if (updateEntityResult != null && updateEntityResult.status)
                    {                       
                        if (request.ImageFile != null)
                        {
                            if (File.Exists(SolutionConfiguration.UploadBasePath + dbDevice.Image) && request.ImageFile.Length > 0)
                            {
                                //if already exists image then delete  old image from server
                                File.Delete(SolutionConfiguration.UploadBasePath + dbDevice.Image);
                            }
                            if (request.ImageFile.Length > 0)
                            {
                                // upload new image                                     
                                dbDevice.Image = SaveDeviceImage(dbDevice.Guid, request.ImageFile);
                            }
                        }
                        else
                        {
                            dbDevice.Image = olddbDevice.Image;
                        }
                        dbDevice.CreatedDate = olddbDevice.CreatedDate;
                        dbDevice.CreatedBy = olddbDevice.CreatedBy;
                        dbDevice.UpdatedDate = DateTime.Now;
                        dbDevice.UpdatedBy =SolutionConfiguration.CurrentUserId;
                        dbDevice.CompanyGuid = SolutionConfiguration.CompanyId;
                        dbDevice.TemplateGuid = olddbDevice.TemplateGuid;
                        actionStatus = _deviceRepository.Manage(dbDevice);
                        actionStatus.Data = (Guid)(actionStatus.Data);
                        if (!actionStatus.Success)
                        {
                            _logger.ErrorLog(new Exception($"Device is not updated in solution database, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                            actionStatus.Success = false;
                            actionStatus.Message = "Something Went Wrong!";
                        }
                    }
                    else
                    {
                        _logger.ErrorLog(new Exception($"Device is not updated in iotconnect, Error: {updateEntityResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                        actionStatus.Success = false;
                         actionStatus.Message = new UtilityHelper().IOTResultMessage(updateEntityResult.errorMessages);

                    }
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.ActionStatus
                {
                    Success = false,
                    Message = ex.Message
                };
            }
            return actionStatus;
        }
        // Saving Image on Server   
        private string SaveDeviceImage(Guid guid, IFormFile image)
        {
            var fileBasePath = SolutionConfiguration.UploadBasePath + SolutionConfiguration.CompanyFilePath;
            bool exists = System.IO.Directory.Exists(fileBasePath);
            if (!exists)
                System.IO.Directory.CreateDirectory(fileBasePath);
            string extension = Path.GetExtension(image.FileName);
            Int32 unixTimestamp = (Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            string fileName = guid.ToString() + "_" + unixTimestamp;
            var filePath = Path.Combine(fileBasePath, fileName + extension);
            if (image != null && image.Length > 0 && SolutionConfiguration.AllowedImages.Contains(extension.ToLower()))
            {
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    image.CopyTo(fileStream);
                }
                return Path.Combine(SolutionConfiguration.CompanyFilePath, fileName + extension);
            }
            return null;
        }
        public Entity.ActionStatus Delete(Guid id)
        {

            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                var dbDevice = _deviceRepository.FindBy(x => x.Guid.Equals(id)).FirstOrDefault();
                if (dbDevice == null)
                {
                    throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Device");
                }

                var deleteEntityResult = _iotConnectClient.Device.Delete(id.ToString()).Result;
                if (deleteEntityResult != null && deleteEntityResult.status)
                {
                    dbDevice.IsDeleted = true;
                    dbDevice.UpdatedDate = DateTime.Now;
                    dbDevice.UpdatedBy = SolutionConfiguration.CurrentUserId;
                    return _deviceRepository.Update(dbDevice);
                }
                else
                {
                    _logger.ErrorLog(new Exception($"Device is not deleted from iotconnect, Error: {deleteEntityResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                    actionStatus.Success = false;
                    actionStatus.Message = new UtilityHelper().IOTResultMessage(deleteEntityResult.errorMessages);
                }

            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                actionStatus.Success = false;
                actionStatus.Message = ex.Message;
            }
            return actionStatus;
        }
        public Entity.ActionStatus UpdateStatus(Guid id, bool status)
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                var dbDevice = _deviceRepository.FindBy(x => x.Guid.Equals(id)).FirstOrDefault();
                if (dbDevice == null)
                {
                    throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Device");
                }

                var updatedbStatusResult = _iotConnectClient.Device.UpdateDeviceStatus(dbDevice.Guid.ToString(), new IOT.UpdateDeviceStatusModel() { IsActive = status }).Result;
                if (updatedbStatusResult != null && updatedbStatusResult.status)
                {
                    dbDevice.IsActive = status;
                    dbDevice.UpdatedDate = DateTime.Now;
                    dbDevice.UpdatedBy = SolutionConfiguration.CurrentUserId;
                    return _deviceRepository.Update(dbDevice);
                }
                else
                {
                    _logger.ErrorLog(new Exception($"Device status is not updated in iotconnect, Error: {updatedbStatusResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                    actionStatus.Success = false;
                    actionStatus.Message = new UtilityHelper().IOTResultMessage(updatedbStatusResult.errorMessages);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                actionStatus.Success = false;
                actionStatus.Message = ex.Message;
            }
            return actionStatus;
        }
        public Entity.SearchResult<List<Entity.DeviceDetail>> List(Entity.SearchRequest request)
        {
            try
            {
                Entity.SearchResult<List<Model.DeviceDetail>> result = _deviceRepository.List(request);
                return new Entity.SearchResult<List<Entity.DeviceDetail>>()
                {
                    Items = result.Items.Select(p => Mapper.Configuration.Mapper.Map<Entity.DeviceDetail>(p)).ToList(),
                    Count = result.Count
                };
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.SearchResult<List<Entity.DeviceDetail>>();
            }
        }
        public List<Response.EntityWiseDeviceResponse> GetEntityWiseDevices(Guid locationId)
        {
            try
            {
                return _deviceRepository.GetEntityWiseDevices(locationId, null);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return null;
            }
        }
        public List<Response.EntityWiseDeviceResponse> GetEntityChildDevices(Guid deviceId)
        {
            try
            {
                return _deviceRepository.GetEntityWiseDevices(null, deviceId);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return null;
            }
        }
        public Entity.BaseResponse<int> ValidateKit(string kitCode)
        {
            Entity.BaseResponse<int> result = new Entity.BaseResponse<int>(true);
            try
            {
                return _deviceRepository.ValidateKit(kitCode);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return null;
            }

        }
        public Entity.BaseResponse<bool> ProvisionKit(Entity.Device request)
        {
            Entity.BaseResponse<bool> result = new Entity.BaseResponse<bool>(true);
            try
            {
                var repoResult = _deviceRepository.ProvisionKit(new ProvisionKitRequest { DeviceGuid = new Guid(), KitCode = request.KitCode, UniqueId = request.UniqueId });
                if (repoResult != null && repoResult.Data != null && repoResult.Data.Any())
                {
                    Entity.HardwareKit device = repoResult.Data.OrderBy(d => d.KitCode == request.KitCode && d.UniqueId == request.UniqueId).FirstOrDefault();
                    IOT.AddDeviceModel iotDeviceDetail = new IOT.AddDeviceModel()
                    {
                        DisplayName = device.Name,
                        //entityGuid = request.DeviceGuid.ToString(),
                        uniqueId = device.UniqueId,
                        deviceTemplateGuid = device.TemplateGuid.ToString(),
                        note = device.Note,
                        tag = device.Tag,
                        properties = new List<IOT.AddProperties>()
                    };
                    var addDeviceResult = _iotConnectClient.Device.Add(iotDeviceDetail).Result;
                    if (addDeviceResult != null && addDeviceResult.status && addDeviceResult.data != null)
                    {
                        Guid newDeviceId = Guid.Parse(addDeviceResult.data.newid.ToUpper());
                        IOT.DataResponse<IOT.AcquireDeviceResult> acquireResult = _iotConnectClient.Device.AcquireDevice(request.UniqueId, new IOT.AcquireDeviceModel()).Result;
                        Entity.ActionStatus actionStatus = _deviceRepository.Manage(new Model.Device()
                        {
                            Guid = newDeviceId,
                            CompanyGuid = SolutionConfiguration.CompanyId,
                            Description = request.Description,
                            EntityGuid = new Guid(request.EntityGuid.ToString()),
                            Specification = request.Specification,
                            TemplateGuid = device.TemplateGuid.Value,
                            ParentDeviceGuid = null,
                            TypeGuid = request.TypeGuid,
                            UniqueId = request.UniqueId,
                            Name = request.Name,
                            Note = request.Note,
                            Tag = request.Tag,
                            IsProvisioned = acquireResult.status,
                            IsActive = request.IsActive,
                            IsDeleted = false,
                            CreatedDate = DateTime.UtcNow,
                            CreatedBy = SolutionConfiguration.CurrentUserId
                        });
                        if (!actionStatus.Success)
                        {
                            _logger.ErrorLog(new Exception($"Device is not added in solution database, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                            var deleteEntityResult = _iotConnectClient.Device.Delete(newDeviceId.ToString()).Result;
                            if (deleteEntityResult != null && deleteEntityResult.status)
                            {
                                _logger.ErrorLog(new Exception($"Device is not deleted from iotconnect"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                                actionStatus.Success = false;
                                actionStatus.Message = new UtilityHelper().IOTResultMessage(deleteEntityResult.errorMessages);
                            }
                        }
                        else
                        {
                            //Update companyid in hardware kit
                            var hardwareKit = _hardwareKitRepository.GetByUniqueId(t => t.KitCode == request.KitCode && t.UniqueId == request.UniqueId);
                            if (hardwareKit != null)
                            {
                                hardwareKit.CompanyGuid = SolutionConfiguration.CompanyId;
                                _hardwareKitRepository.Update(hardwareKit);
                            }
                            result.IsSuccess = true;
                        }
                    }
                    else
                    {
                        _logger.ErrorLog(new Exception($"Kit is not added in iotconnect, Error: {addDeviceResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                        result.IsSuccess = false;
                        result.Message = new UtilityHelper().IOTResultMessage(addDeviceResult.errorMessages);
                    }

                }
                else
                {
                    return new Entity.BaseResponse<bool>(false, repoResult.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return null;
            }
            return result;
        }
        public Entity.BaseResponse<Entity.DeviceCounterResult> GetDeviceCounters()
        {
            Entity.BaseResponse<Entity.DeviceCounterResult> result = new Entity.BaseResponse<Entity.DeviceCounterResult>(true);
            try
            {
                IOT.DataResponse<List<IOT.DeviceCounterResult>> deviceCounterResult = _iotConnectClient.Device.GetDeviceCounters("").Result;
                if (deviceCounterResult != null && deviceCounterResult.status)
                {
                    result.Data = Mapper.Configuration.Mapper.Map<Entity.DeviceCounterResult>(deviceCounterResult.data.FirstOrDefault());
                    var device = _iotConnectClient.Device.AllDevice(new IoTConnect.Model.AllDeviceModel { }).Result;
                    if (device != null && device.Data != null && device.Data.Any())
                    {
                        var resultIoT = (from r in device.Data
                                         join l in _deviceRepository.GetAll().Where(t => t.CompanyGuid.Equals(SolutionConfiguration.CompanyId) && !t.IsDeleted).ToList()
                   on r.Guid.ToUpper() equals l.Guid.ToString().ToUpper()
                                         select new
                                         {
                                             r.IsActive,
                                             r.IsConnected,
                                             r.Guid
                                         }).ToList();
                        result.Data.connected = resultIoT.Where(t => t.IsConnected).Count();
                        result.Data.disConnected = resultIoT.Where(t => !t.IsConnected).Count();
                        result.Data.active = resultIoT.Where(t => t.IsActive).Count();
                        result.Data.inActive = resultIoT.Where(t => !t.IsActive).Count();
                        result.Data.total = resultIoT.Count();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.BaseResponse<Entity.DeviceCounterResult>(false, ex.Message);
            }
            return result;
        }

        public Entity.BaseResponse<Entity.DeviceCounterResult> GetDeviceCountersByEntity(Guid entityGuid)
        {
            Entity.BaseResponse<Entity.DeviceCounterResult> result = new Entity.BaseResponse<Entity.DeviceCounterResult>(true);
            try
            {
                IOT.DataResponse<List<IOT.DeviceCounterResult>> deviceCounterResult = _iotConnectClient.Device.GetDeviceCounters("").Result;
                var devicelist = _iotConnectClient.Device.AllDevice(new IoTConnect.Model.AllDeviceModel { }).Result;
                if (deviceCounterResult != null && deviceCounterResult.status)
                {
                    result.Data = Mapper.Configuration.Mapper.Map<Entity.DeviceCounterResult>(deviceCounterResult.data.FirstOrDefault());
                    var device = _deviceRepository.List(new Entity.SearchRequest { CompanyId = Convert.ToString(SolutionConfiguration.CompanyId),ParentEntityId= entityGuid,PageNumber=-1,PageSize=-1,OrderBy="",SearchText="" });
                    if (device != null && device.Items.Count()>0)
                    {
                        var resultIoT = (from r in device.Items
                                         join l in devicelist.Data
                   on r.Guid.ToString().ToUpper() equals l.Guid.ToString().ToUpper()
                                         select new
                                         {
                                             l.IsActive,
                                             l.IsConnected,
                                             l.Guid
                                         }).ToList();
                        result.Data.connected = resultIoT.Where(t => t.IsConnected).Count();
                        result.Data.disConnected = resultIoT.Where(t => !t.IsConnected).Count();
                        result.Data.total = resultIoT.Count();
                    }
                }
                else
                {
                    result.Data = null;
                    result.IsSuccess = false;
                    result.Message = new UtilityHelper().IOTResultMessage(deviceCounterResult.errorMessages);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.BaseResponse<Entity.DeviceCounterResult>(false, ex.Message);
            }
            return result;
        }
        public Entity.BaseResponse<List<Entity.DeviceTelemetryDataResult>> GetTelemetryData(Guid deviceId)
        {
            Entity.BaseResponse<List<Entity.DeviceTelemetryDataResult>> result = new Entity.BaseResponse<List<Entity.DeviceTelemetryDataResult>>(true);
            try
            {
                IOT.DataResponse<List<IOT.DeviceTelemetryData>> deviceCounterResult = _iotConnectClient.Device.GetTelemetryData(deviceId.ToString()).Result;
                if (deviceCounterResult != null && deviceCounterResult.status)
                {
                    result.Data = deviceCounterResult.data.Select(d => Mapper.Configuration.Mapper.Map<Entity.DeviceTelemetryDataResult>(d)).ToList();
                }
                else
                {
                    result.Data = null;
                    result.IsSuccess = false;
                    result.Message = new UtilityHelper().IOTResultMessage(deviceCounterResult.errorMessages);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.BaseResponse<List<Entity.DeviceTelemetryDataResult>>(false, ex.Message);
            }
            return result;
        }

        public Entity.BaseResponse<Entity.DeviceConnectionStatusResult> GetConnectionStatus(string uniqueId)
        {
            Entity.BaseResponse<Entity.DeviceConnectionStatusResult> result = new Entity.BaseResponse<Entity.DeviceConnectionStatusResult>(true);
            try
            {
                IOT.DataResponse<List<IOT.DeviceConnectionStatus>> deviceConnectionStatus = _iotConnectClient.Device.GetConnectionStatus(uniqueId).Result;
                if (deviceConnectionStatus != null && deviceConnectionStatus.status && deviceConnectionStatus.data != null)
                {
                    result.Data = Mapper.Configuration.Mapper.Map<Entity.DeviceConnectionStatusResult>(deviceConnectionStatus.data.FirstOrDefault());
                }
                else
                {
                    result.Data = null;
                    result.IsSuccess = false;
                    result.Message = new UtilityHelper().IOTResultMessage(deviceConnectionStatus.errorMessages);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.BaseResponse<Entity.DeviceConnectionStatusResult>(false, ex.Message);
            }
            return result;
        }

        #region Mobile API
        public Entity.SearchResult<List<Entity.DeviceDetailMobile>> MList(Entity.SearchRequest request)
        {
            try
            {
                Entity.SearchResult<List<Model.DeviceDetail>> result = _deviceRepository.List(request);
                return new Entity.SearchResult<List<Entity.DeviceDetailMobile>>()
                {
                    Items = result.Items.Select(p => Mapper.Configuration.Mapper.Map<Entity.DeviceDetailMobile>(p)).ToList(),
                    Count = result.Count
                };
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.SearchResult<List<Entity.DeviceDetailMobile>>();
            }
        }
        #endregion
    }
}