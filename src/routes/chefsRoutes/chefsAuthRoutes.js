const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");

module.exports = async function chefsAuthRoutes(fastify) {
	fastify.register(chefsRequireAuthentication);
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "GET",
			url: "/chefs/:id",
			preHandler: fastify.auth([fastify.verifyJWT], {
				relation: "and",
			}),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"SELECT first_name, last_name, email, address, phone, signup_date, avatar_url FROM chefs WHERE id=$1",
					[id]
				);
				client.release();
				return { code: 200, rows };
			},
		});

		fastify.route({
			method: "PUT",
			url: "/chefs/:id",
			preHandler: fastify.auth([fastify.verifyJWT], {
				relation: "and",
			}),
			handler: async (request) => {
				const { firstName, lastName, email, password, address, phone, avatarURL } = request.body;
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE chefs SET first_name=$1, last_name=$2, email=$3, password=$4, address=$5, phone=$6, avatar_url=$7 WHERE id=$8 RETURNING *;",
					[firstName, lastName, email, password, address, phone, avatarURL, id]
				);
				client.release();
				return { code: 200, message: `Sucessfully updated chef with id ${id}.`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/chefs/:id",
			preHandler: fastify.auth([fastify.verifyJWT], {
				relation: "and",
			}),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				await client.query("DELETE FROM chefs WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: `Chef with id ${id} has been deleted.` };
			},
		});
	});
};
