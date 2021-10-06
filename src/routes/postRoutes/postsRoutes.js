module.exports = async function postsRoutes(fastify) {
	fastify.get("/posts", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query("SELECT * FROM posts");
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/posts/:id", async (request, reply) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query("SELECT * FROM posts WHERE id=$1", [id]);
		client.release();
		return { code: 200, rows };
	});
};
