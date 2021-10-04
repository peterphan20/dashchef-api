const usersRequireAuthentication = require("../../plugins/usersAuthenticator");

module.exports = async function userAuthRoutes(fastify) {
	fastify.register(usersRequireAuthentication);
	fastify.register(requrie("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "PUT",
			url: "/users/:userID",
			preHandler: fastify.auth([fastify.verifyJWT], {
				relation: "and",
			}),
			handler: async (request) => {
				const { firstName, lastName, email, password, address, phone, avatarURL } = request.body;
				const { userID } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE users SET first_name=$1, last_name=$2, email=$3, password=$4, address=$5, phone=$6, avatar_url=$7 WHERE id=$8 RETURNING *;",
					[firstName, lastName, email, password, address, phone, avatarURL, userID]
				);
				client.release();
				return { code: 200, message: `Sucessfully updated articles with id ${userID}.`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/users/:userID",
			preHandler: fastify.auth([fastify.verifyJWT], {
				relation: "and",
			}),
			handler: async (request) => {
				const { userID } = request.params;
				const client = await fastify.pg.connect();
				await client.query("DELETE FROM users WHERE id=$1 RETURNING *;", [userID]);
				client.release();
				return { code: 200, message: `User with id ${userID} has been deleted.` };
			},
		});
	});
};
