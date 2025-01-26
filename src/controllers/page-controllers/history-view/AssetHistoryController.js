const moment = require('moment');
const { DOWN_STATUSES } = require("../../../constants/constants");
const Event = require("../../../models/Event");

exports.getAssetsWithEvents = async (req, res) => {
  const searchQuery = req.query.searchQuery || "";
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const sortParam = req.query.sort || "createdAt:asc";
  const [sortField, sortDir] = sortParam.split(":");
  const sortDirection = sortDir === "desc" ? -1 : 1;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  const queryConditions = [
    { createdAt: { $gte: startDate, $lte: endDate } },
    { status: { $in: DOWN_STATUSES } } // Why should the query only have down statuses?
  ];

  if (searchQuery) {
    queryConditions.push({
      $or: [
        { unitId: { $regex: new RegExp(searchQuery, "i") } },
        { workOrderNumber: { $regex: new RegExp(searchQuery, "i") } },
        { purchaseOrderNumber: { $regex: new RegExp(searchQuery, "i") } },
      ]
    });
  }

  try {
    const totalCount = await Event.countDocuments({ $and: queryConditions });

    const result = await Event.aggregate([
      { $match: { $and: queryConditions } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "assets",
          localField: "unitId",
          foreignField: "unitId",
          as: "assetDetails",
        },
      },
      {
        $unwind: {
          path: "$assetDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          durationInHours: {
            $divide: [
              {
                $subtract: [
                  { $ifNull: ["$actualOutDate", new Date()] },
                  "$downDate"
                ]
              },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $sort: { [sortField === "modelCode" ? "assetDetails.modelCode" : sortField]: sortDirection }
      },
      {
        $project: {
          _id: 1,
          unitId: 1,
          toBePlanned: 1,
          toBeTowed: 1,
          washed: 1,
          releasedToOps: 1,
          lastUpdatedBy: 1,
          isManuallyAdded: 1,
          isStatusChangeManual: 1,
          assignedTechnicians: 1,
          location: 1,
          bay: 1,
          temp_assignedTechnicians: 1,
          conflict: 1,
          hoursInStatus: 1,
          workOrderNumber: 1,
          purchaseOrderNumber: 1,
          purchaseOrderExpectedDate: 1,
          secondaryStatus: 1,
          downDate: 1,
          scheduleOutDate: 1,
          revisedOutDate: 1,
          actualOutDate: 1,
          equipmentType: "$assetDetails.equipmentType",
          modelCode: "$assetDetails.modelCode",
          durationInHours: 1,
        },
      },
    ]);
    

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      searchResult: result,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        pageSize: limit,
        totalCount: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching assets with events: ", error);
    res.status(500).send("An error occurred");
  }
};