module.exports = async function chefsRoutes(fastify) {
	fastify.get("/chefs", async (request) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT first_name AS "firstName", last_name AS "lastName", email, address, phone, signup_date AS "signupDate", avatar_url AS "avatarURL" FROM chefs'
		);
		client.release;
		return { code: 200, rows };
	});

	fastify.get("/chef/:id", async (request) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT first_name AS "firstName", last_name AS "lastName", email, address, phone, signup_date AS "signupDate", avatar_url AS "avatarURL" FROM chefs WHERE id=$1',
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
