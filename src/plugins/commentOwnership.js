const fp = require("fastify-plugin");

async function verifyCommentOwnership(fastify) {
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
}

module.exports = fp(verifyCommentOwnership);
