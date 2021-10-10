const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");
const bcrypt = require("bcrypt");

module.exports = async function chefsAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(chefsRequireAuthentication);
	fastify.after(routes);

	function routes() {
		const chefsService = new ChefsService();

		fastify.route({
			method: "PUT",
			url: "/chefs/chef-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: chefsService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/chefs/chef-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: chefsService.remove,
		});
	}

	class ChefsService {
		async edit(request) {
			const { firstname, lastname, email, password, address, phone, avatarURL } = request.body;
			const { id } = request.params;
			const hash = await bcrypt.hash(password, 10);
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE chefs SET first_name=$1, last_name=$2, email=$3, password=$4, address=$5, phone=$6, avatar_url=$7 WHERE id=$8 RETURNING *;",
				[firstname, lastname, email, hash, address, phone, avatarURL, id]
			);
			client.release();
			return { code: 200, message: `Sucessfully updated chef with id ${id}.`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM chefs WHERE id=$1 RETURNING *;", [id]);
			client.release();
			return { code: 200, message: `Chef with id ${id} has been deleted.`, rows };
		}
	}
};
