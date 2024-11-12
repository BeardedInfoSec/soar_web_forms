
# SOAR Web Form Builder

This project is a form builder built with React and Node.js, designed to work with PostgreSQL as the backend database. The following instructions will help you set up the environment, configure the necessary components, and run the application.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (v14 or higher is recommended).
- **PostgreSQL**: Install PostgreSQL (v13 or higher is recommended).

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BeardedInfoSec/soar_web_forms
cd soar_web_forms
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Client Port

Set the client (React app) to use port **3000** by including the following in your `.env` or by directly setting it with the command:

```bash
set PORT=3000 & npm start
```

This will start the React application on port 3000, while the server (`server.js`) remains on port 5000.

### 4. Run `server.js` and `proxy.js`

These files will handle the backend server functionalities. Ensure they’re both running:

```bash
node server.js
node proxy.js
```

### 5. PostgreSQL Database Setup

Create a PostgreSQL database and tables for storing configuration and user data.

#### PostgreSQL Configurations

Replace `<YOUR_IP>` with your actual IP address:

```plaintext
PG_USER=postgres
PG_HOST=<YOUR_IP>
PG_DATABASE=soar_web_forms
PG_PASSWORD=soaring42
```

#### Creating the Database and Tables

1. Log in to PostgreSQL:
   ```bash
   psql -U postgres
   ```
2. Create the database:
   ```sql
   CREATE DATABASE soar_web_forms;
   ```

3. Connect to the database:
   ```sql
   \c soar_web_forms;
   ```

4. Create the tables `configuration`, `forms`, and `users` using the following SQL commands:

```sql
-- Configuration Table
CREATE TABLE configuration (
    id SERIAL PRIMARY KEY,
    ph_auth_token VARCHAR,
    server VARCHAR,
    ssl_verification BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forms Table
CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    tags TEXT,
    elements JSONB,
    xml_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    tags TEXT,
    elements JSONB,
    xml_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Add Default User Accounts

Populate the `users` table with the following default user accounts:

```sql
INSERT INTO users (name, label) VALUES
('admin_user', 'soaring42'),
('dev_user', 'soardev'),
('read_user', 'soaruser');
```

### Running the Application

Once the setup is complete, start the application:

```bash
set PORT=3000 & npm start
```

Visit `http://localhost:3000` in your browser to access the application.

### Additional Notes

- **Server Configuration**: Ensure that `proxy.js` and `server.js` are properly configured to handle routing and API requests.
- **Database Connection**: Adjust the `PG_HOST` in your environment file to match your server’s IP.

This setup should provide a working environment for the SOAR Web Form Builder project. 
