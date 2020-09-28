namespace iot.solution.entity
{
    
    public class DashboardOverviewResponse
    {
        public int TotalEntities { get; set; }
        public int TotalSubEntities { get; set; }
        public int TotalConnected { get; set; }
        public int TotalDisconnected { get; set; }
        public int TotalEnergy { get; set; }
        public int TotalAlerts { get; set; }
        public int TotalDevices { get; set; }
        public int ActiveUserCount { get; set; }
        public int InactiveUserCount { get; set; }
        public int TotalUserCount { get; set; }
    }

    public class EntityOverviewResponse : DashboardOverviewResponse
    {
        public string MinDeviceName { get; set; }
        public int MinDeviceEnergyCount { get; set; }
        public string MaxDeviceName { get; set; }
        public int MaxDeviceEnergyCount { get; set; }
    }
}
