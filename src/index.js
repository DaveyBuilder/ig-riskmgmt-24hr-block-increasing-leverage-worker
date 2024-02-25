import { executeScheduledTask } from './main.js';

export default {

	// async fetch(request, env, ctx) {

	// 	const usingDemoAccount = false;

	// 	const data = await executeScheduledTask(request, env, ctx, usingDemoAccount)
	// 	const jsonData = JSON.stringify(data, null, 2);
	// 	// Return the JSON data when the worker URL is visited
	// 	return new Response(jsonData, {
	// 		headers: { "content-type": "application/json" },
	// 	});

	// },

	async scheduled(event, env, ctx) {

		const usingDemoAccount = false;

		// Call processRequest on the cron schedule
		return executeScheduledTask(event, env, ctx, usingDemoAccount);
	},

};