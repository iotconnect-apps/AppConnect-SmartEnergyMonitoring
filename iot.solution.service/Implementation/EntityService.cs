using component.helper;
using component.logger;
using iot.solution.common;
using iot.solution.model.Repository.Interface;
using iot.solution.service.Interface;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Entity = iot.solution.entity;
using IOT = IoTConnect.Model;
using Model = iot.solution.model.Models;
using Response = iot.solution.entity.Response;
using LogHandler = component.services.loghandler;
using System.Reflection;

namespace iot.solution.service.Implementation
{
    public class EntityService : IEntityService
    {
        private readonly IEntityRepository _entityRepository;
        private readonly IotConnectClient _iotConnectClient;
        private readonly LogHandler.Logger _logger;
        private readonly IDeviceRepository _deviceRepository;

        public EntityService(IEntityRepository entityRepository, LogHandler.Logger logger,IDeviceRepository deviceRepository)
        {
            _logger = logger;
            _entityRepository = entityRepository;
            _deviceRepository = deviceRepository;
            _iotConnectClient = new IotConnectClient(SolutionConfiguration.BearerToken, SolutionConfiguration.Configuration.EnvironmentCode, SolutionConfiguration.Configuration.SolutionKey);
        }
        public List<Entity.EntityWithCounts> Get()
        {
            try
            {
                return _entityRepository.GetAll().Where(e => !e.IsDeleted).Select(p => Mapper.Configuration.Mapper.Map<Entity.EntityWithCounts>(p)).ToList();
            }
            catch (Exception ex)
            {

                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new List<Entity.EntityWithCounts>();
            }
        }
        public Entity.Entity Get(Guid id)
        {
            try
            {
                return _entityRepository.FindBy(r => r.Guid == id).Select(p => Mapper.Configuration.Mapper.Map<Entity.Entity>(p)).FirstOrDefault();
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return null;
            }
        }
        public Entity.ActionStatus Manage(Entity.EntityModel request)
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                if (request.Guid == null || request.Guid == Guid.Empty)
                {
                    var checkExisting = _entityRepository.FindBy(x => x.Name.Equals(request.Name) && x.CompanyGuid.Equals(SolutionConfiguration.CompanyId) && x.IsActive == true && !x.IsDeleted).FirstOrDefault();
                    if (checkExisting == null)
                    {
                        Entity.Entity ghEntity = Mapper.Configuration.Mapper.Map<Entity.EntityModel, Entity.Entity>(request);
                        var addEntityResult = AsyncHelpers.RunSync<IOT.DataResponse<IOT.AddEntityResult>>(() =>
                     _iotConnectClient.Entity.Add(Mapper.Configuration.Mapper.Map<IOT.AddEntityModel>(ghEntity)));
                        
                        if (addEntityResult != null && addEntityResult.status && addEntityResult.data != null)
                        {
                            request.Guid = Guid.Parse(addEntityResult.data.EntityGuid.ToUpper());
                            var dbEntity = Mapper.Configuration.Mapper.Map<Entity.EntityModel, Model.Entity>(request);
                            if (request.ImageFile != null)
                            {
                                // upload image                                     
                                dbEntity.Image = SaveEntityImage(request.Guid, request.ImageFile);
                            }
                            dbEntity.Guid = request.Guid;
                            dbEntity.CompanyGuid = SolutionConfiguration.CompanyId;
                            dbEntity.CreatedDate = DateTime.Now;
                            dbEntity.CreatedBy = SolutionConfiguration.CurrentUserId;
                            if (request.ParentEntityGuid == SolutionConfiguration.EntityGuid)
                            {
                                dbEntity.ParentEntityGuid = null;
                            }
                            actionStatus = _entityRepository.Manage(dbEntity);
                            actionStatus.Data = Mapper.Configuration.Mapper.Map<Model.Entity, Entity.Entity>(actionStatus.Data);
                            if (!actionStatus.Success)
                            {
                                _logger.ErrorLog(new Exception($"Facility is not added in solution database, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                                var deleteEntityResult = _iotConnectClient.Entity.Delete(request.Guid.ToString()).Result;
                                if (deleteEntityResult != null && deleteEntityResult.status)
                                {
                                    _logger.ErrorLog(new Exception($"Facility is not deleted from iotconnect, Error: {deleteEntityResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                                    actionStatus.Success = false;
                                    actionStatus.Message = new UtilityHelper().IOTResultMessage(deleteEntityResult.errorMessages);
                                }
                            }
                        }
                        else
                        {
                            _logger.ErrorLog(new Exception($"Facility is not added in iotconnect, Error: {addEntityResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                            actionStatus.Success = false;
                            actionStatus.Message = new UtilityHelper().IOTResultMessage(addEntityResult.errorMessages);
                        }
                    }
                    else
                    {
                        _logger.ErrorLog(new Exception($"Facility Already Exist !!"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                        actionStatus.Success = false;
                        actionStatus.Message = "Name Already Exists";
                    }
                }
                else
                {
                    var olddbEntity = _entityRepository.FindBy(x => x.Guid.Equals(request.Guid)).FirstOrDefault();
                    if (olddbEntity == null)
                    {
                        throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Facility");
                    }

                    var updateEntityResult = _iotConnectClient.Entity.Update(request.Guid.ToString(), Mapper.Configuration.Mapper.Map<IOT.UpdateEntityModel>(request)).Result;
                    if (updateEntityResult != null && updateEntityResult.status && updateEntityResult.data != null)
                    {
                      
                        string existingImage = olddbEntity.Image;
                        var dbEntity = Mapper.Configuration.Mapper.Map(request, olddbEntity);
                        if (request.ImageFile != null)
                        {
                            if (File.Exists(SolutionConfiguration.UploadBasePath + dbEntity.Image) && request.ImageFile.Length > 0)
                            {
                                //if already exists image then delete  old image from server
                                File.Delete(SolutionConfiguration.UploadBasePath + dbEntity.Image);
                            }
                            if (request.ImageFile.Length > 0)
                            {
                                // upload new image                                     
                                dbEntity.Image = SaveEntityImage(request.Guid, request.ImageFile);
                            }
                        }
                        else
                        {
                            dbEntity.Image = existingImage;
                        }
                        dbEntity.UpdatedDate = DateTime.Now;
                        dbEntity.UpdatedBy = SolutionConfiguration.CurrentUserId;
                        dbEntity.CompanyGuid = SolutionConfiguration.CompanyId;
                        if (request.ParentEntityGuid == SolutionConfiguration.EntityGuid)
                        {
                            dbEntity.ParentEntityGuid = null;
                        }
                        actionStatus = _entityRepository.Manage(dbEntity);
                        actionStatus.Data = Mapper.Configuration.Mapper.Map<Model.Entity, Entity.Entity>(dbEntity);
                        if (!actionStatus.Success)
                        {
                            _logger.ErrorLog(new Exception($"Facility is not updated in solution database, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                            actionStatus.Success = false;
                            actionStatus.Message = "Something Went Wrong!";
                        }
                    }
                    else
                    {
                        _logger.ErrorLog(new Exception($"Facility is not added in iotconnect, Error: {updateEntityResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                        actionStatus.Success = false;
                        actionStatus.Message = new UtilityHelper().IOTResultMessage(updateEntityResult.errorMessages);
                    }

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
        // Saving Image on Server   
        private string SaveEntityImage(Guid guid, IFormFile image)
        {
            var fileBasePath = SolutionConfiguration.UploadBasePath + SolutionConfiguration.CompanyFilePath;
            bool exists = System.IO.Directory.Exists(fileBasePath);
            if (!exists)
                System.IO.Directory.CreateDirectory(fileBasePath);
            string extension = Path.GetExtension(image.FileName);
            Int32 unixTimestamp = (Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            string fileName = guid.ToString() +"_"+ unixTimestamp;

            var filePath = Path.Combine(fileBasePath, fileName + extension);
            if (image != null && image.Length > 0)
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
                var dbEntity = _entityRepository.FindBy(x => x.Guid.Equals(id)).FirstOrDefault();
                if (dbEntity == null)
                {
                    throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Facility");
                }
                var dbChildEntity = _entityRepository.FindBy(x => x.ParentEntityGuid.Equals(id) && !x.IsDeleted).FirstOrDefault();
                var dbDevice = _deviceRepository.FindBy(x => !x.IsDeleted && (x.EntityGuid.Equals(id) && !x.IsDeleted || (dbChildEntity != null && x.EntityGuid.Equals(dbChildEntity.Guid)))).FirstOrDefault();
                if (dbDevice == null && dbChildEntity == null)
                {                    
                    var device = _iotConnectClient.Device.AllDevice(new IoTConnect.Model.AllDeviceModel { entityGuid = id.ToString() }).Result;
                    if (device != null && device.Data != null && device.Data.Any())
                    {
                        _logger.ErrorLog(new Exception($"Zone is not deleted in solution database.Sensor exists, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                        actionStatus.Success = false;
                        actionStatus.Message = "Facility or Zone is already associated with Meter in IoTConnect so it can not be deleted.";
                    }
                    else
                    {
                        var deleteEntityResult = _iotConnectClient.Entity.Delete(id.ToString()).Result;
                        if (deleteEntityResult != null && deleteEntityResult.status)
                        {
                            dbEntity.IsDeleted = true;
                            dbEntity.UpdatedDate = DateTime.Now;
                            dbEntity.UpdatedBy = SolutionConfiguration.CurrentUserId;
                            return _entityRepository.Update(dbEntity);
                        }
                        else
                        {
                            _logger.ErrorLog(new Exception($"Facility is not deleted from iotconnect, Error: {deleteEntityResult.message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                            actionStatus.Success = false;
                            actionStatus.Message = new UtilityHelper().IOTResultMessage(deleteEntityResult.errorMessages);
                        }
                    }
                    
                }
                else if (dbChildEntity != null)
                {
                    _logger.ErrorLog(new Exception($"Facility is not deleted in solution database.Zone exists, Error: {actionStatus.Message}"));
                    actionStatus.Success = false;
                    actionStatus.Message = "Facility is already associated with Zone so it can not be deleted.";
                }
                else
                {
                    _logger.ErrorLog(new Exception($"Facility is not deleted in solution database.Sensor exists, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                    actionStatus.Success = false;
                    actionStatus.Message = "Device is already associated with Facility or Zone so it can not be deleted.";
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
        // Delete Image on Server   
        private bool DeleteEntityImage(Guid guid, string imageName)
        {
            var fileBasePath = SolutionConfiguration.UploadBasePath + SolutionConfiguration.CompanyFilePath;
            var filePath = Path.Combine(fileBasePath, imageName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return true;
        }
        public Entity.ActionStatus DeleteImage(Guid id)
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(false);
            try
            {
                var dbEntity = _entityRepository.FindBy(x => x.Guid.Equals(id)).FirstOrDefault();
                if (dbEntity == null)
                {
                    throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Entity");
                }

                bool deleteStatus = DeleteEntityImage(id, dbEntity.Image);
                if (deleteStatus)
                {
                    dbEntity.Image = "";
                    dbEntity.UpdatedDate = DateTime.Now;
                    dbEntity.UpdatedBy = SolutionConfiguration.CurrentUserId;
                    dbEntity.CompanyGuid = SolutionConfiguration.CompanyId;

                    actionStatus = _entityRepository.Manage(dbEntity);
                    actionStatus.Data = Mapper.Configuration.Mapper.Map<Model.Entity, Entity.Entity>(dbEntity);
                    actionStatus.Success = true;
                    actionStatus.Message = "Image deleted successfully!";
                    if (!actionStatus.Success)
                    {
                        _logger.ErrorLog(new Exception($"Facility is not updated in database, Error: {actionStatus.Message}"), this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                        actionStatus.Success = false;
                        actionStatus.Message = actionStatus.Message;
                    }
                }
                else
                {
                    actionStatus.Success = false;
                    actionStatus.Message = "Image not deleted!";
                }
                return actionStatus;
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                actionStatus.Success = false;
                actionStatus.Message = ex.Message;
            }
            return actionStatus;
        }
        public Entity.SearchResult<List<Entity.EntityDetail>> List(Entity.SearchRequest request)
        {
            try
            {
                var result = _entityRepository.List(request);
                return new Entity.SearchResult<List<Entity.EntityDetail>>()
                {
                    Items = result.Items.Select(p => Mapper.Configuration.Mapper.Map<Entity.EntityDetail>(p)).ToList(),
                    Count = result.Count
                };
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.SearchResult<List<Entity.EntityDetail>>();
            }
        }

        public Entity.SearchResult<List<Entity.ZoneDetail>> ZoneList(Entity.SearchRequest request)
        {
            try
            {
                var result = _entityRepository.ZoneList(request);
                return new Entity.SearchResult<List<Entity.ZoneDetail>>()
                {
                    Items = result.Items.Select(p => Mapper.Configuration.Mapper.Map<Entity.ZoneDetail>(p)).ToList(),
                    Count = result.Count
                };
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.SearchResult<List<Entity.ZoneDetail>>();
            }
        }
        public Entity.ActionStatus UpdateStatus(Guid id, bool status)
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                var dbEntity = _entityRepository.FindBy(x => x.Guid.Equals(id)).FirstOrDefault();
                if (dbEntity == null)
                {
                    throw new NotFoundCustomException($"{CommonException.Name.NoRecordsFound} : Facility");
                }

                var dbChildEntity = _entityRepository.FindBy(x => x.ParentEntityGuid.Equals(id) && !x.IsDeleted).FirstOrDefault();
                var dbDevice = _deviceRepository.FindBy(x => !x.IsDeleted && (x.EntityGuid.Equals(id) || (dbChildEntity != null && x.EntityGuid.Equals(dbChildEntity.Guid)))).FirstOrDefault();
                if (dbDevice == null && dbChildEntity == null)
                {
                    dbEntity.IsActive = status;
                    dbEntity.UpdatedDate = DateTime.Now;
                    dbEntity.UpdatedBy = SolutionConfiguration.CurrentUserId;
                    return _entityRepository.Update(dbEntity);
                }
                else if (dbChildEntity != null)
                {
                    _logger.ErrorLog(new Exception($"Facility is not updated in solution database.Zone exists, Error: {actionStatus.Message}"));
                    actionStatus.Success = false;
                    actionStatus.Message = "Zone is already associated with Facility so its status can not be Updated.";
                }
                else
                {
                    _logger.ErrorLog(new Exception($"Facility is not updated in solution database.Sensor exists, Error: {actionStatus.Message}"));
                    actionStatus.Success = false;
                    actionStatus.Message = "Device is already associated with Facility so its status can not be Updated.";
                }

            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex);
                actionStatus.Success = false;
                actionStatus.Message = ex.Message;
            }
            return actionStatus;
        }
        public Response.EntityDetailResponse GetEntityDetail(Guid locationId)
        {
            return new Response.EntityDetailResponse()
            {
                EnergyUsage = 2700,
                Temperature = 73,
                Moisture = 15,
                Humidity = 62,
                WaterUsage = 3800,
                TotalDevices = 15
            };
        }

        #region Mobile API
        public Entity.SearchResult<List<Entity.TabletEntityDetail>> TabletEntityList(Entity.SearchRequest request)
        {
            try
            {
                var result = _entityRepository.List(request);
                return new Entity.SearchResult<List<Entity.TabletEntityDetail>>()
                {
                    Items = result.Items.Select(p => Mapper.Configuration.Mapper.Map<Entity.TabletEntityDetail>(p)).ToList(),
                    Count = result.Count
                };
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.SearchResult<List<Entity.TabletEntityDetail>>();
            }
        }

        public Entity.SearchResult<List<Entity.TabletZoneDetail>> TabletZoneList(Entity.SearchRequest request)
        {
            try
            {
                var result = _entityRepository.ZoneList(request);
                return new Entity.SearchResult<List<Entity.TabletZoneDetail>>()
                {
                    Items = result.Items.Select(p => Mapper.Configuration.Mapper.Map<Entity.TabletZoneDetail>(p)).ToList(),
                    Count = result.Count
                };
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                return new Entity.SearchResult<List<Entity.TabletZoneDetail>>();
            }
        }
        #endregion

    }
}
