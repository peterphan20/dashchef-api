const bcrypt = require("bcrypt");
const usersRequireAuthentication = require("../../plugins/usersAuthenticator");

module.exports = async function usersAuthRoutes(fastify) {
	fastify.register(usersRequireAuthentication);
	fastify.register(require("fastify-auth"));
	fastify.after(routes);

	function routes() {
		const userService = new UserService();

		fastify.route({
			method: "PUT",
			url: "/users/user-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: userService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/users/user-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: userService.remove,
		});
	}

	class UserService {
		async edit(request) {
			const { firstName, lastName, email, address, phone } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				'UPDATE users SET first_name=$1, last_name=$2, email=$3, address=$4, phone=$5 WHERE id=$6 RETURNING first_name AS "firstName", last_name AS "lastName", email, address, phone;',
				[firstName, lastName, email, address, phone, id]
			);
			client.release();
			return { code: 200, message: `Sucessfully updated user with id ${id}.`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				'DELETE FROM users WHERE id=$1 RETURNING first_name AS "firstName", last_name AS "lastName", email, address, phone;',
				[id]
			);
			client.release();
			return { code: 200, message: `User with id ${id} has been deleted.`, rows };
		}
	}
};
