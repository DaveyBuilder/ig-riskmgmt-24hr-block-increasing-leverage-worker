export async function getClosedTrades(env, days) {

    // Get closed trades from the past X days from the database
    const sqlStatement = await env.DB.prepare(`
        SELECT * FROM CLOSEDPOSITIONS WHERE datetime(closedDateUtc) >= datetime('now', '-${days} days', 'utc')
    `);
    const dbResults = await sqlStatement.all();

    if (dbResults.success === false) {
        throw new Error(`Error getting closed positions from the database.`);
    }

    let groupedResults = {};
    for (const row of dbResults.results) {
        // If the instrumentName is not in groupedResults, add it with an empty array
        if (!groupedResults[row.instrumentName]) {
            groupedResults[row.instrumentName] = [];
        }
        
        // Add the row to the array of the corresponding instrumentName
        groupedResults[row.instrumentName].push(row);
    }

    return groupedResults;
}