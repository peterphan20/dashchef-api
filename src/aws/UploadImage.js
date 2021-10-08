const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("./s3Client");

const bucketName = process.env.AWS_BUCKET;

const bucketParams = {
	Bucket: bucketName,
	key,
	body,
};

export const uploadImage = async () => {
	try {
		const data = await s3Client.send(new PutObjectCommand(bucketParams));
		console.log("Successfully uploaded object: " + bucketParams.Bucket + "/" + bucketParams.Key);
		return data;
	} catch (err) {
		console.log("Error", err);
	}
};
