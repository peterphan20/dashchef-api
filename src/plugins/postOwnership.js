const fp = require("fastify-plugin");

async function verifyPostOwnership(fastify) {
	fastify.decorate("verifyPostOwnership", async (request, reply) => {
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
}

module.exports = fp(verifyPostOwnership);
