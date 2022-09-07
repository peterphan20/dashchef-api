const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");
const verifyKitchenOwnership = require("../../plugins/kitchenOwnership");
const { s3Client } = require("../../helpers/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Busboy = require("busboy");
var crypto = require("crypto");

module.exports = async function kitchensAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(chefsRequireAuthentication);
	fastify.register(verifyKitchenOwnership);
	fastify.addContentTypeParser("multipart/form-data", (request, payload, done) => done());
	fastify.after(routes);

	function routes() {
		const kitchenService = new KitchenService();

		fastify.route({
			method: "POST",
			url: "/kitchens/kitchen-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: kitchenService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/kitchens/kitchen-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyKitchenOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: kitchenService.edit,
		});

		fastify.route({
			method: "PUT",
			url: "/kitchens/avatar-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyKitchenOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: kitchenService.editAvatar,
		});

		fastify.route({
			method: "PUT",
			url: "/kitchens/banner-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyKitchenOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: kitchenService.editBanner,
		});

		fastify.route({
			method: "DELETE",
			url: "/kitchens/kitchen-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyKitchenOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: kitchenService.remove,
		});
	}

	class KitchenService {
		// async create(request, reply) {
		// 	const busboy = new Busboy({ headers: request.headers });
		// 	request.raw.pipe(busboy);

		// 	const bucketParams = { Bucket: "dashchef-dev" };
		// 	const dataObj = {};

		// 	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		// 		bucketParams.Key = crypto.randomBytes(20).toString("hex");
		// 		bucketParams.ContentType = mimetype;

		// 		const fileBuffers = [];
		// 		file.on("data", (data) => fileBuffers.push(data));

		// 		file.on("end", async () => {
		// 			const file = Buffer.concat(fileBuffers);
		// 			bucketParams.Body = file;
		// 		});
		// 	});

		// 	busboy.on("field", (fieldname, val) => {
		// 		dataObj[fieldname] = val;
		// 	});

		// 	let postedKitchen = [];
		// 	busboy.on("finish", async () => {
		// 		try {
		// 			const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
		// 			if (s3res.$metadata.httpStatusCode !== 200) {
		// 				reply.code(400).send({ message: "Failed to post image to s3" });
		// 			}
		// 			dataObj.avatarURL = process.env.BASE_S3_URL + bucketParams.Key;
		// 			const { name, email, address, phone, avatarURL } = dataObj;
		// 			console.log(dataObj);
		// 			const chef = fastify.jwt.decode(request.raw.headers.auth);
		// 			const client = await fastify.pg.connect();
		// 			const { rows } = await client.query(
		// 				"INSERT INTO kitchens (name, email, address, phone, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
		// 				[name, email, address, phone, avatarURL]
		// 			);
		// 			await client.query("UPDATE chefs SET kitchen_id=$1 WHERE id=$2", [rows[0].id, chef.id]);
		// 			client.release();
		// 			postedKitchen = [...rows];
		// 			reply.code(201).send({ message: "Kitchen successfully created!", postedKitchen });
		// 		} catch (err) {
		// 			console.log("Error", err);
		// 			reply.code(400).send({ message: "Error, something went wrong :( " });
		// 		}
		// 	});
		// }

		async create(request) {
			const { name, email, address, phone } = request.body;

			if (!name || !email || !address || !phone) return { code: 400, message: "Missing values" };

			const chef = fastify.jwt.decode(request.raw.headers.auth);
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"INSERT INTO kitchens (name, email, address, phone) VALUES ($1, $2, $3, $4) RETURNING *;",
				[name, email, address, phone]
			);
			await client.query("UPDATE chefs SET kitchen_id=$1 WHERE id=$2", [rows[0].id, chef.id]);
			client.release();
			return {
				code: 201,
				message: "Kitchen successfully created",
				data: rows[0],
			};
		}

		async edit(request) {
			const { email, address, phone } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE kitchens SET email=$1, address=$2, phone=$3 WHERE id=$4 RETURNING *;",
				[email, address, phone, id]
			);
			client.release();
			return { code: 200, message: `Kitchen with id ${id} has been updated`, rows };
		}

		async editAvatar(request) {
			const busboy = new Busboy({ headers: request.headers });
			request.raw.pipe(busboy);

			const bucketParams = { Bucket: "dashchef-dev" };
			const dataObj = {};

			busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
				bucketParams.Key = crypto.randomBytes(20).toString("hex");
				bucketParams.ContentType = mimetype;

				const fileBuffers = [];
				file.on("data", (data) => fileBuffers.push(data));

				file.on("end", async () => {
					const file = Buffer.concat(fileBuffers);
					bucketParams.Body = file;
				});
			});

			busboy.on("field", (fieldname, val) => {
				dataObj[fieldname] = val;
			});

			const updatedAvatar = [];
			const something = new Promise((resolve, reject) => {
				busboy.on("finish", async () => {
					try {
						const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
						if (s3res.$metadata.httpStatusCode !== 200) {
							reply.code(400).send({ message: "Failed to post image to s3" });
						}
						dataObj.avatarURL = process.env.BASE_S3_URL + bucketParams.Key;
						const { avatarURL, id } = dataObj;

						if (!avatarURL || !id) {
							return { code: 400, message: "Missing values, please check input fields." };
						}

						const client = await fastify.pg.connect();
						await client.query("UPDATE kitchens SET avatar_url=$1, WHERE id=$2 RETURNING *;", [
							avatarURL,
							id,
						]);
						updatedAvatar = [...rows];
						client.release();
						reply.code(200).send({ code: 200, message: "User successful created!", updatedAvatar });
						resolve();
					} catch (err) {
						console.log("Error", err);
						reject();
						reply.code(400).send({ message: "Error, something went wrong :( " });
					}
				});
			});
			await something;
		}

		async editBanner(request) {
			const busboy = new Busboy({ headers: request.headers });
			request.raw.pipe(busboy);

			const bucketParams = { Bucket: "dashchef-dev" };
			const dataObj = {};

			busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
				bucketParams.Key = crypto.randomBytes(20).toString("hex");
				bucketParams.ContentType = mimetype;

				const fileBuffers = [];
				file.on("data", (data) => fileBuffers.push(data));

				file.on("end", async () => {
					const file = Buffer.concat(fileBuffers);
					bucketParams.Body = file;
				});
			});

			busboy.on("field", (fieldname, val) => {
				dataObj[fieldname] = val;
			});

			const updatedBanner = [];
			const something = new Promise((resolve, reject) => {
				busboy.on("finish", async () => {
					try {
						const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
						if (s3res.$metadata.httpStatusCode !== 200) {
							reply.code(400).send({ message: "Failed to post image to s3" });
						}
						dataObj.bannerURL = process.env.BASE_S3_URL + bucketParams.Key;
						const { bannerURL, id } = dataObj;

						if (!bannerURL || !id) {
							return { code: 400, message: "Missing values, please check input fields." };
						}

						const client = await fastify.pg.connect();
						await client.query("UPDATE kitchens SET banner_url=$1, WHERE id=$2 RETURNING *;", [
							bannerURL,
							id,
						]);
						updatedBanner = [...rows];
						client.release();
						reply.code(200).send({ code: 200, message: "User successful created!", updatedBanner });
						resolve();
					} catch (err) {
						console.log("Error", err);
						reject();
						reply.code(400).send({ message: "Error, something went wrong :( " });
					}
				});
			});
			await something;
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM kitchens WHERE id=$1 RETURNING *;", [id]);
			client.release();
			return { code: 200, message: `Kitchen with id ${id} has been deleted`, rows };
		}
	}
};
