const bcrypt = require("bcrypt");

module.exports = async function authenticateChefs(fastify) {
	fastify.post("/auth/chef-create", async (request, reply) => {
		const { firstname, lastname, email, password, address, phone, avatarURL } = request.body;

		if (!firstname || !lastname || !email || !password || !address || !phone) {
			return { code: 400, message: "Missing values, please check input fields." };
		}

		const hash = await bcrypt.hash(password, 10);
		const client = await fastify.pg.connect();
		await client.query(
			"INSERT INTO chefs (first_name, last_name, email, password, address, phone, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;",
			[firstname, lastname, email, hash, address, phone, avatarURL]
		);
		client.release();
		return {
			code: 201,
			message: "Chef successfully created!",
		};
	});

	fastify.post("/auth/chef-login", async (request, reply) => {
		const { email, password } = request.body;

		if (!email) {
			return { code: 400, message: "Invalid email or password provided, please try again!" };
		}

		const client = await fastify.pg.connect();
		const { rows } = await client.query("SELECT password, id FROM chefs WHERE email=$1", [email]);
		client.release();
		const passwordMatch = await bcrypt.compare(password, rows[0].password);
		if (passwordMatch) {
			const token = fastify.jwt.sign({
				expiresIn: "1 day",
				email,
				password,
				id: rows[0].id,
			});
			return { code: 200, message: "Successfully logged in!", chefID: rows[0].id, token };
		}
		return { code: 400, message: "Invalid email or password provided, please try again!" };
	});
};
