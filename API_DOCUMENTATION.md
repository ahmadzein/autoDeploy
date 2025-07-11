# AutoDeploy API Documentation

## Overview

The AutoDeploy API provides a RESTful interface for managing deployment projects and executing deployments. It runs as an Express.js server with CORS support and real-time streaming capabilities.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. Future versions will support token-based authentication.

## Content Type

All requests and responses use JSON format:
```
Content-Type: application/json
```

## API Endpoints

### Health Check

#### Check API Status
```http
GET /api/health
```

**Response**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

### Projects

#### List All Projects
```http
GET /api/projects
```

**Response**
```json
[
  {
    "name": "my-project",
    "localPath": "/home/user/projects/my-project",
    "ssh": {
      "host": "server.example.com",
      "username": "deploy",
      "port": 22
    },
    "remotePath": "/var/www/my-project",
    "localSteps": [
      {
        "name": "Build Application",
        "command": "npm run build",
        "workingDir": ".",
        "continueOnError": false
      }
    ],
    "deploymentSteps": [
      {
        "name": "Install Dependencies",
        "command": "npm install",
        "workingDir": ".",
        "continueOnError": false
      }
    ],
    "lastDeployment": "2024-01-10T10:30:00Z",
    "deploymentCount": 15,
    "lastDeploymentStatus": "success"
  }
]
```

#### Get Single Project
```http
GET /api/projects/:name
```

**Parameters**
- `name` (string): Project name

**Response**
```json
{
  "name": "my-project",
  "localPath": "/home/user/projects/my-project",
  "ssh": {
    "host": "server.example.com",
    "username": "deploy",
    "port": 22
  },
  "remotePath": "/var/www/my-project",
  "localSteps": [...],
  "deploymentSteps": [...],
  "deploymentHistory": [...],
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-10T15:30:00Z"
}
```

**Error Response** (404)
```json
{
  "error": "Project not found"
}
```

#### Create Project
```http
POST /api/projects
```

**Request Body**
```json
{
  "name": "new-project",
  "localPath": "/home/user/projects/new-project",
  "ssh": {
    "host": "server.example.com",
    "username": "deploy",
    "password": "secret",
    "port": 22
  },
  "remotePath": "/var/www/new-project",
  "localSteps": [
    {
      "name": "Run Tests",
      "command": "npm test",
      "workingDir": ".",
      "continueOnError": false
    }
  ],
  "deploymentSteps": [
    {
      "name": "Install Dependencies",
      "command": "npm install",
      "workingDir": ".",
      "continueOnError": false
    }
  ]
}
```

**Response** (201)
```json
{
  "success": true,
  "project": {
    "name": "new-project",
    ...
  }
}
```

**Error Response** (400)
```json
{
  "error": "SSH connection failed",
  "message": "Connection timeout"
}
```

#### Update Project
```http
PUT /api/projects/:name
```

**Parameters**
- `name` (string): Project name

**Request Body**
```json
{
  "localPath": "/new/path/to/project",
  "localSteps": [...],
  "deploymentSteps": [...]
}
```

**Note**: The project configuration is now stored in separate files:
- `config.json` - Core settings and SSH credentials
- `local-steps.json` - Steps that run locally
- `remote-steps.json` - Steps that run on the server
- `history.json` - Deployment history
- `stats.json` - Deployment statistics

**Response**
```json
{
  "success": true
}
```

#### Delete Project
```http
DELETE /api/projects/:name
```

**Parameters**
- `name` (string): Project name

**Response**
```json
{
  "success": true
}
```

---

### Deployments

#### Start Deployment (SSE)
```http
GET /api/deployments/:name
```

**Parameters**
- `name` (string): Project name

**Headers**
```
Accept: text/event-stream
```

**Event Stream Format**
```
data: {"type":"start","message":"Deploying my-project..."}

data: {"type":"progress","message":"Running local steps..."}

data: {"type":"step","message":"Running: Build Application","isLocal":true}

data: {"type":"step-complete","message":"Build completed","step":"Build Application","duration":5000}

data: {"type":"progress","message":"Committing and pushing local changes..."}

data: {"type":"step","message":"Running: Install Dependencies"}

data: {"type":"step-complete","message":"npm install completed","step":"Install Dependencies","duration":15000}

data: {"type":"complete","message":"Deployment completed successfully!","totalDuration":45000}

event: close
data: {}
```

