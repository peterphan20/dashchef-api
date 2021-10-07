module.exports = async function kitchensRoutes(fastify) {
	fastify.get("/kitchens", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT name, email, address, phone, avatar_url, created_at FROM kitchens"
		);
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/kitchens/:kitchen", async (request, reply) => {
		const { kitchen } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			`
			SELECT 
				k.id,
				k.name, 
				k.email, 
				k.address, 
				k.phone, 
				k.avatar_url AS "avatarURL", 
				k.created_at AS "createdAt",
				c.first_name AS "chefFirstname",
				c.last_name AS "chefLastname",
				json_agg(json_build_object(
					'menuID', m.id,
					'menuName', m.name,
					'menuDescription', m.description,
					'menuPrice', m.price,
					'photoPrimaryURL', m.photo_primary_url,
					'galleryPhotoURL', m.gallery_photo_urls,
					'menuTags', m.tags
				) ORDER BY m.name ASC) AS menuItems 
			FROM kitchens k
			LEFT JOIN menu_items m
				ON m.kitchen_id = k.id
			LEFT JOIN chefs c
				ON c.kitchen_id = k.id
			WHERE k.name = $1
			GROUP BY
				k.id,
				k.name,
				k.email,
				k.address,
				k.phone,
				k.avatar_url,
				k.created_at,
				c.first_name,
				c.last_name
			ORDER BY
				k.name ASC;
			`,
			[kitchen]
		);
		client.release();
		return { code: 200, rows };
	});
};
