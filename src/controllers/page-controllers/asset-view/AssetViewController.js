const { EXPORT_ASSET_TABLE_FIELDS } = require("../../../constants/constants");
const Asset = require("../../../models/Asset");
const Event = require("../../../models/Event");
const Note = require("../../../models/Note");
const ShiftRoster = require("../../../models/ShiftRoster");
const { convertToCSV } = require("../../export-service/exportToCSV");
const { calculateTimeInStatus } = require("../../utils/CalculateTimeInStatus");
const { determineCurrentShift } = require("../../utils/DetermineCurrentShift");
const { readTechnicianNamesForEventShift } = require("../../ShiftRosterController");

exports.readDownAssetPages = async ({
  page = 1,
  pageSize = 50,
  assetQueryString,
  eventQueryString,
  sortParams = [],
  hasTechnicianFilter,
}) => {
  const skip = (page - 1) * pageSize;

  const sortParamsArray = Object.values(sortParams);  
  const sortOptions = this.getSortingParams(sortParamsArray);

  try {
    const currentShift = determineCurrentShift();
    // Get the total count of assets matching the query
    let totalRecords = await Asset.countDocuments(assetQueryString);

    let downAssets = await Asset.find(assetQueryString)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate({
        path: "activeEvent",
        match: eventQueryString
      }).lean();

    let assetsWithNotes = [];

    for (let asset of downAssets) {
      if (asset.activeEvent) {
        const latestNote = await Note.findOne({
          eventId: asset.activeEvent._id,
        }).sort({ createdAt: -1 });
      
        // Ensure technicianNames is an array before assigning to the activeEvent
        const technicianNames = await readTechnicianNamesForEventShift(
          asset.activeEvent,
          currentShift.shiftType,
          currentShift.date
        ) || []; 
        
        asset.activeEvent.assignedTechnicians = technicianNames;

        assetsWithNotes.push({
          asset,
          latestNote,
        });
      }
    }

    if (hasTechnicianFilter) {
      assetsWithNotes = assetsWithNotes.filter(({ asset }) => 
        asset.activeEvent?.assignedTechnicians?.length > 0
      );
      totalRecords = assetsWithNotes.length
    }

    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      assets: assetsWithNotes,
      currentPage: page,
      totalPages,
      pageSize,
      totalRecords,
    };
  } catch (error) {
    throw new Error(`Error reading down asset pages: ${error.message}`);
  }
};

exports.exportDownAssetCSV = async ({
  page = 1,
  pageSize = 50,
  assetQueryString,
  eventQueryString,
  sortParams = [],
  hasTechnicianFilter,
}) => {
  const skip = (page - 1) * pageSize;

  const sortParamsArray = Object.values(sortParams); 
  const sortOptions = this.getSortingParams(sortParamsArray);

  try {
    const currentShift = determineCurrentShift();
    let downAssets = await Asset.find(assetQueryString)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate({
        path: "activeEvent",
        match: eventQueryString,
      }).lean();

    let assetsWithAllNotes = [];

    for (let asset of downAssets) {
      let locationWithBay = asset.location;
      if (asset.activeEvent && asset.activeEvent.bay) {
        locationWithBay = `${asset.location} - ${asset.activeEvent.bay}`;
      }

      if (asset.activeEvent) {
        const allNotes = await getAllNotesForEvent(asset.activeEvent._id);
        const technicianNames = await readTechnicianNamesForEventShift(
          asset.activeEvent,
          currentShift.shiftType,
          currentShift.date
        ) || [];
        
        asset.activeEvent.assignedTechnicians = technicianNames.map((technician) => technician).join(", ");

        assetsWithAllNotes.push({
        asset: {
            ...asset,
            location: locationWithBay,  
          },
          notes: allNotes.map((note) => note.text).join('\n\n'),
        });
      }
    }

    if (hasTechnicianFilter) {
      assetsWithAllNotes = assetsWithAllNotes.filter(({ asset }) => 
        asset.activeEvent?.assignedTechnicians?.length > 0
      );
    }

    const csvData = convertToCSV(assetsWithAllNotes, EXPORT_ASSET_TABLE_FIELDS);
    return csvData;
  } catch (error) {
    throw new Error(`Error exporting down asset CSV: ${error.message}`);
  }
};

exports.getSortingParams = (sortParams) => {
  return Array.isArray(sortParams)
    ? sortParams.reduce((acc, sortParam) => {
        acc[sortParam.column] = sortParam.direction === "asc" ? 1 : -1;
        return acc;
      }, {})
    : {};
};

const getAllNotesForEvent = async (eventId) => {
  return await Note.find({ eventId }).sort({ createdAt: -1 });
};