namespace iot.solution.entity.Response
{
    public class DeviceDetailResponse
    {
        public string  MeterId { get; set; }
        public string AssignedTo { get; set; }
        public string CurrentReading { get; set; }
        public string MinVolt { get; set; }
        public string MaxVolt { get; set; }
        public string Status { get; set; }
    }
}