**Event Types**
- `start`: Deployment initiated
- `progress`: General progress update
- `step`: Starting a deployment step (includes `isLocal` flag)
- `step-complete`: Step finished successfully (includes `duration` in ms)
- `step-error`: Step failed (includes error details)
- `error`: General error
- `complete`: Deployment finished successfully (includes `totalDuration`)
- `stopped`: Deployment was manually stopped
- `close`: Stream closing

#### Get Deployment History
```http
GET /api/projects/:name/deployments
```

**Parameters**
- `name` (string): Project name

**Query Parameters**
- `limit` (number): Number of deployments to return (default: 10)

**Response**
```json
[
  {
    "id": "1704883800000",
    "timestamp": "2024-01-10T10:30:00Z",
    "success": true,
    "duration": 45000,
    "stopped": false,
    "error": null,
    "steps": [
      {
        "name": "Build Application",
        "success": true,
        "output": "Build completed",
        "duration": 5000,
        "isLocal": true
      },
      {
        "name": "Install Dependencies",
        "success": true,
        "output": "added 150 packages",
        "duration": 15000,
        "isLocal": false
      }
    ]
  }
]
```

---

### Statistics

#### Get Deployment Statistics
```http
GET /api/stats
```

**Response**
```json
{
  "totalDeployments": 150,
  "deploymentsToday": 5,
  "lastDeployment": {
    "timestamp": "2024-01-10T10:30:00Z",
    "projectName": "my-project",
    "success": true
  },
  "activeProjects": 3
}
```

---

### System

#### Test SSH Connection
```http
POST /api/test-connection
```

**Request Body**
```json
{
  "host": "server.example.com",
  "username": "deploy",
  "password": "secret",
  "port": 22
}
```

**Response**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

**Error Response**
```json
{
  "success": false,
  "message": "Authentication failed"
}
```

---

## Error Responses

All endpoints may return these standard error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## WebSocket Events (Future)

Future versions will support WebSocket connections for real-time updates:

```javascript
// Connection
ws://localhost:3000/ws

// Subscribe to project updates
{
  "type": "subscribe",
  "project": "my-project"
}

// Receive deployment updates
{
  "type": "deployment",
  "project": "my-project",
  "status": "started",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Future versions will include:
- 100 requests per minute for general endpoints
- 10 deployments per hour per project
- Configurable limits

---

## CORS Configuration

The API supports CORS for all origins in development mode. Production deployments should configure specific allowed origins.

```javascript
// Current configuration
cors: {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

---

## Examples

### Using cURL

#### List Projects
```bash
curl http://localhost:3000/api/projects
```

#### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-project",
    "localPath": "/home/user/test",
    "ssh": {
      "host": "example.com",
      "username": "user",
      "password": "pass",
      "port": 22
    },
    "remotePath": "/var/www/test",
    "localSteps": [],
    "deploymentSteps": []
  }'
```

#### Start Deployment
```bash
curl -N http://localhost:3000/api/deployments/my-project \
  -H "Accept: text/event-stream"
```

### Using JavaScript

```javascript
// List projects
const response = await fetch('http://localhost:3000/api/projects');
const projects = await response.json();

// Start deployment with EventSource
const eventSource = new EventSource('/api/deployments/my-project');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.message);
};

eventSource.addEventListener('close', () => {
  eventSource.close();
});
```

### Using Node.js

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000
});

// Get all projects
const { data } = await api.get('/projects');

// Create project
const newProject = await api.post('/projects', {
  name: 'node-project',
  // ... other fields
});
```

---

## Development

### Running the API Server

```bash
# Standalone
node src/api/server.js

# With CLI
autodeploy gui --api-port 3000

# Environment variables
PORT=3001 node src/api/server.js
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# With jq for pretty output
curl http://localhost:3000/api/projects | jq
```

### Debug Mode

Set `DEBUG=autodeploy:*` environment variable for detailed logging.

---

## Future Enhancements

1. **Authentication & Authorization**
   - JWT token support
   - Role-based access control
   - API key management

2. **Advanced Features**
   - Deployment scheduling
   - Rollback support
   - Deployment queuing
   - Webhook notifications

3. **Monitoring**
   - Prometheus metrics
   - Health check endpoints
   - Performance tracking

4. **API Versioning**
   - Version in URL path
   - Header-based versioning
   - Deprecation notices