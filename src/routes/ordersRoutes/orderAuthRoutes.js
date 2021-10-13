const usersRequireAuthentication = require("../../plugins/usersAuthenticator");
const verifyOrderOwnership = require("../../plugins/orderOwnership");

module.exports = async function orderAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(usersRequireAuthentication);
	fastify.register(verifyOrderOwnership);
	fastify.after(routes);

	function routes() {
		const orderService = new OrderService();

		fastify.route({
			method: "GET",
			url: "/orders/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderService.hello,
		});

		fastify.route({
			method: "POST",
			url: "/orders/order-create",
			preHandler: fastify.auth([fastify.verifyJWT], {
				run: "all",
				relation: "and",
			}),
			handler: orderService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/orders/order-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/orders/order-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderService.remove,
		});
	}

	class OrderService {
		async hello(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				'SELECT status, date_created AS "dateCreated", date_fulfilled AS "dateFulfilled" FROM orders WHERE id=$1',
				[id]
			);
			client.release();
			return { code: 200, rows };
		}

		async create(request) {
			const { menuItemID, kitchenID, userID, status, dateCreated, dateFulfilled } = request.body;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"INSERT INTO orders (menu_item_id, kitchen_id, users_id, status, date_created, date_fulfilled) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;",
				[menuItemID, kitchenID, userID, status, dateCreated, dateFulfilled]
			);
			client.release();
			return { code: 201, message: "Order has been created", rows };
		}

		async edit(request) {
			const { status, dateFulfilled } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE orders SET status=$1, date_fulfilled=$2 WHERE id=$3 RETURNING *;",
				[status, dateFulfilled, id]
			);
			client.release();
			return { code: 200, message: `Order number ${id} has been fulfilled`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM orders WHERE id=$1", [id]);
			return { code: 200, message: `Order number ${id} has been cancelled`, rows };
		}
	}
};
