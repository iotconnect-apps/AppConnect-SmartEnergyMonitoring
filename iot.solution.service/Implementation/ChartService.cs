using iot.solution.data;
using iot.solution.model.Repository.Interface;
using iot.solution.service.Interface;
using System.Collections.Generic;
using Request = iot.solution.entity.Request;
using Response = iot.solution.entity.Response;
using System.Data;
using System.Data.Common;
using System.Reflection;
using component.logger;
using System;
using Entity = iot.solution.entity;
using LogHandler = component.services.loghandler;
using System.Linq;

namespace iot.solution.service.Implementation
{
    public class ChartService : IChartService
    {
        private readonly IEntityRepository _entityRepository;
        private readonly LogHandler.Logger _logger;
        public string ConnectionString = component.helper.SolutionConfiguration.Configuration.ConnectionString;
        public ChartService(IEntityRepository entityRepository, LogHandler.Logger logger)//, LogHandler.Logger logger)
        {
            _entityRepository = entityRepository;
            _logger = logger;
        }
        public Entity.ActionStatus TelemetrySummary_DayWise()
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                _logger.InfoLog(LogHandler.Constants.ACTION_ENTRY, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<DbParameter> parameters = new List<DbParameter>();
                    sqlDataAccess.ExecuteNonQuery(sqlDataAccess.CreateCommand("[TelemetrySummary_DayWise_Add]", CommandType.StoredProcedure, null), parameters.ToArray());
                }
                _logger.InfoLog(LogHandler.Constants.ACTION_EXIT, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);

            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                actionStatus.Success = false;
                actionStatus.Message = ex.Message;
            }
            return actionStatus;
        }
        public Entity.ActionStatus TelemetrySummary_HourWise()
        {
            Entity.ActionStatus actionStatus = new Entity.ActionStatus(true);
            try
            {
                _logger.InfoLog(LogHandler.Constants.ACTION_ENTRY, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<DbParameter> parameters = new List<DbParameter>();
                    sqlDataAccess.ExecuteNonQuery(sqlDataAccess.CreateCommand("[TelemetrySummary_HourWise_Add]", CommandType.StoredProcedure, null), parameters.ToArray());
                }
                _logger.InfoLog(LogHandler.Constants.ACTION_EXIT, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);

            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
                actionStatus.Success = false;
                actionStatus.Message = ex.Message;
            }
            return actionStatus;
        }
        public Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>> GetEnergyConsumptionByMeter(Request.ChartRequest request)
        {
            Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>> result = new Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>>();
            try
            {
                _logger.InfoLog(Constants.ACTION_ENTRY, "Chart_StatisticsByEntity.Get");
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<DbParameter> parameters = sqlDataAccess.CreateParams(component.helper.SolutionConfiguration.CurrentUserId, component.helper.SolutionConfiguration.Version);
                    parameters.Add(sqlDataAccess.CreateParameter("entityGuid", request.EntityGuid, DbType.Guid, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("frequency", request.Frequency, DbType.String, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("syncDate", DateTime.UtcNow, DbType.DateTime, ParameterDirection.Output));
                    parameters.Add(sqlDataAccess.CreateParameter("enableDebugInfo", component.helper.SolutionConfiguration.EnableDebugInfo, DbType.String, ParameterDirection.Input));
                    DbDataReader dbDataReader = sqlDataAccess.ExecuteReader(sqlDataAccess.CreateCommand("[Chart_EnergyConsumptionByMeter]", CommandType.StoredProcedure, null), parameters.ToArray());
                    result.Data = DataUtils.DataReaderToList<Response.EnergyConsumptionByMeter>(dbDataReader, null);
                    if (parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault() != null)
                    {
                        result.LastSyncDate = Convert.ToString(parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault().Value);
                    }
                }
                _logger.InfoLog(Constants.ACTION_EXIT, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
            }
            return result;
        }
        public Entity.BaseResponse<List<Response.EnergyConsumption>> GetEnergyUsage(Request.ChartRequest request)
        {
            Entity.BaseResponse<List<Response.EnergyConsumption>> result = new Entity.BaseResponse<List<Response.EnergyConsumption>>();
            List<Response.EnergyConsumption> energylst = new List<Response.EnergyConsumption>();
            try
            {
                _logger.InfoLog(Constants.ACTION_ENTRY, "Chart_EnergyConsumption.Get");
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<Response.EnergyConsumptionResponse> data = new List<Response.EnergyConsumptionResponse>();
                    List<DbParameter> parameters = sqlDataAccess.CreateParams(component.helper.SolutionConfiguration.CurrentUserId, component.helper.SolutionConfiguration.Version);
                    if (!request.CompanyGuid.Equals(Guid.Empty))
                    {
                        parameters.Add(sqlDataAccess.CreateParameter("companyguid", request.CompanyGuid, DbType.Guid, ParameterDirection.Input));
                    }
                    if (!request.EntityGuid.Equals(Guid.Empty))
                    {
                        parameters.Add(sqlDataAccess.CreateParameter("entityguid", request.EntityGuid, DbType.Guid, ParameterDirection.Input));
                    }
                    if (!request.DeviceGuid.Equals(Guid.Empty))
                    {
                        parameters.Add(sqlDataAccess.CreateParameter("guid", request.DeviceGuid, DbType.Guid, ParameterDirection.Input));
                    }
                    parameters.Add(sqlDataAccess.CreateParameter("syncDate", DateTime.UtcNow, DbType.DateTime, ParameterDirection.Output));
                    parameters.Add(sqlDataAccess.CreateParameter("enableDebugInfo", component.helper.SolutionConfiguration.EnableDebugInfo, DbType.String, ParameterDirection.Input));
                    DbDataReader dbDataReader = sqlDataAccess.ExecuteReader(sqlDataAccess.CreateCommand("[Chart_CurrentConsumption]", CommandType.StoredProcedure, null), parameters.ToArray());
                    data = DataUtils.DataReaderToList<Response.EnergyConsumptionResponse>(dbDataReader, null);
                    if (parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault() != null)
                    {
                        result.LastSyncDate = Convert.ToString(parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault().Value);
                    }
                    var resultGrp = from item in data
                                    group item by item.Month
                                    into egroup
                                    select egroup;
                    foreach (var group in resultGrp)
                    {
                        List<Response.EnergyConsumptionByMonth> lookupItems = new List<Response.EnergyConsumptionByMonth>();
                        foreach (var items in group)
                        {
                            lookupItems.Add(new Response.EnergyConsumptionByMonth { Year = items.Year, Value = items.Value });
                        }
                        energylst.Add(new Response.EnergyConsumption { Month = group.Key, EnergyValue = lookupItems });
                    }
                    result.Data = energylst;
                    result.IsSuccess = true;
                }
                _logger.InfoLog(Constants.ACTION_EXIT, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
            }
            return result;
        }
        public Entity.BaseResponse<Response.EnergyConsumptionFacilityCount> GetEnergyConsumptionByFacility(string request)
        {
            Entity.BaseResponse<Response.EnergyConsumptionFacilityCount> result = new Entity.BaseResponse<Response.EnergyConsumptionFacilityCount>();
            try
            {
                _logger.InfoLog(Constants.ACTION_ENTRY, "Chart_StatisticsByEntity.Get");
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<Response.EnergyConsumptionFacilityResponse> lstResult = new List<Response.EnergyConsumptionFacilityResponse>();
                    Response.EnergyConsumptionFacilityCount resObj = new Response.EnergyConsumptionFacilityCount();
                    List<DbParameter> parameters = sqlDataAccess.CreateParams(component.helper.SolutionConfiguration.CurrentUserId, component.helper.SolutionConfiguration.Version);
                    parameters.Add(sqlDataAccess.CreateParameter("companyGuid", component.helper.SolutionConfiguration.CompanyId, DbType.Guid, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("frequency", request, DbType.String, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("syncDate", DateTime.UtcNow, DbType.DateTime, ParameterDirection.Output));
                    parameters.Add(sqlDataAccess.CreateParameter("enableDebugInfo", component.helper.SolutionConfiguration.EnableDebugInfo, DbType.String, ParameterDirection.Input));
                    DbDataReader dbDataReader = sqlDataAccess.ExecuteReader(sqlDataAccess.CreateCommand("[Chart_EnergyConsumptionByFacility]", CommandType.StoredProcedure, null), parameters.ToArray());
                    lstResult = DataUtils.DataReaderToList<Response.EnergyConsumptionFacilityResponse>(dbDataReader, null);

                    resObj.EnergyConsumptionByFacility = lstResult;
                    resObj.TotalEnergy= lstResult.Sum(item => item.Value);
                    result.Data = resObj;

                    if (parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault() != null)
                    {
                        result.LastSyncDate = Convert.ToString(parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault().Value);
                    }
                }
                _logger.InfoLog(Constants.ACTION_EXIT, null, "", "", this.GetType().Name, MethodBase.GetCurrentMethod().Name);
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(ex, this.GetType().Name, MethodBase.GetCurrentMethod().Name);
            }
            return result;
        }
    }
}
