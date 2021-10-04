const serverRoute = require("./serverRoute");
const authenticateUsers = require("./userRoutes/authenticationUsersRoutes");

module.exports = async function routes(fastify) {
	fastify.register(serverRoute);
	fastify.register(authenticateUsers);
};
