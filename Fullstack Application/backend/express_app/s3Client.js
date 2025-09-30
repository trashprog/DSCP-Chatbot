const {S3Client, HeadBucketCommand} = require("@aws-sdk/client-s3");
require('dotenv').config({ path: "../../../.env" });

// configure s3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    }
});

// A helper function to ensure the bucket exists on server startup
const ensureBucketExists = async () => {
    const bucketName = process.env.AWS_S3_BUCKET;

    try {
        // Check if the bucket exists and you have permission to access it.
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName}));
        console.log(`Bucket "${bucketName}" already exists and is accessible.`);
    } catch (err) {
        // If the error is 'NotFound', the bucket does not exist.
        if (err.name === 'NotFound') {
            console.log(`Bucket "${bucketName}" does not exist.`);
            }
        else {
            // Another error occurred (e.g., network)
            console.error("Error checking for S3 bucket:", err);
        }
    }
};

module.exports = { s3Client, ensureBucketExists };