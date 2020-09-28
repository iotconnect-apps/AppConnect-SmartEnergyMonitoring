using iot.solution.model.Models;
using component.logger;
using iot.solution.model.Repository.Interface;
using System;
using System.Collections.Generic;
using Entity = iot.solution.entity;
using System.Reflection;
using iot.solution.data;
using System.Data.Common;
using System.Data;
using component.helper;
using System.Linq;
using LogHandler = component.services.loghandler;
using Response = iot.solution.entity.Response;

namespace iot.solution.model.Repository.Implementation
{
    public class DashboardRepository:GenericRepository<Device>,IDashboardRepository
    {
        private readonly LogHandler.Logger _logger;
        public DashboardRepository(IUnitOfWork unitOfWork, LogHandler.Logger logManager) : base(unitOfWork, logManager)
        {
            _logger = logManager;
            _uow = unitOfWork;
        }
        public Entity.BaseResponse<List<Entity.DashboardOverviewResponse>> GetStatistics()
        {
            Entity.BaseResponse<List<Entity.DashboardOverviewResponse>> result = new Entity.BaseResponse<List<Entity.DashboardOverviewResponse>>();
            try
            {
                _logger.InfoLog(Constants.ACTION_ENTRY, "GeneratorRepository.Get");
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<DbParameter> parameters = sqlDataAccess.CreateParams(SolutionConfiguration.CurrentUserId, SolutionConfiguration.Version);
                    parameters.Add(sqlDataAccess.CreateParameter("guid", SolutionConfiguration.CompanyId, DbType.Guid, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("syncDate", DateTime.UtcNow, DbType.DateTime, ParameterDirection.Output));
                    DbDataReader dbDataReader = sqlDataAccess.ExecuteReader(sqlDataAccess.CreateCommand("[CompanyStatistics_Get]", CommandType.StoredProcedure, null), parameters.ToArray());
                   
                    result.Data = DataUtils.DataReaderToList<Entity.DashboardOverviewResponse>(dbDataReader, null);
                    if (parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault() != null)
                    {
                        result.LastSyncDate = Convert.ToString(parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault().Value);
                    }
                }
                _logger.InfoLog(Constants.ACTION_EXIT, "GeneratorRepository.Get");
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(Constants.ACTION_EXCEPTION, ex);
            }
            return result;
        }


        public Entity.BaseResponse<List<Entity.EntityOverviewResponse>> GetFacilityOverview(Guid facilityId)
        {
            Entity.BaseResponse<List<Entity.EntityOverviewResponse>> result = new Entity.BaseResponse<List<Entity.EntityOverviewResponse>>();
            try
            {
                _logger.InfoLog(Constants.ACTION_ENTRY, "GeneratorRepository.Get");
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<DbParameter> parameters = sqlDataAccess.CreateParams(SolutionConfiguration.CurrentUserId, SolutionConfiguration.Version);
                    parameters.Add(sqlDataAccess.CreateParameter("guid", facilityId, DbType.Guid, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("syncDate", DateTime.UtcNow, DbType.DateTime, ParameterDirection.Output));
                    DbDataReader dbDataReader = sqlDataAccess.ExecuteReader(sqlDataAccess.CreateCommand("[EntityStatistics_Get]", CommandType.StoredProcedure, null), parameters.ToArray());

                    result.Data = DataUtils.DataReaderToList<Entity.EntityOverviewResponse>(dbDataReader, null);
                    if (parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault() != null)
                    {
                        result.LastSyncDate = Convert.ToString(parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault().Value);
                    }
                }
                _logger.InfoLog(Constants.ACTION_EXIT, "GeneratorRepository.Get");
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(Constants.ACTION_EXCEPTION, ex);
            }
            return result;
        }
        public Entity.BaseResponse<List<Response.DeviceDetailResponse>> GetDeviceDetail(Guid DeviceId)
        {
            Entity.BaseResponse<List<Response.DeviceDetailResponse>> result = new Entity.BaseResponse<List<Response.DeviceDetailResponse>>();
            try
            {
                _logger.InfoLog(Constants.ACTION_ENTRY, "GeneratorRepository.Get");
                using (var sqlDataAccess = new SqlDataAccess(ConnectionString))
                {
                    List<DbParameter> parameters = sqlDataAccess.CreateParams(SolutionConfiguration.CurrentUserId, SolutionConfiguration.Version);
                    parameters.Add(sqlDataAccess.CreateParameter("guid", DeviceId, DbType.Guid, ParameterDirection.Input));
                    parameters.Add(sqlDataAccess.CreateParameter("syncDate", DateTime.UtcNow, DbType.DateTime, ParameterDirection.Output));
                    DbDataReader dbDataReader = sqlDataAccess.ExecuteReader(sqlDataAccess.CreateCommand("[CompanyStatistics_Get]", CommandType.StoredProcedure, null), parameters.ToArray());

                    result.Data = DataUtils.DataReaderToList<Response.DeviceDetailResponse>(dbDataReader, null);
                    if (parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault() != null)
                    {
                        result.LastSyncDate = Convert.ToString(parameters.Where(p => p.ParameterName.Equals("syncDate")).FirstOrDefault().Value);
                    }
                }
                _logger.InfoLog(Constants.ACTION_EXIT, "GeneratorRepository.Get");
            }
            catch (Exception ex)
            {
                _logger.ErrorLog(Constants.ACTION_EXCEPTION, ex);
            }
            return result;
        }
    }
}
