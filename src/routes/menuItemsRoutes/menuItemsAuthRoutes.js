const chefsRequireAuthentication = require("../../plugins/chefsAuthenticator");

module.exports = async function menuItemsAuthRoutes(fastify) {
	fastify.register(chefsRequireAuthentication);
	fastify.decorate("verifyOwnership", async (request, reply) => {
		const { jwt } = fastify;

		if (!request.raw.headers.auth) {
			return done(new Error("Missing token header"));
		}

		jwt.verify(request.raw.headers.auth, async (err, decoded) => {
			try {
				const { id } = decoded;
				const menu = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					`
          SELECT 
            c.id,
            c.kitchen_id 
            m.id,
            m.kitchen_id,
            CASE 
              WHEN m.kitchen_id = c.kitchen_id THEN true
              ELSE false
            END AS "chefOwnMenuItem"
            FROM menu_items m
            LEFT JOIN chefs c ON c.id = $1
            WHERE m.id = $2
        `,
					[id, menu.id]
				);
				client.release();
				if (!rows[0].chefOwnMenuItem) {
					return done(new Error("User does not own this kitchen"));
				}
				return done();
			} catch (error) {
				console.error(error);
				return done(new Error(error));
			}
		});
	});
	fastify.register(require("fastify-auth"));
	fastify.after(() => {
		fastify.route({
			method: "POST",
			url: "/kitchen/menu/create-item",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: async (request) => {
				const { name, id, description, price, photoPrimaryURL, galleryPhotoURL, tags } =
					request.body;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					`
					INSERT INTO menu_items (name, kitchen_id, description, price, photo_primary_url, gallery_photo_urls, tags) VALUES ($1, $2, $3, $4, $5, $6, $7) 
					RETURNING 
						name,
						kitchen_id AS "kitchenID",
						description, 
						price, 
						photo_primary_url as "primaryPhoto", 
						gallery_photo_urls as "galleryPhoto",
						tags;
					`,
					[name, id, description, price, photoPrimaryURL, galleryPhotoURL, tags]
				);
				client.release();
				return {
					code: 201,
					message: "Menu item successfully created!",
					rows,
				};
			},
		});

		fastify.route({
			method: "PUT",
			url: "/kitchens/menu/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership]),
			handler: async (request) => {
				const { name, description, price, photoPrimaryURL, galleryPhotoURL, tags } = request.body;
				const { id } = request.params;
				const client = await fastify.pg.connect();
				const { rows } = await client.query(
					"UPDATE kitchens SET name=$1, description=$2, price=$3, photo_primary_url=$4, gallery_photo_urls=$5, tags=$6 WHERE id=$7 RETURNING *;",
					[name, description, price, photoPrimaryURL, galleryPhotoURL, tags, id]
				);
				client.release();
				return { code: 200, message: `Menu iteem with id ${id} has been updated`, rows };
			},
		});

		fastify.route({
			method: "DELETE",
			url: "/kitchens/menu/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership]),
			handler: async (request) => {
				const { id } = request.params;
				const client = await fastify.pg.connect();
				await client.query("DELETE FROM menu_items WHERE id=$1 RETURNING *;", [id]);
				client.release();
				return { code: 200, message: `Menu item with id ${id} has been deleted` };
			},
		});
	});
};
