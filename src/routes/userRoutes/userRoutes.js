module.exports = async function userRoutes(fastify) {
	fastify.get("/authenticated", async (request) => {
		if (!request.raw.headers.auth) {
			return { code: 403, authenticated: false };
		}

		try {
			const { id } = fastify.jwt.decode(request.raw.headers.auth);
			return { code: 200, authenticated: true, id };
		} catch (error) {
			return { code: 403, authenticated: false };
		}
	});
};
