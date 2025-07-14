# SOAR Web Form Builder

This project is a form builder built with React and Node.js, designed to use PostgreSQL as the backend database. Follow the instructions below to set up your environment and run the application.

## Repository

GitHub Repository: [SOAR Web Form Builder](https://github.com/BeardedInfoSec/soar_web_forms)

## Prerequisites

- **Node.js** installed (v14 or higher recommended).
- **PostgreSQL** installed and running (v13 or higher recommended).

## Setup Instructions

### 1. Configure PostgreSQL Database

- Install and run PostgreSQL.
- Create the `soar_web_forms` database by running these commands in your terminal:

```bash
psql -U postgres
```
Then in the PostgreSQL prompt:
```bash
CREATE DATABASE soar_web_forms;
\q
```
Create a PostgreSQL user with appropriate permissions or use your existing one.

```bash
CREATE USER your_pg_username WITH PASSWORD 'your_pg_password';
```

Grant all privileges on the database to the new user:

```bash
GRANT ALL PRIVILEGES ON DATABASE soar_web_forms TO your_pg_username;
```
Exit the PostgreSQL prompt:
```bash
\q
```

### 2. Configure Environment Variables

Create a `.env` file in the project root to point to your PostgreSQL database. Example `.env` file:

```env
##PostgreSQL DB Info
PG_USER=your_pg_username
PG_HOST=your_pg_ip ##127.0.0.1 unless PostgreSQL is running on a different machine
PG_DATABASE=soar_web_forms
PG_PASSWORD=your_pg_password
PG_PORT=5432

JWT_SECRET=your_jwt_secret_here ##This can be whatever you want
## Server.js port
PORT=5000

##Splunk SOAR IP
## Proxy.js ports
PROXY_TARGET=https://192.168.128.31 ##Set this to your Splunk SOAR Server
PROXY_PORT=3001 ## This might need to be changed depending on port conflicts
```
Replace all values with your actual PostgreSQL credentials and a strong JWT secret.

### 3. Create Database Tables and Seed Default Users
Run the provided `create_db.js` script to automatically create all necessary tables (configuration, forms, and users) and insert default user accounts with properly hashed passwords.

```bash
node create_db.js
```

### 4. Start Backend and Frontend Servers
Start the backend servers:
```bash
node server.js
node proxy.js
```

### 5. Start the React Frontend
Set the React app port to 3000 and start it:
```bash
set PORT=3000 & npm start
```

### 6. Access the Application
Open your browser and navigate to:
```bash
http://localhost:3002
```
