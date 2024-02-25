export async function getClosedTrades(env, days) {

    let attempts = 1;
    let dbResults;

    while (attempts <= 3) {

        try {
            // Get closed trades from the past X days from the database
            const sqlStatement = await env.DB.prepare(`
                SELECT * FROM CLOSEDPOSITIONS WHERE datetime(closedDateUtc) >= datetime('now', '-${days} days', 'utc')
            `);
            dbResults = await sqlStatement.all();

            if (dbResults.success === false) {
                throw new Error(`Error getting closed positions from the database.`);
            }

            // If data is successfully retrieved, break out of the loop
            console.log(`Closed positions retrieved successfully from db on attempt ${attempts}`);
            break;

        } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts}: Failed to get closed positions from DB - ${error.message}`);
            if (attempts > 3) {
                throw new Error(`Failed to get closed positions after ${attempts} attempts.`);
            }
        }

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