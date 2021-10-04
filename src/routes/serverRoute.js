module.exports = async function serverRoute(fastify) {
	fastify.get("/", async (request) => {
		return "Hello from the Dashchef API :)";
	});
};
