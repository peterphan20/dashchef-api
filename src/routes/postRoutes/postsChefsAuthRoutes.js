const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");
const verifyPostOwnership = require("../../plugins/postOwnership");
const { s3Client } = require("../../helpers/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Busboy = require("busboy");
var crypto = require("crypto");

module.exports = async function postsChefsAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(chefsRequireAuthentication);
	fastify.register(verifyPostOwnership);
	fastify.addContentTypeParser("multipart/form-data", (request, payload, done) => done());
	fastify.after(routes);

	function routes() {
		const postService = new PostService();

		fastify.route({
			method: "POST",
			url: "/posts/post-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: postService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/posts/post-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyPostOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: postService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/posts/post-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyPostOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: postService.remove,
		});
	}

	class PostService {
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

			let postedPost = [];
			busboy.on("finish", async () => {
				try {
					const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
					if (s3res.$metadata.httpStatusCode !== 200) {
						reply.code(400).send({ message: "Failed to post image to s3" });
					}
					dataObj.imageURL = process.env.BASE_S3_URL + bucketParams.Key;
					const { id, title, content, tags, imageURL } = dataObj;
					const client = await fastify.pg.connect();
					const { rows } = await client.query(
						"INSERT INTO posts (author_id, title, content, tags, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
						[id, title, content, tags, imageURL]
					);
					client.release();
					postedPost = [...rows];
					reply.code(201).send({ message: "Post successfully created!", postedPost });
				} catch (err) {
					console.log("Error", err);
					reply.code(400).send({ message: "Error, something went wrong :( " });
				}
			});
		}

		async edit(request) {
			const { title, content, tags, imageURL } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE posts SET title=$1, content=$2, tags=$3, image_url=$4 WHERE id=$5 RETURNING *;",
				[title, content, tags, imageURL, id]
			);
			client.release();
			return { code: 201, message: `Post with id ${id} has been updated`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM posts WHERE id=$1 RETURNING *;", [id]);
			client.release();
			return { code: 200, message: `Post with id ${id} has beed deleted`, rows };
		}
	}
};
