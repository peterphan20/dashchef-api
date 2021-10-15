const usersRequireAuthentication = require("../../plugins/usersAuthenticator");
const verifyOrderOwnership = require("../../plugins/orderOwnership");

module.exports = async function orderStatusAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(usersRequireAuthentication);
	fastify.register(verifyOrderOwnership);
	fastify.after(routes);

	function routes() {
		const orderStatusService = new OrderStatusService();

		fastify.route({
			method: "GET",
			url: "/orders/order-status",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderStatusService.getAllOrderStatuses,
		});

		fastify.route({
			method: "GET",
			url: "/orders/order-status/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderStatusService.getOrderStatus,
		});

		fastify.route({
			method: "POST",
			url: "/orders/order-status/status-create",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderStatusService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/orders/order-status/status-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderStatusService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/orders/order-status/status-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOrderOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: orderStatusService.remove,
		});
	}

	class OrderStatusService {
		async getAllOrderStatuses() {
			const client = await fastify.pg.connect();
			const { rows } = await client.query("SELECT identifier, meaning FROM order_statuses");
			client.release();
			return { code: 200, rows };
		}

		async getOrderStatus(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"SELECT identifier, meaning FROM order_statuses WHERE id=$1",
				[id]
			);
			client.release();
			return { code: 200, rows };
		}

		async create(request) {
			const { identifier, meaning } = request.body;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"INSERT INTO order_statuses (identifier, meaning) VALUES ($1, $2) RETURNING *;",
				[identifier, meaning]
			);
			client.release();
			return { code: 201, message: "Order status has been created", rows };
		}

		async edit(request) {
			const { id } = request.params;
			const { identifier, meaning } = request.body;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE order_statuses SET identifier=$1, meaning=$2 WHERE id=$3 RETURNING *;",
				[identifier, meaning, id]
			);
			client.release();
			return { code: 200, message: `Order status for order number ${id} has been updated`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM order_statuses WHERE id=$1 RETURNING *;", [
				id,
			]);
			client.release();
			return { code: 200, message: `Order status for order number ${id} has been deleted`, rows };
		}
	}
};
