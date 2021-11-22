const bcrypt = require("bcrypt");
const { s3Client } = require("../../helpers/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Busboy = require("busboy");
var crypto = require("crypto");

module.exports = async function authenticateUsers(fastify) {
	fastify.addContentTypeParser("multipart/form-data", (request, payload, done) => done());

	fastify.post("/auth/user", async (request, reply) => {
		const busboy = new Busboy({ headers: request.headers });
		request.raw.pipe(busboy);

		const bucketParams = { Bucket: "dashchef-dev" };
		const dataObj = {};

		busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
			bucketParams.Key = crypto.randomBytes(20).toString("hex");
			bucketParams.ContentType = mimetype;

			const fileBuffers = [];
			file.on("data", (data) => fileBuffers.push(data));

			file.on("end", async () => {
				const file = Buffer.concat(fileBuffers);
				bucketParams.Body = file;
			});
		});

		busboy.on("field", (fieldname, val) => {
			dataObj[fieldname] = val;
		});

		let newUser = [];
		const something = new Promise((resolve, reject) => {
			busboy.on("finish", async () => {
				try {
					const s3res = await s3Client.send(new PutObjectCommand(bucketParams));
					if (s3res.$metadata.httpStatusCode !== 200) {
						reply.code(400).send({ message: "Failed to post image to s3" });
					}
					dataObj.avatarURL = process.env.BASE_S3_URL + bucketParams.Key;
					const { firstName, lastName, email, password, address, phone, avatarURL } = dataObj;
					if (!firstName || !lastName || !email || !password || !address || !phone) {
						return { code: 400, message: "Missing values, please check input fields." };
					}
					const hash = await bcrypt.hash(password, 10);
					const client = await fastify.pg.connect();
					const { rows } = await client.query(
						"INSERT INTO users (first_name, last_name, email, password, address, phone, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;",
						[firstName, lastName, email, hash, address, phone, avatarURL]
					);
					newUser = [...rows];
					client.release();
					reply.code(201).send({ code: 201, message: "User successful created!", newUser });
					resolve();
				} catch (err) {
					console.log("Error", err);
					reject();
					reply.code(400).send({ message: "Error, something went wrong :( " });
				}
			});
		});
		await something;
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
