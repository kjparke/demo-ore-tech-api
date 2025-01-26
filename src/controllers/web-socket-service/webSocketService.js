const WebSocket = require('ws');

class WebSocketService {
    constructor(server){
    	this.wss = new WebSocket.Server({ server });
      	this.wss.on('connection', this.onConnection.bind(this));
    }

    onConnection(ws) {
      	ws.on('message', this.onMessage.bind(this));
    }
    
    onMessage(message) {
        //TODO: Handle incoming message
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
          	if (client.readyState === WebSocket.OPEN) {
            	client.send(data);
          	}
        });
    }
}

module.exports = WebSocketService;