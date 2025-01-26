const EventEmitter = require("events");
const chokidar = require("chokidar");

const AssetManager = require("./AssetManager");
const FileEventProcessor = require("./FileEventProcessor");

class FileWatchService extends EventEmitter {
  constructor(fleetStatusDir) {
    super();
    this.fleetStatusDir = fleetStatusDir;
  }

  startWatching() {
    const watcher = chokidar.watch(this.fleetStatusDir, {
      persistent: true,
			awaitWriteFinish: {
				stabilityThreshold: 2000,
				pollInterval: 100
			},
    });

		const eventType = "change"
    watcher.on(eventType, (path) => {
			this.handleFileEvent(eventType, "fleet-status-data.json");
		});
  }

  async handleFileEvent(eventType, filename) {
    const assetManager = new AssetManager();
    const fileEventProcessor = new FileEventProcessor(
      this.fleetStatusDir,
      assetManager
    );

    fileEventProcessor.on("refreshTrigger", (data) => {
      this.emit("FileEventProcessor", data);
    });

    await fileEventProcessor.processFileEvent(eventType, filename);
  }
}

module.exports = FileWatchService;
