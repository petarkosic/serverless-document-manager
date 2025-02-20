const AWS = require("aws-sdk");
const { extname } = require('path');

const awsConfig = {
    endpoint: 'http://localstack:4566',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};

const s3 = new AWS.S3(awsConfig);
const dynamoDB = new AWS.DynamoDB.DocumentClient(awsConfig);

exports.handler = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        const params = {
            Bucket: bucket,
            Key: key
        };

        const headData = await s3.headObject(params).promise();

        const metadata = {
            fileID: key,
            fileName: key,
            fileType: extname(key).toLowerCase().replace('.', ''),
            fileSize: headData.ContentLength,
            uploadTime: new Date().toISOString(),
            contentType: headData.ContentType,
            lastModified: headData.LastModified.toISOString()
        }

        const dynamoDBParams = {
            TableName: 'Documents',
            Item: metadata
        }

        await dynamoDB.put(dynamoDBParams).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Metadata extracted and stored.',
                metadata
            })
        }
    } catch (error) {
        console.error('Error extracting metadata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Metadata extraction failed.', error: error.message })
        };
    }
};