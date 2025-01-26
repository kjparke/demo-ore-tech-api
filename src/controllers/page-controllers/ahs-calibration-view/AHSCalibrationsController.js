const AHSAsset = require("../../../models/AHSAsset");
const AHSCalibration = require("../../../models/AHSCalibration");

exports.createAHSCalibrationRecord = async (ahsRecord) => {
  try {
    const newAHSRecord = new AHSCalibration(ahsRecord);
    const savedAHSRecord = await newAHSRecord.save();

    const populatedRecord = await AHSCalibration.findById(savedAHSRecord._id)
      .populate('createdBy')
      .populate('lastUpdatedBy')

    return(populatedRecord);
  } catch (error) {
    throw error;
  }
};

exports.readAHSCalibrations = async () => {
  try {
    const ahsCalibrationRecords = await AHSCalibration.find({})
      .populate('createdBy')
      .populate('lastUpdatedBy')
      .sort({ createdAt: -1 })
    
    return ahsCalibrationRecords;
  } catch (error) {
    throw error;
  }
};

exports.readArchivedAHSCalibrations = async (page, pageSize, skip) => {
  try {
    const query = { isArchived: true };
    const totalRecords = await AHSCalibration.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / pageSize);

    const archivedRecords = await AHSCalibration.find(query)
      .populate('createdBy')
      .populate('lastUpdatedBy')
      .populate('completedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return{
      records: archivedRecords,
      currentPage: page,
      totalPages,
      totalRecords
    };
  } catch (error) {
    throw error
  }
};

exports.ahsTrucksWithRecordsPipeline = async () => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "assets",
          localField: "unitId",
          foreignField: "unitId",
          as: "assetDetails"
        }
      },
      {
        $unwind: {
          path: "$assetDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "ahscalibrations",
          localField: "unitId",
          foreignField: "unitId",
          pipeline: [
            { $match: { isArchived: false } },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "lastUpdatedBy",
                foreignField: "_id",
                as: "lastUpdatedBy"
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "completedBy",
                foreignField: "_id",
                as: "completedBy"
              }
            },
            {
              $addFields: {
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
                lastUpdatedBy: { $arrayElemAt: ["$lastUpdatedBy", 0] },
                completedBy: {$arrayElemAt: ["$completedBy", 0]}
              }
            }
          ],
          as: "record"
        }
      },
      {
        $addFields: {
          record: {
            $arrayElemAt: ["$record", 0]
          }
        }
      },
      {
        $addFields: {
          location: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$assetDetails.truckType", "AHS"] },
                  { $eq: ["$assetDetails.operatingType", "Autonomous"] }
                ]
              },
              then: "AOZ",
              else: "Conv"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          unitId: 1,
          status: "$assetDetails.status",
          minestarVersion: 1,
          swingable: 1,
          location: 1,
          record: 1,
        }
      }
    ];

    const results = await AHSAsset.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error("Error in aggregation pipeline:", error);
    throw error;
  }
};


exports.updateAHSCalibrations = async (data) => {
  try {
    const updatedAHSCalibrationRecord = await AHSCalibration.findOneAndUpdate(
			{ _id: data._id },
      { $set: data },
			{ new: true }
		);
    return updatedAHSCalibrationRecord;
  } catch (error) {
    throw error;
  }
};

exports.deleteAHSCalibrationRecord = async (id) => {
  const filter = { _id: id };
  try {
    const deletedRecord = await AHSCalibration.findOneAndDelete(filter);
    return deletedRecord;
  } catch (error) {
    throw error;
  }
};
