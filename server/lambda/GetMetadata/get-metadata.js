const AWS = require('aws-sdk');

const awsConfig = {
    endpoint: 'http://localstack:4566',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};

const dynamoDB = new AWS.DynamoDB.DocumentClient(awsConfig);

exports.handler = async (event) => {
    const fileID = decodeURIComponent(event.pathParameters.fileID);

    try {
        const data = await dynamoDB.get({
            TableName: 'Documents',
            Key: {
                fileID
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(data.Item),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Type': 'application/json'
            }
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        }
    }
};