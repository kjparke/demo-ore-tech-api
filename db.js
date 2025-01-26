const mongoose = require('mongoose');

class Database {
    constructor() {
        if (!Database.instance) {
            this.client = null;
            Database.instance = this;
        }
        return Database.instance;
    }

    async connect(connectionString) {
        if (!this.client) {
            this.client = await mongoose.connect(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }
      
        try {
            console.log(`Successfully connected to database: ${process.env.MONGO_URL}`);
        } catch (err) {
            console.log(`Error: ${err.message}`);
            throw err;
        }
    }
    
    getClient() {
        return this.client;
    }
};

module.exports = Database;