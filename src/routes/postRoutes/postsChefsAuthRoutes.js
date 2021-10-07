const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");

module.exports = async function postsChefsAuthRoutes(fastify) {
	fastify.register(chefsRequireAuthentication);
	fastify.decorate("verifyOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return new Error("Missing token header");
		}

		const decodedToken = jwt.decode(request.raw.headers.auth);
		const { id, email, password } = decodedToken;

		if (!id || !email || !password) {
			return new Error("Token not valid");
		}
		const post = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
			SELECT
        c.id,
				p.id,
				p.author_id,
				CASE
					WHEN p.author_id = c.id THEN true
					ELSE false
				END AS "chefOwnsPost"
			FROM posts p
			LEFT JOIN chefs c ON c.id = $1
			WHERE p.id = $2;
			`,
			[id, post.id]
		);
		client.release();
		if (rows[0].chefOwnsPost) {
			return;
		} else {
			throw new Error("Chef does not own this post");
		}
	});
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "POST",
			url: "/posts/post-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { id, title, content, tags, imageURL } = request.body;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"INSERT INTO posts (author_id, title, content, tags, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
					[id, title, content, tags, imageURL]
				);
				client.release();
				return { code: 201, message: "Post successfully created", rows };
			},
		});

		fastify.route({
			method: "PUT",
			url: "/posts/post-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: async (request) => {
				const { title, content, tags, imageURL } = request.body;
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE posts SET title=$1, content=$2, tags=$3, image_url=$4 WHERE id=$5 RETURNING *;",
					[title, content, tags, imageURL, id]
				);
				client.release();
				return { code: 201, message: `Post with id ${id} has been updated`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/posts/post-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query("DELETE FROM posts WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: `Post with id ${id} has beed deleted`, rows };
			},
		});
	});
};
