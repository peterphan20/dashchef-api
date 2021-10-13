const fp = require("fastify-plugin");

async function verifyOrderOwnership(fastify) {
	fastify.decorate("verifyOrderOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return new Error("Missing token header");
		}

		const decodedToken = jwt.decode(request.raw.headers.auth);
		const { id, email, password } = decodedToken;
		const order = request.params;

		if (!id || !email || !password) {
			return new Error("Token not valid");
		}

		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
      SELECT 
        CASE 
          WHEN o.user_id = u.id THEN true
          ELSE false
        END AS "chefOwnsOrder"
      FROM orders o
      LEFT JOIN chefs c ON c.id = $1
      WHERE o.id = $2;
      `,
			[id, order.id]
		);
		client.release();

		if (rows[0].chefOwnsOrder === false) {
			throw new Error("This chef does not own this menu item");
		}
	});
}

module.exports = fp(verifyOrderOwnership);
