module.exports = async function usersRoutes(fastify) {
	fastify.get("/users", async () => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM users"
		);
		client.release;
		return { code: 200, rows };
	});

	fastify.get("/user/:id", async function (request) {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM users WHERE id=$1",
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
