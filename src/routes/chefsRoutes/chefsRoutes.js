module.exports = async function chefsRoutes(fastify) {
	fastify.get("/chef/:id", async (request) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT id, first_name AS "firstName", last_name AS "lastName", kitchen_id AS "kitchenID", email, address, phone, signup_date AS "signupDate", avatar_url AS "avatarURL" FROM chefs WHERE id=$1',
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
