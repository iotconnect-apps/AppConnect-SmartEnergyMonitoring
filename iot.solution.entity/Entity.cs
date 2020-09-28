using iot.solution.entity.Response;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace iot.solution.entity
{
    //Facility
    public class Entity
    {
        public Guid Guid { get; set; }
       // public Guid CompanyGuid { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string Address2 { get; set; }
        public Guid? ParentEntityGuid { get; set; }
        public string City { get; set; }
        public string Zipcode { get; set; }
        public Guid? StateGuid { get; set; }
        public Guid? CountryGuid { get; set; }
        public string Image { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        //public int TotalUsers{ get; set; }
        public List<EntityWiseDeviceResponse> Devices { get; set; }
        public bool? IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? CreatedDate { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public Guid? UpdatedBy { get; set; }
    }
    public class EntityDetail : Entity
    {
        public int TotalSubEntities { get; set; }
        public int TotalDevices { get; set; }
        public string AvgTemperature { get; set; }
        public string AvgHumidity { get; set; }
        public string TotalAlerts { get; set; }
    }

    public class ZoneDetail : Entity
    {
        public string ParentEntityName { get; set; }
        public int TotalDevices { get; set; }
    }
    public class EntityWithCounts : Entity
    {
        public int TotalDevices { get; set; }
        public int TotalOnConnectedDevices { get; set; }
        public int TotalOffDevices { get; set; }
        public int TotalDisconnectedDevices { get; set; }
        public int TotalEneryGenerated { get; set; }
        public int TotalFuelUsed { get; set; }
       
    }

    public class TabletEntityDetail 
    {
        public Guid Guid { get; set; }
        public string Name { get; set; }
        public int TotalSubEntities { get; set; }
        public int TotalDevices { get; set; }
        public string TotalAlerts { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
    }

    public class TabletZoneDetail
    {
        public Guid Guid { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string ParentEntityName { get; set; }
        public int TotalDevices { get; set; }
    }
}
