class EventState {
  constructor(jsonAsset, dbAsset) {
    this.jsonAsset = jsonAsset;
    this.dbAsset = dbAsset;
  }
}

class DownState {
  constructor(jsonAsset, dbAsset) {
    super(jsonAsset, dbAsset);
		this.isExternalDBChangesObserved
  }

	async run() {

	}

	async update() {
		// if (
		// 	isExternalDBChangesObserved &&
		// 	(statusChanged || secondaryStatusChanged)
		// ) {
		// 	if (
		// 		this.assetManager.isAssetOperational(jsonAsset.status) &&
		// 		this.assetManager.isAssetDown(dbAsset.status)
		// 	) {
		// 		logText +=
		// 			"Asset changed to operational status in file. Active event removed from asset.";
		// 		if (
		// 			dbAsset.activeEvent.isManuallyAdded &&
		// 			this.assetManager.isAssetDown(jsonAsset.status)
		// 		) {
		// 			/* Ignore changes in file for manually added assets. */
		// 			continue;
		// 		} else {
		// 			/* Remove active event from asset and creates new operational event record. */
		// 			await this.assetManager.updateToOperational(
		// 				jsonAsset,
		// 				dbAsset,
		// 				currentActiveEventId,
		// 				logText
		// 			);
		// 		}
		// 	} else if (
		// 		this.assetManager.isAssetDown(jsonAsset.status) &&
		// 		this.assetManager.isAssetDown(dbAsset.status)
		// 	) {
		// 		logText +=
		// 			"Asset in down state has been updated in the fleet status file.";
		// 		await this.assetManager.updateActiveEvent(
		// 			jsonAsset,
		// 			dbAsset,
		// 			currentActiveEventId,
		// 			logText
		// 		);
		// 	} else if (jsonAsset.status.toLowerCase() === "exc" && this.assetManager.isAssetDown(dbAsset.status)) {
		// 		/* Update to a new EXC event */
		// 		logText +=
		// 			"Asset in down state has been updated in the fleet status file.";
		// 		await this.assetManager.updateToEXC(jsonAsset, dbAsset, logText);
		// 		continue;
		// 	}
		// } else if (dbAsset.activeEvent === null) {
		// 	const operationalEvent = await eventController.findLatestOperational(
		// 		jsonAsset.unitId
		// 	);
		// 	const opStatusChanged =
		// 		operationalEvent && operationalEvent.status !== jsonAsset.status;
		// 	const opSecondaryStatusChanged =
		// 		operationalEvent &&
		// 		operationalEvent.secondaryStatus !== jsonAsset.secondaryStatus;
		// 	const isManualRelease =
		// 		operationalEvent &&
		// 		operationalEvent.status === constants.OPERATIONAL_MANUAL_RELEASE;

		// 	/* OPERATIONAL MANUAL RELEASE */
		// 	if (
		// 		isManualRelease &&
		// 		this.assetManager.isAssetDown(jsonAsset.status)
		// 	) {
		// 		if (
		// 			isManualRelease &&
		// 			this.hasTwentyMinutesPassed(operationalEvent.createdAt)
		// 		) {
		// 			console.log({ "last operational event": operationalEvent });
		// 			console.log(
		// 				this.hasTwentyMinutesPassed(operationalEvent.createdAt)
		// 			);
		// 			logText += "Operational asset updated in the status file.";
		// 			await this.assetManager.updateToDown(jsonAsset, dbAsset, logText);
		// 		}
		// 	}
		// }
	}

	async updateToOperational() {

	}

	async updateManualRelease() {

	}

	async updateToEXC() {

	}
}
