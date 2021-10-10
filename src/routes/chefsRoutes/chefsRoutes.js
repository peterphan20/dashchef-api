module.exports = async function chefsRoutes(fastify) {
	fastify.get("/chefs", async function (request, reply) {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM chefs"
		);
		client.release;
		return { code: 200, rows };
	});

	fastify.get("/chef/:id", async (request) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM chefs WHERE id=$1",
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
