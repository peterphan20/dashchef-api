require("dotenv").config();
const fastify = require("fastify")();

const PORT = process.env.PORT || 5000;

fastify.register(require("fastify-cors"));
fastify.register(require("fastify-postgres"), {
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
});
fastify.register(require("fastify-jwt"), {
	secret: process.env.SECRET_KEY,
});
fastify.register(require("./routes"));

async function start() {
	try {
		await fastify.listen(PORT, "0.0.0.0");
		console.clear();
		console.log("Fastify is listening on PORT:", PORT);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}
start();
