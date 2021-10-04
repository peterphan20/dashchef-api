const serverRoute = require("./serverRoute");
const userRoutes = require("./userRoutes/userRoutes");
const authenticateUsers = require("./userRoutes/authenticationUsersRoutes");

module.exports = async function routes(fastify) {
	fastify.register(serverRoute);
	fastify.register(userRoutes);
	fastify.register(authenticateUsers);
};
