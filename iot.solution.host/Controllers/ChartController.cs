using iot.solution.entity.Structs.Routes;
using iot.solution.service.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Net;
using Entity = iot.solution.entity;
using Response = iot.solution.entity.Response;
using Request = iot.solution.entity.Request;

namespace host.iot.solution.Controllers
{
    [Route(ChartRoute.Route.Global)]
    [ApiController]
    public class ChartController : BaseController
    {
        private readonly IChartService _chartService;
        public ChartController(IChartService chartService)
        {
            _chartService = chartService;
        }
        [HttpPost]
        [Route(ChartRoute.Route.GetEnergyConsumptionByMeter, Name = ChartRoute.Name.GetEnergyConsumptionByMeter)]
        public Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>> EnergyConsumptionByEntity(Request.ChartRequest request)
        {
            Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>> response = new Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>>(true);
            try
            {
                response = _chartService.GetEnergyConsumptionByMeter(request);
                response.Message = "Data Loaded Successfully !!";
                response.IsSuccess = true;
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>>(false, ex.Message);
            }
            return response;
        }

        [HttpPost]
        [Route(ChartRoute.Route.EnergyConsumption, Name = ChartRoute.Name.EnergyConsumption)]
        public Entity.BaseResponse<List<Response.EnergyConsumption>> EnergyConsumption(Request.ChartRequest request)
        {
            Entity.BaseResponse<List<Response.EnergyConsumption>> response = new Entity.BaseResponse<List<Response.EnergyConsumption>>(true);
            try
            {
                response = _chartService.GetEnergyUsage(request);
                response.Message = "Data Loaded Successfully !!";
                response.IsSuccess = true;
            }
            catch (Exception ex) {
                base.LogException(ex);
            }
            return response;
        }

        [HttpGet]
        [Route(ChartRoute.Route.EnergyConsumptionByFacility, Name = ChartRoute.Name.EnergyConsumptionByFacility)]
        public Entity.BaseResponse<Response.EnergyConsumptionFacilityCount> EnergyConsumptionByFacility(string frequency)
        {
            Entity.BaseResponse<Response.EnergyConsumptionFacilityCount> response = new Entity.BaseResponse<Response.EnergyConsumptionFacilityCount>(true);
            try
            {
                response = _chartService.GetEnergyConsumptionByFacility(frequency);
                response.Message = "Data Loaded Successfully !!";
                response.IsSuccess = true;
            }
            catch (Exception ex) {
                base.LogException(ex);
            }
            return response;
        }
    }
}