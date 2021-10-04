require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const fs = require("fs");

const PORT = process.env.PORT || 5000;

fastify.register(require("fastify-cors"));
fastify.register(require("fastify-postgres"), {
	// connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
		ca: fs.readFileSync("./config/ca-certificate.crt").toString(),
	},
	database: "dashchef",
	host: "db-postgresql-nyc1-05832-do-user-9949191-0.b.db.ondigitalocean.com"
});
fastify.register(require("fastify-jwt"), {
	secret: process.env.SECRET_KEY,
});
fastify.register(require("./routes"));

async function start() {
	try {
		await fastify.listen(PORT, "0.0.0.0");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}
start();
