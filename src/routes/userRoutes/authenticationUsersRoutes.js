const bcrypt = require("bcrypt");

module.exports = async function authenticateUsers(fastify) {
	fastify.addContentTypeParser("multipart/form-data", (request, payload, done) => done());

	fastify.post("/auth/user", async (request, reply) => {
		const { firstName, lastName, email, password, address, phone } = request.body;

		if (!firstName || !lastName || !email || !password || !address || !phone) {
			return { code: 400, message: "Missing values, please check input fields." };
		}

		const hash = await bcrypt.hash(password, 10);
		const client = await fastify.pg.connect();
		try {
			const { rows } = await client.query(
				'INSERT INTO users (first_name, last_name, email, password, address, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING first_name AS "firstName", last_name AS "lastName", email, password,address, phone;',
				[firstName, lastName, email, hash, address, phone]
			);
			client.release();
			return { code: 201, message: "Chef successful created!", rows };
		} catch (err) {
			console.log(err);
			return { code: 400, message: "Bad request" };
		}
	});

	fastify.post("/auth/user/login", async (request, reply) => {
		const { email, password } = request.body;

		if (!email) {
			return { code: 400, message: "Invalid email or password provided." };
		}

		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT password, id, first_name AS "firstName", last_name AS "lastName", email, address, phone, avatar_url AS "avatarURL" FROM users WHERE email=$1',
			[email]
		);
		client.release();
		const passwordMatch = await bcrypt.compare(password, rows[0].password);
		if (passwordMatch) {
			const token = fastify.jwt.sign({
				expiresIn: "1 day",
				email,
				password,
				id: rows[0].id,
			});
			return {
				code: 200,
				message: "Successfully logged in!",
				id: rows[0].id,
				firstName: rows[0].firstName,
				lastName: rows[0].lastName,
				email: rows[0].email,
				address: rows[0].address,
				phone: rows[0].phone,
				avatarURL: rows[0].avatarURL,
				token,
			};
		}
		return { code: 400, message: "Incorrect credentials, please try again!" };
	});
};
