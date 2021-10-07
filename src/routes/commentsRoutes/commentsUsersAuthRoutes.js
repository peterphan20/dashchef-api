const usersRequireAuthentication = require("../../plugins/usersAuthenticator");

module.exports = async function commentsUsersAuthRoutes(fastify) {
	fastify.register(usersRequireAuthentication);
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
		const comment = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
			SELECT
				u.id,
				c.id,
				c.author_user_id,
				CASE
					WHEN c.author_user_id = u.id THEN true
					ELSE false
				END AS "userOwnsComment"
			FROM comments c
			LEFT JOIN users u ON u.id = $1
			WHERE c.id = $2;
			`,
			[id, comment.id]
		);
		client.release();
		if (rows[0].userOwnsComment) {
			return;
		} else {
			throw new Error("Chef does not own this kitchen");
		}
	});
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "POST",
			url: "/comments/comment-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { authorUserID, authorKitchenID, authorType, content } = request.body;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"INSERT INTO comments (author_user_id, author_kitchen_id, author_type, content) VALUES ($1, $2, $3, $4) RETURNING *;",
					[authorUserID, authorKitchenID, authorType, content]
				);
				client.release();
				return { code: 201, message: "Comment successfully created", rows };
			},
		});

		fastify.route({
			method: "PUT",
			url: "/comments/comment-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: async (request) => {
				const { content } = request.body;
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE comments SET content=$1 WHERE id=$2 RETURNING *;",
					[content, id]
				);
				client.release();
				return { code: 200, message: `Comment with id ${id} has been updated`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/comments/comment-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query("DELETE FROM kitchens WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: `Comment with id ${id} has been deleted`, rows };
			},
		});
	});
};
