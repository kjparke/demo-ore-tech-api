# Ore-Tech API

This is the backend implementation of Ore-Tech APP. This application was built using Node.js and express with connections to the database layer which is implemented using MongoDB.

## Prerequisite

- Node.js
- Express
- MongoDB Community (installed locally)

## Installation and Setup

1. Clone repository 
2. Navigate to the local repo and install Node.js dependencies - Run the command 'npm install'
3. Install and run MongoDB community on your local machine. Start a connection to the DB enviroment by connecting to mongodb://localhost:27017
4. Create a .env file in the root directory and add the following variables: 
    - MONGO_URL with url to locally running mongoDB database, i.e. mongodb://localhost:27017/ore-tech-db 
    - SERVER_PORT variable for server. 
    - JWT_SECRET secret string for authentication. Example: ="Some super secret string"
    - WEB_SOCKET_SERVER_PORT variable for webocket server with appropriate port number, i.e. 3002
5. Start server by running the command 'node index.js'
    - The express server will run on 3001, and a websocket server runs on 3002.
6. Navigate to ./public/fleet-status-data.json and click the file. This will run the fleetwatcher service that will poplate the Mongodb database. 


## Create Test User to for Authentication
- POST a test user to the endpoint http://localhost:3001/api/auth/register 
- Example: 
    {
        "firstName": "John",
        "lastName": "Doe", 
        "email": "doe@test.com",
        "password": "Password1", 
        "accessLevel": 1 
    }
- Ensure that the passwords used in testing has the following properties: 
    - Minimum 8 characters. 
    - at least 1 uppercase letter.
    - at least 1 lowercase letter. 
    - at least 1 number.

- Start ore-tech-app and login using the crentials posted the the /register endpoint. 


## Notes
- On Windows environments, you may need to use `127.0.0.1` in place of `localhost`

