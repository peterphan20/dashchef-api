const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");

module.exports = async function kitchensAuthRoutes(fastify) {
	fastify.register(chefsRequireAuthentication);
	fastify.decorate("verifyOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return done(new Error("Missing token header"));
		}

		jwt.verify(request.raw.headers.auth, async (err, decoded) => {
			try {
				const { email } = decoded;
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					`
          SELECT 
            c.id,
            c.email,
            c.kitchen_id,
            k.id,
            CASE 
              WHEN k.id = c.kitchen_id THEN true
              ELSE false
            END AS "userOwnKitchen"
            FROM kitchens k
            LEFT JOIN chefs c on c.email = $1
            WHERE k.id = $2;
        `,
					[email, id]
				);
				client.release();
				if (rows[0].userOwnKitchen) {
					return done();
				}
				return done(new Error("User does not own this kitchen"));
			} catch (error) {
				console.error(error);
				return done(new Error(error));
			}
		});
	});
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "POST",
			url: "/kitchens/kitchen-create",
			handler: async (request) => {
				const { name, email, address, phone, avatarURL } = request.body;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"INSERT INTO kitchens (name, email, address, phone, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
					[name, email, address, phone, avatarURL]
				);
				client.release();
				return { code: 201, message: "Kitchen successfully created!", rows };
			},
		});
		fastify.route({
			method: "DELETE",
			url: "/kitchens/:id",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				await client.query("DELETE FROM kitchens WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: "This kitchen has been deleted" };
			},
		});
	});
};
