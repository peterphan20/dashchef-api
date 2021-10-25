module.exports = async function usersRoutes(fastify) {
	fastify.get("/user/:id", async function (request) {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT first_name AS "firstName", last_name AS "lastName", email, address, phone, signup_date AS "signupDate", avatar_url AS "avatarURL" FROM users WHERE id=$1',
			[id]
		);
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/authenticated", async (request) => {
		if (!request.raw.headers.auth) {
			return { code: 403, authenticated: false };
		}

		try {
			const { id } = fastify.jwt.decode(request.raw.headers.auth);
			return { code: 200, authenticated: true, id };
		} catch (error) {
			return { code: 403, authenticated: false };
		}
	});
};
