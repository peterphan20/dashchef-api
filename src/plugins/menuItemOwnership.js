const fp = require("fastify-plugin");

async function verifyMenuItemOwnership(fastify) {
	fastify.decorate("verifyMenuItemOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return new Error("Missing token header");
		}

		const decodedToken = jwt.decode(request.raw.headers.auth);
		const { id, email, password } = decodedToken;
		const menuItem = request.params;

		if (!id || !email || !password) {
			return new Error("Token not valid");
		}

		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
      SELECT 
        CASE 
          WHEN m.kitchen_id = c.kitchen_id THEN true
          ELSE false
        END AS "chefOwnsMenuItem"
      FROM menu_items m
      LEFT JOIN chefs c ON c.id = $1
      WHERE m.id = $2;
      `,
			[id, menuItem.id]
		);
		client.release();

		if (rows[0].chefOwnsThisKitchen === false) {
			throw new Error("This chef does not own this menu item");
		}
	});
}

module.exports = fp(verifyMenuItemOwnership);
