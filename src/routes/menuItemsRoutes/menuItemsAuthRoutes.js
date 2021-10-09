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
			url: "/kitchen/menu/create-item",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: itemService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/kitchen/menu-item/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyMenuItemOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: itemService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/kitchen/menu-item/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyMenuItemOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: itemService.remove,
		});
	}

	class ItemService {
		async create() {
			const busboy = new Busboy({ headers: request.headers });
			const myTransformStream = new TransformableStream();

			request.raw.on("data", (chunk) => myTransformStream.write(chunk));
			request.raw.on("end", () => myTransformStream.end());
			myTransformStream.pipe(busboy);

			const bucketParams = { Bucket: "dashchef-dev" };
			const dataObj = {};

			busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
				bucketParams.Key = crypto.randomBytes(20).toString("hex");
				bucketParams.ContentType = mimetype;

				const fileBuffers = [];
				file.on("data", (data) => fileBuffers.push(data));

				file.on("end", async () => {
					const file = Buffer.concat(fileBuffers);
					bucketParams.Body = file;

					try {
						const data = await s3Client.send(new PutObjectCommand(bucketParams));
						dataObj.photoPrimaryURL = process.env.BASE_S3_URL + bucketParams.Key;
					} catch (err) {
						console.log("There was an error uploading the image to S3", err);
					}
				});
			});

			busboy.on("field", (fieldname, val) => {
				dataObj[fieldname] = val;
			});

			let postedMenuItem = [];
			busboy.on("finish", async () => {
				console.log("Busboy has finished processing the formData", dataObj);
				const { name, id, description, price, photoPrimaryURL, galleryPhotoURL, tags } = dataObj;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"INSERT INTO menu_items (name, kitchen_id, description, price, photo_primary_url, gallery_photo_urls, tags) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;",
					[name, id, description, price, photoPrimaryURL, galleryPhotoURL, tags]
				);
				client.release();
				postedMenuItem = [...rows];
			});

			return {
				code: 201,
				message: "Menu item successfully created!",
				postedMenuItem,
			};
		}

		async edit() {
			const { name, description, price, photoPrimaryURL, galleryPhotoURL, tags } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				`
				UPDATE kitchens 
				SET name=$1, description=$2, price=$3, photo_primary_url=$4, gallery_photo_urls=$5, tags=$6 
				WHERE id=$7 
				RETURNING *;
				`,
				[name, description, price, photoPrimaryURL, galleryPhotoURL, tags, id]
			);
			client.release();
			return { code: 200, message: `Menu item with id ${id} has been updated`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			await client.query("DELETE FROM menu_items WHERE id=$1 RETURNING *;", [id]);
			client.release();
			return { code: 200, message: `Menu item with id ${id} has been deleted` };
		}
	}
};
