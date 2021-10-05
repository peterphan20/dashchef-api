const bcrypt = require("bcrypt");
const usersRequireAuthentication = require("../../plugins/usersAuthenticator");

module.exports = async function usersAuthRoutes(fastify) {
	fastify.register(usersRequireAuthentication);
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "GET",
			url: "/users/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM users WHERE id=$1",
					[id]
				);
				client.release();
				return { code: 200, rows };
			},
		});

		fastify.route({
			method: "PUT",
			url: "/users/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { firstName, lastName, email, password, address, phone, avatarURL } = request.body;
				const { id } = request.params;
				const hash = await bcrypt.hash(password, 10);
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE users SET first_name=$1, last_name=$2, email=$3, password=$4, address=$5, phone=$6, avatar_url=$7 WHERE id=$8 RETURNING *;",
					[firstName, lastName, email, hash, address, phone, avatarURL, id]
				);
				client.release();
				return { code: 200, message: `Sucessfully updated user with id ${id}.`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/users/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query("DELETE FROM users WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: `User with id ${id} has been deleted.`, rows };
			},
		});
	});
};
