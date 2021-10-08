const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const s3Client = require("./s3Client");

export const getImage = async () => {
	try {
		const data = await s3Client.send(new ListBucketsCommand({}));
		console.log("Success", data.Buckets);
		return data;
	} catch (err) {
		console.log("Error", err);
	}
};
getImage();
