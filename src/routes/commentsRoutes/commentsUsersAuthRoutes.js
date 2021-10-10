const usersRequireAuthentication = require("../../plugins/usersAuthenticator");
const verifyCommentOwnership = require("../../plugins/commentOwnership");

module.exports = async function commentsUsersAuthRoutes(fastify) {
	fastify.register(require("fastify-auth"));
	fastify.register(usersRequireAuthentication);
	fastify.register(verifyCommentOwnership);
	fastify.after(routes);

	function routes() {
		const commentService = new CommentService();

		fastify.route({
			method: "POST",
			url: "/comments/comment-create",
			preHandler: fastify.auth([fastify.verifyJWT]),
			handler: commentService.create,
		});

		fastify.route({
			method: "PUT",
			url: "/comments/comment-update/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: commentService.edit,
		});

		fastify.route({
			method: "DELETE",
			url: "/comments/comment-delete/:id",
			preHandler: fastify.auth([fastify.verifyJWT, fastify.verifyOwnership], {
				run: "all",
				relation: "and",
			}),
			handler: commentService.remove,
		});
	}

	class CommentService {
		async create(request) {
			const { authorUserID, authorKitchenID, authorType, content } = request.body;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"INSERT INTO comments (author_user_id, author_kitchen_id, author_type, content) VALUES ($1, $2, $3, $4) RETURNING *;",
				[authorUserID, authorKitchenID, authorType, content]
			);
			client.release();
			return { code: 201, message: "Comment successfully created", rows };
		}

		async edit(request) {
			const { content } = request.body;
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query(
				"UPDATE comments SET content=$1 WHERE id=$2 RETURNING *;",
				[content, id]
			);
			client.release();
			return { code: 200, message: `Comment with id ${id} has been updated`, rows };
		}

		async remove(request) {
			const { id } = request.params;
			const client = await fastify.pg.connect();
			const { rows } = await client.query("DELETE FROM kitchens WHERE id=$1 RETURNING *;", [id]);
			client.release();
			return { code: 200, message: `Comment with id ${id} has been deleted`, rows };
		}
	}
};
