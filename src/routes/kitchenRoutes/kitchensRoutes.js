module.exports = async function kitchensRoutes(fastify) {
	fastify.get("/kitchens", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT name, email, address, phone, avatar_url, created_at FROM kitchens"
		);
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/kitchens/:id", async (request, reply) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT name, email, address, phone, avatar_url, created_at FROM kitchens where id = $1",
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
