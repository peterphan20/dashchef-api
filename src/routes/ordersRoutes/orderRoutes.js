module.exports = async function orderRoutes(fastify) {
	fastify.get("/orders", async function (request, reply) {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT status, date_created AS "dateCreated", date_fulfilled AS "dateFulfilled" FROM orders'
		);
		client.release();
		return { code: 200, rows };
	});
};
