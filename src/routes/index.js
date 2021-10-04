const serverRoute = require("./serverRoute");
const usersRoutes = require("./userRoutes/usersRoutes");
const usersAuthRoutes = require("./userRoutes/usersAuthRoutes");
const authenticateUsers = require("./userRoutes/authenticationUsersRoutes");
const chefsRoutes = require("./chefsRoutes/chefsRoutes");
const chefsAuthRoutes = require("./chefsRoutes/chefsAuthRoutes");
const authenticateChefs = require("./chefsRoutes/authenticationChefsRoutes");
const kitchensAuthRoutes = require("./kitchenRoutes/kitchensAuthRoutes");

module.exports = async function routes(fastify) {
	fastify.register(serverRoute);
	fastify.register(usersRoutes);
	fastify.register(usersAuthRoutes);
	fastify.register(authenticateUsers);
	fastify.register(chefsRoutes);
	fastify.register(chefsAuthRoutes);
	fastify.register(authenticateChefs);
	fastify.register(kitchensAuthRoutes);
};
