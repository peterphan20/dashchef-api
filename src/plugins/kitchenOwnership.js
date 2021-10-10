const fp = require("fastify-plugin");

async function verifyKitchenOwnership(fastify) {
	fastify.decorate("verifyKitchenOwnership", async (request, reply) => {
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
}

module.exports = fp(verifyKitchenOwnership);
