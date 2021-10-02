require("dotenv").config();
const fastify = require("fastify")({ logger: true });

const PORT = process.env.PORT || 5000;

fastify.get("/", async function (request, reply) {
	return "hello world";
});

async function start() {
	try {
		await fastify.listen(PORT, "0.0.0.0");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}
start();
