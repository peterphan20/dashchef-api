const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");
const verifyMenuItemOwnership = require("../../plugins/menuItemOwnership");
const { s3Client } = require("../../helpers/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Busboy = require("busboy");
var crypto = require("crypto");

module.exports = async function menuItemsAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(chefsRequireAuthentication);
	fastify.register(verifyMenuItemOwnership);
	fastify.addContentTypeParser("multipart/form-data", (request, payload, done) => done());
	fastify.after(routes);

	function routes() {
		const itemService = new ItemService();

		fastify.route({
			method: "POST",
			url: "/kitchen/item-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: itemService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/kitchen/item-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyMenuItemOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: itemService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/kitchen/item-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyMenuItemOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: itemService.remove,
		});
	}

	class ItemService {
		async create(request, reply) {
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

			let postedMenuItem = [];
			busboy.on("finish", async () => {
				try {
					const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
					if (s3res.$metadata.httpStatusCode !== 200) {
						reply.code(400).send({ message: "Failed to post image to s3" });
					}
					dataObj.photoPrimaryURL = process.env.BASE_S3_URL + bucketParams.Key;
					const { name, id, description, price, photoPrimaryURL, tags } = dataObj;
					const client = await fastify.pg.connect();
					const { rows } = await client.query(
						"INSERT INTO menu_items (name, kitchen_id, description, price, photo_primary_url, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;",
						[name, id, description, price, photoPrimaryURL, tags]
					);
					client.release();
					postedMenuItem = [...rows];
					reply.code(201).send({
						code: 201,
						message: `Menu item ${name} was successfully created!`,
						postedMenuItem,
					});
				} catch (err) {
					console.log("Error", err);
					reply.code(400).send({ message: "Error, something went wrong :( " });
				}
			});
		}

		async edit(request) {
			const { name, description, price, tags } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE menu_items SET name=$1, description=$2, price=$3, tags=$4 WHERE id=$5 RETURNING *;",
				[name, description, price, tags, id]
			);
			client.release();
			return { code: 200, message: `Menu item with id ${id} has been updated`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM menu_items WHERE id=$1 RETURNING *;", [id]);
			client.release();
			return { code: 200, message: `Menu item with id ${id} has been deleted`, rows };
		}
	}
};
