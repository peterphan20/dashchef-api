const serverRoute = require("./serverRoute");
const usersRoutes = require("./userRoutes/usersRoutes");
const usersAuthRoutes = require("./userRoutes/usersAuthRoutes");
const authenticateUsers = require("./userRoutes/authenticationUsersRoutes");
const chefsRoutes = require("./chefsRoutes/chefsRoutes");
const chefsAuthRoutes = require("./chefsRoutes/chefsAuthRoutes");
const authenticateChefs = require("./chefsRoutes/authenticationChefsRoutes");
const kitchensRoutes = require("./kitchenRoutes/kitchensRoutes");
const kitchensAuthRoutes = require("./kitchenRoutes/kitchensAuthRoutes");
const postsRoutes = require("./postRoutes/postsRoutes");
const postsUsersAuthRoutes = require("./postRoutes/postsUsersAuthRoutes");
const menuItemsRoutes = require("./menuItemsRoutes/menuItemsRoutes");
const menuItemsAuthRoutes = require("./menuItemsRoutes/menuItemsAuthRoutes");

module.exports = async function routes(fastify) {
	fastify.register(serverRoute);
	fastify.register(usersRoutes);
	fastify.register(usersAuthRoutes);
	fastify.register(authenticateUsers);
	fastify.register(chefsRoutes);
	fastify.register(chefsAuthRoutes);
	fastify.register(authenticateChefs);
	fastify.register(kitchensRoutes);
	fastify.register(kitchensAuthRoutes);
	fastify.register(postsRoutes);
	fastify.register(postsUsersAuthRoutes);
	fastify.register(menuItemsRoutes);
	fastify.register(menuItemsAuthRoutes);
};
