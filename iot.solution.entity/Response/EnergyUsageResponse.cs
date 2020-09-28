using System;
using System.Collections.Generic;

namespace iot.solution.entity.Response
{
    public class EnergyConsumptionFacilityResponse
    {
        public string Name { get; set; }
        public int Value { get; set; }
    }

    public class EnergyConsumptionFacilityCount
    {
        public List<EnergyConsumptionFacilityResponse> EnergyConsumptionByFacility { get; set; }
        public double TotalEnergy { get; set; }
    }

    public class EnergyConsumptionResponse
    {
        public string Month { get; set; }
        public string Value { get; set; }
        public int Year { get; set; }
    }

    public class EnergyConsumptionByMonth
    {
        public string Value { get; set; }
        public int Year { get; set; }
    }
    public class EnergyConsumption
    {
        public string Month { get; set; }
        public List<EnergyConsumptionByMonth> EnergyValue { get; set; }
    }
    public class EnergyConsumptionByMeter
    {
        public string UniqueId { get; set; }
        public string Value { get; set; }
       
    }
    public class ConfgurationResponse
    {
        public string cpId { get; set; }
        public string host { get; set; }
        public int isSecure { get; set; }
        public string password { get; set; }
        public int port { get; set; }
        public string url { get; set; }
        public string user { get; set; }
        public string vhost { get; set; }
    }
}
