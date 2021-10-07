module.exports = async function postsRoutes(fastify) {
	fastify.get("/posts", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query("SELECT * FROM posts");
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/posts/:id", async (request, reply) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
			SELECT 
				p.id,
				p.author_id AS "authorID",
				p.title,
				p.content,
				p.tags,
				p.created_at AS "createdAt",
				p.image_url AS "imageURL",
				c.first_name AS "authorFirstname",
				c.last_name AS "authorLastname",
				json_agg(json_build_object(
					'commentID', comm.id,
					'authorID', comm.author_user_id,
					'authorKitchenID', comm.author_kitchen_id,
					'commentContent', comm.content,
					'createdAt', comm.created_at,
					'commentAuthorFirstname', (
						SELECT first_name FROM users WHERE users.id = comm.author_user_id
					),
					'commentAuthorLastname', (
						SELECT last_name FROM users WHERE users.id = comm.author_user_id
					)
				) ORDER BY comm.created_at ASC) AS comments
				FROM posts p
				LEFT JOIN comments comm 
					ON comm.post_id = p.id
				LEFT JOIN chefs c
					ON c.id = p.author_id
				WHERE p.id = $1
				GROUP BY 
					p.id,
					p.title,
					p.content,
					p.tags,
					p.created_at,
					p.image_url,
					c.first_name,
					c.last_name
				ORDER BY 
					p.created_at DESC;
			`,
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
