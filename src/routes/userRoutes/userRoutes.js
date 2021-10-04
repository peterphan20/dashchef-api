module.exports = async function userRoutes(fastify) {
	fastify.get("/users", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM users"
		);
		client.release;
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

	// fastify.delete("/users/:userID", async (request, reply) => {
	// 	const { userID } = request.params;
	// 	const client = await fastify.pg.connect();
	// 	await client.query("DELETE FROM users WHERE id=$1 RETURNING *;", [userID]);
	// 	client.release();
	// 	return { code: 200, message: `User with id ${userID} has been deleted.` };
	// });

	fastify.put("/users/:userID", async (request, reply) => {
		const { firstName, lastName, email, password, address, phone, avatarURL } = request.body;
		const { userID } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"UPDATE users SET first_name=$1, last_name=$2, email=$3, password=$4, address=$5, phone=$6, avatar_url=$7 WHERE id=$8 RETURNING *;",
			[firstName, lastName, email, password, address, phone, avatarURL, userID]
		);
		client.release();
		return { code: 200, message: `Sucessfully updated articles with id ${userID}.`, rows };
	});
};
