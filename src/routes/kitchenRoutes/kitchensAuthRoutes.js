const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");

module.exports = async function kitchensAuthRoutes(fastify) {
	fastify.register(chefsRequireAuthentication);
	fastify.decorate("verifyOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return new Error("Missing token header");
		}

		const decodedToken = jwt.decode(request.raw.headers.auth);
		const { id, email, password } = decodedToken;

		if (!id || !email || !password) {
			return new Error("Token not valid");
		}
		const kitchen = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
			SELECT
				c.id,
				c.kitchen_id,
				k.id,
				CASE
					WHEN k.id = c.kitchen_id THEN true
					ELSE false
				END AS "chefOwnsKitchen"
			FROM kitchens k
			LEFT JOIN chefs c ON c.id = $1
			WHERE k.id = $2;
			`,
			[id, kitchen.id]
		);
		client.release();
		if (rows[0].chefOwnsKitchen === false) {
			throw new Error("Chef does not own this kitchen");
		}
	});
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "POST",
			url: "/kitchens/kitchen-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { name, email, address, phone, avatarURL } = request.body;
				const chef = fastify.jwt.decode(request.raw.headers.auth);
				const client = await fastify.pg.connect();
				const newKitchen = await client.query(
					"INSERT INTO kitchens (name, email, address, phone, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
					[name, email, address, phone, avatarURL]
				);
				const { rows } = await client.query("UPDATE chefs SET kitchen_id=$1 WHERE id=$2", [
					newKitchen.rows[0].id,
					chef.id,
				]);
				client.release();
				return {
					code: 201,
					message: "Kitchen successfully created!",
					newKitchen: newKitchen.rows,
					rows,
				};
			},
		});

		fastify.route({
			method: "PUT",
			url: "/kitchens/kitchen-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: async (request) => {
				const { name, email, address, phone, avatarURL } = request.body;
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE kitchens SET name=$1, email=$2, address=$3, phone=$4, avatar_url=$5 WHERE id=$6 RETURNING *;",
					[name, email, address, phone, avatarURL, id]
				);
				client.release();
				return { code: 200, message: `Kitchen with id ${id} has been updated`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/kitchens/kitchen-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				await client.query("DELETE FROM kitchens WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: `Kitchen with id ${id} has been deleted` };
			},
		});
	});
};
