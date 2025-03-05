# Serverless Document Manager

This project implements a serverless document management system using LocalStack to emulate AWS services locally. It combines S3 for file storage, Lambda for metadata processing, DynamoDB for metadata tracking, and API Gateway for RESTful access. The entire system is Dockerized for easy local development and testing.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Usage](#usage)

### Introduction

This project implements a serverless document management system using Node.js, Express, and LocalStack. Users can upload documents, automatically extract metadata, and query document information through a REST API. All AWS services (IAM, S3, Lambda, DynamoDB, API Gateway) run locally via LocalStack, providing a cloud-like environment without cloud costs.

### Architecture

![Architecture](./architecture.png 'Architecture')

### Prerequisites

- Docker: [https://www.docker.com/](https://www.docker.com/)
- Node.js 18+ (optional for local development)

### Installation

##### Step 1: Clone the repository

```bash
git clone https://github.com/petarkosic/serverless-document-manager
cd serverless-document-manager
```

##### Step 2: Convert line endings to Unix format

Change directory to the `./init-scripts` folder and run dos2unix comand:

```bash
cd init-scripts
dos2unix setup.sh
```

##### Step 3: Start the system

From the root directory, run:

```bash
docker compose up --build
```

This will:

1. Start LocalStack with IAM, S3, Lambda, DynamoDB and API Gateway
2. Automatically initialize AWS resources (bucket, table, lambdas, permissions)
3. Launch the Express web server
4. Start the web UI

**NOTE**
The setup script has a command to zip Lambda functions.
This actions takes a few minutes, so please be patient.

### Usage

##### Web Interface

1. Open http://localhost:3000
2. Upload documents using the web form
3. View uploaded files and metadata

##### API Endpoints

1. **POST** request to get the pre-signed URL for file upload

- Endpoint: `/get-presigned-url`
- Method: `POST`
- Body:

  - `fileName` The name of the file to be uploaded (`string` `required`)
  - `fileType` MIME type of the file (e.g., "image/jpeg", "application/pdf") (`string` `required`)

- Response:
  - `message` string
  - `url` string
  - `key` string

2. **PUT** request to upload a file to S3

- Endpoint: The URL returned from the `get-presigned-url` endpoint
- Method: `PUT`
- Headers:
  - `Content-Type` The content type of the file (e.g., "application/pdf")
- Body: The file to be uploaded

3. **GET** request to get metadata for a file

- Endpoint: `http://localhost:4566/restapis/documentapi/dev/_user_request_/metadata/${fileID}`
  `NOTE` documentapi is a custom static api gateway id that is created by the setup script and is used for consistent URLs. This is a localstack only feature.
- Method: `GET`
- Parameters:
  - `fileID` The ID of the file to get metadata for
- Response:
  - `statusCode`: number
  - `body`:
    - `message`: string
    - `fileID`: string
    - `fileName`: string
    - `fileType`: string
    - `fileSize`: number
    - `uploadTime`: string
    - `contentType`: string
    - `lastModified`: string

### Cleanup

To stop the system and clean up resources:

```bash
docker compose down
```
