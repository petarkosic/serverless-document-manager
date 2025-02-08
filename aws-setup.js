import { config } from 'dotenv'
config();
import AWS from 'aws-sdk';
import fs from "fs";


const awsConfig = {
    endpoint: 'http://localstack:4566',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
    forcePathStyle: true,
};
const s3 = new AWS.S3({
    ...awsConfig,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});
const dynamoDB = new AWS.DynamoDB(awsConfig);
const apiGateway = new AWS.APIGateway(awsConfig);

async function setupAPIGateway() {
    try {
        const api = await apiGateway.createRestApi({
            name: 'DocumentAPI',
            description: 'Document Metadata API'
        }).promise();

        const apiId = api.id;
        console.log(`API created with ID: ${apiId}`);

        const resources = await apiGateway.getResources({
            restApiId: apiId
        }).promise();

        const rootResourceId = resources.items[0].id;

        await apiGateway.putMethod({
            restApiId: apiId,
            resourceId: rootResourceId,
            httpMethod: 'GET',
            authorizationType: 'NONE'
        }).promise();

        await apiGateway.putIntegration({
            restApiId: apiId,
            resourceId: rootResourceId,
            httpMethod: 'GET',
            type: 'AWS_PROXY',
            integrationHttpMethod: 'POST',
            uri: `arn:aws:apigateway:${process.env.AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${process.env.AWS_REGION}:000000000000:function:GetMetadata/invocations`
        }).promise();

        await apiGateway.createDeployment({
            restApiId: apiId,
            stageName: 'dev'
        }).promise();

        console.log(`API Gateway URL: http://localstack:4566/restapis/${apiId}/dev/_user_request_/`);

        fs.writeFileSync('/tmp/api-id.txt', apiId);

    } catch (err) {
        console.error('API Gateway setup failed:', err);
    }
}


async function setupAWS() {
    try {
        await s3.createBucket({ Bucket: 'document-manager' }).promise();

        await dynamoDB.createTable({
            TableName: 'Documents',
            AttributeDefinitions: [{ AttributeName: 'DocumentID', AttributeType: 'S' }],
            KeySchema: [{ AttributeName: 'DocumentID', KeyType: 'HASH' }],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }).promise();

        await setupAPIGateway();

        console.log('AWS resources created!');
    } catch (err) {
        console.error('Setup error:', err);
    }
}

setupAWS();