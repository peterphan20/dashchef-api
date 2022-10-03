const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");
const verifyPostOwnership = require("../../plugins/postOwnership");

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
		async create(request) {
			const { id, title, content, tags, imageURL } = request.body;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"INSERT INTO posts (author_id, title, content, tags, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
				[id, title, content, tags, imageURL]
			);
			client.release();
			postedPost = [...rows];
			reply.code(201).send({ message: "Post successfully created!", postedPost });
		}

		async edit(request) {
			const { title, content, tags, imageURL } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				'UPDATE posts SET title=$1, content=$2, tags=$3, image_url=$4 WHERE id=$5 RETURNING title, content, tags, image_url AS "imageURL";',
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
