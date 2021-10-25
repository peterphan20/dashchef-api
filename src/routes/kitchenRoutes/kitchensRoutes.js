module.exports = async function kitchensRoutes(fastify) {
	fastify.get("/kitchens", async (request, reply) => {
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			"SELECT name, email, address, phone, avatar_url, created_at FROM kitchens"
		);
		client.release();
		return { code: 200, rows };
	});

	fastify.get("/kitchens/:id", async (request, reply) => {
		const { id } = request.params;
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
				c.first_name AS "chefFirstName",
				c.last_name AS "chefLastName",
				json_agg(json_build_object(
					'menuItemID', m.id,
					'menuItemName', m.name,
					'menuItemDescription', m.description,
					'menuItemPrice', m.price,
					'menuItemPhotoPrimaryURL', m.photo_primary_url,
					'menuItemGalleryPhotoURL', m.gallery_photo_urls,
					'menuItemTags', m.tags
				) ORDER BY m.name ASC) AS menuItems 
			FROM kitchens k
			LEFT JOIN menu_items m
				ON m.kitchen_id = k.id
			LEFT JOIN chefs c
				ON c.kitchen_id = k.id
			WHERE k.id = $1
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
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
