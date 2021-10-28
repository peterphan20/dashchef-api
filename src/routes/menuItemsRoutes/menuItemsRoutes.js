module.exports = async function menuItemsRoutes(fastify) {
	fastify.get("/kitchen/menu-item/:id", async (request, reply) => {
		const { id } = request.params;
		const client = await fastify.pg.connect();
		const { rows } = await client.query(
			'SELECT id, name, description, price, photo_primary_url as "primaryPhoto", gallery_photo_urls as "galleryPhoto", tags FROM menu_items WHERE id=$1',
			[id]
		);
		client.release();
		return { code: 200, rows };
	});
};
