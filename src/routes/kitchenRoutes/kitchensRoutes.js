module.exports = async function kitchensRoutes(fastify) {
	fastify.get("/kitchens", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT name, email, address, phone, avatar_url, created_at FROM kitchens"
		);
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/kitchen/:kitchen", async (request, reply) => {
		const { kitchen } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT name, email, address, phone, avatar_url, created_at FROM kitchens WHERE name = $1",
			[kitchen]
		);
		client.release();
		return { code: 200, rows };
	});
};
