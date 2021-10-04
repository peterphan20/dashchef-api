const fp = require("fastify-plugin");
const bcrypt = require("bcrypt");

async function usersRequireAuthentication(fastify) {
	fastify.decorate("verifyJWT", (request, reply, done) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return done(new Error("Missing token header"));
		}

		jwt.verify(request.raw.headers.auth, async (err, decoded) => {
			try {
				const { email, password } = decoded;
				const client = await fastify.pg.connect();
				const { rows } = await client.query("SELECT password, id FROM users WHERE email=$1", [
					email,
				]);
				client.release();
				const passwordMatch = await bcrypt.compare(password, rows[0].password);
				if (passwordMatch) {
					console.log("User has been validated and password matched");
					return done();
				}
			} catch (error) {
				console.error(error);
				return done(new Error(error));
			}
		});
	});
}

module.exports = fp(usersRequireAuthentication);
