const { S3Client } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const accessKeyID = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({ region, accessKeyID, secretAccessKey });

module.exports = { s3Client };
