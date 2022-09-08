const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");
const { s3Client } = require("../../helpers/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Busboy = require("busboy");
var crypto = require("crypto");

module.exports = async function chefsCRUDRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(chefsRequireAuthentication);
	fastify.addContentTypeParser("multipart/form-data", (request, payload, done) => done());
	fastify.after(routes);

	function routes() {
		const chefService = new ChefService();

		fastify.route({
			method: "PUT",
			url: "/chefs/chef-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: chefService.edit,
		});

		fastify.route({
			method: "PUT",
			url: "/chefs/avatar-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: chefService.editAvatar,
		});

		fastify.route({
			method: "DELETE",
			url: "/chefs/chef-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: chefService.remove,
		});
	}

	class ChefService {
		async edit(request) {
			const { firstName, lastName, address, phone } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				'UPDATE chefs SET first_name=$1, last_name=$2, address=$3, phone=$4 WHERE id=$5 RETURNING first_name AS "firstName", last_name AS "lastName", email, password, address, phone;',
				[firstName, lastName, address, phone, id]
			);
			client.release();
			return { code: 200, message: `Sucessfully updated chef with id ${id}.`, rows };
		}

		async editAvatar(request, reply) {
			const busboy = new Busboy({ headers: request.headers });
			request.raw.pipe(busboy);

			const bucketParams = { Bucket: "dashchef-dev" };

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

			const dataObj = {};
			busboy.on("field", (fieldname, val) => {
				dataObj[fieldname] = val;
			});

			const something = new Promise((resolve, reject) => {
				busboy.on("finish", async () => {
					try {
						const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
						if (s3res.$metadata.httpStatusCode !== 200) {
							reply.code(400).send({ message: "Failed to post image to s3" });
						}
						dataObj.avatarURL = process.env.BASE_S3_URL + bucketParams.Key;
						const { avatarURL } = dataObj;
						const { id } = request.params;

						if (!avatarURL) {
							return { code: 400, message: "Missing values, please check input fields." };
						}

						const client = await fastify.pg.connect();
						await client.query("UPDATE chefs SET avatar_url=$1 WHERE id=$2 RETURNING *;", [
							avatarURL,
							id,
						]);
						client.release();
						reply.code(204).send({
							code: 200,
							message: `Chef's avatar has been successfully been changed`,
						});
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
			const { rows } = await client.query(
				'DELETE FROM chefs WHERE id=$1 RETURNING first_name AS "firstName", last_name AS "lastName", email, password, address, phone;',
				[id]
			);
			client.release();
			return { code: 200, message: `Chef with id ${id} has been deleted.`, rows };
		}
	}
};
