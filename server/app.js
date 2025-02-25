import express from 'express';
import cors from 'cors'
import AWS from 'aws-sdk';

const PORT = process.env.PORT || 5000;
const app = express();

const awsConfig = {
    endpoint: 'http://localstack:4566',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};

const s3 = new AWS.S3({
    ...awsConfig,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

app.use(express.json());
app.use(cors());

app.post('/get-presigned-url', async (req, res) => {
    try {
        const { fileName, fileType } = req.body;

        const key = `uploads/${Date.now()}-${fileName}`;

        const params = {
            Bucket: 'document-manager',
            Key: key,
            Expires: 60,
            ContentType: fileType,
        }

        const url = await s3.getSignedUrlPromise('putObject', params);

        const publicUrl = url.replace('http://localstack:4566', 'http://localhost:4566');

        res.status(200).json({
            message: 'URL generated successfully.',
            url: publicUrl,
            key: params.Key
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file.');
    }
});

app.listen(PORT, () => console.log(`Server running on $http://localhost:${PORT}`));