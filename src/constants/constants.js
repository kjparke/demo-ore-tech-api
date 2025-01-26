/* FILE WATCHER */
exports.FS_CHANGE = "change";
exports.FS_RENAME = "rename";
exports.LOG = "FLEET STATUS FILE UPDATED AT: ";

/* Statuses */
exports.OPERATIONAL = "OPERATIONAL";
exports.OPERATIONAL_MANUAL_RELEASE = "OPERATIONAL-MANUAL-RELEASE";
exports.OPERATIONAL_OOS = "OPERATIONAL-OoS";
exports.NOH = "NOH";
exports.DELAY = "DELAY";
exports.STANDBY = "STANDBY";
exports.PENDING = "pending";
exports.DOWN_UNSCHEDULED = "down_unscheduled";
exports.DOWN_SCHEDULED = "down_scheduled";
exports.DOWN_WAITING = "down_waiting";

exports.OPERATIONAL_STATUSES = [
  this.OPERATIONAL,
  this.OPERATIONAL_MANUAL_RELEASE,
  this.OPERATIONAL_OOS,
  this.NOH,
  this.DELAY,
  this.STANDBY,
];

exports.DOWN_STATUSES = [
  this.DOWN_UNSCHEDULED,
  this.DOWN_SCHEDULED,
  this.DOWN_WAITING,
  this.PENDING,
];

/* CSV Export Columns */
exports.EXPORT_ASSET_TABLE_FIELDS = [
  { label: "Unit ID", value: "asset.unitId" },
  { label: "Location", value: "asset.location" },
  { label: "Model Code", value: "asset.modelCode" },
  { label: "Status", value: "asset.status" },
  { label: "Secondary Status", value: "asset.secondaryStatus" },
  { label: "To Be Planned", value: "asset.activeEvent.toBePlanned" },
  { label: "To Be Towed", value: "asset.activeEvent.toBeTowed" },
  { label: "Washed", value: "asset.activeEvent.washed" },
  { label: "To Be Scheduled", value: "asset.activeEvent.toBeScheduled" },
  { label: "Ready To Break In", value: "asset.activeEvent.readyToBreakIn" },
  { label: "Work Order Number", value: "asset.activeEvent.workOrderNumber" },
  {
    label: "Purchase Order Number",
    value: "asset.activeEvent.purchaseOrderNumber",
  },
  {
    label: "Assigned Technicians",
    value: "asset.activeEvent.assignedTechnicians",
  },
  { label: "Notes", value: "notes" },
];

exports.TRUCK_SHOP_REPORT_FIELDS = [
  { label: "Unit ID", value: "event.unitId" },
  { label: "Last Location", value: "asset.location" },
  { label: "Down Date", value: "asset.downDate" },
  { label: "Actual Out Date", value: "asset.actualOutDate" },
]

exports.EXCLUDED_ASSETS = [
  "ROC2",
  "ROC1",
	"6212B",
	"5183",
	"5201",
	"6213",
	"7414",
	"5302",
	"5196",
	"6211_O",
	"5195",
]

exports.validHaulTrucks = [
  "cat793c",
  "cat793c cmd",
  "cat793d", 
  "cat793d cmd",
  "cat793f", 
  "cat793f cmd", 
  "cat793ng", 
  "cat793ng cmd",
]