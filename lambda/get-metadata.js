import { config } from 'dotenv';
config();
import AWS from 'aws-sdk';

const awsConfig = {
    endpoint: 'http://localstack:4566',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};

const dynamoDB = new AWS.DynamoDB.DocumentClient(awsConfig);

exports.handler = async () => {
    const data = await dynamoDB.scan({ TableName: 'Documents' }).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(data.Items)
    };
};