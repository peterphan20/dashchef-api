const usersRequireAuthentication = require("../../plugins/usersAuthenticator");

module.exports = async function postsAuthRoutes(fastify) {
	fastify.register(usersRequireAuthentication);
	fastify.decorate("verifyOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return done(new Error("Missing token header"));
		}

		jwt.verify(request.raw.headers.auth, async (err, decoded) => {
			try {
				const { email } = decoded;
				const { id } = request.params;
				const kitchen = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					`
          SELECT 
            u.id,
            u.email,
            
        `,
					[kitchen.id, id]
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
};
