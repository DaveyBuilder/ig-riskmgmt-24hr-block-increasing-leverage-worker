import { loginIG } from './helper_functions/login_ig.js';
import { getOpenPositions } from './helper_functions/open_positions.js';
import { getClosedTrades } from './helper_functions/closed_trades.js';
import {isMarketOpen} from './helper_functions/is_market_open.js';

export async function executeScheduledTask(request, env, ctx, usingDemoAccount) {
    
    let baseURL;
    if (usingDemoAccount) {
        baseURL = 'https://demo-api.ig.com/gateway/deal';
    } else {
        baseURL = 'https://api.ig.com/gateway/deal';
    }

    const { CST, X_SECURITY_TOKEN } = await loginIG(env, baseURL);

    // Check if nasdaq 100 futures are open & exit if not
	const marketStatus = await isMarketOpen(env, CST, X_SECURITY_TOKEN, baseURL);
	if (marketStatus === "EDITS_ONLY") {
		return;
	}

    const openPositions = await getOpenPositions(env, CST, X_SECURITY_TOKEN, baseURL);

    const closedPositions = await getClosedTrades(env, 1);

    let positionsWithin24Hours = {};

    for (const instrument in openPositions) {
        // Get the positions for the current instrument
        const positions = openPositions[instrument].positions;
        // Convert the createdDateUTC of each position to a Date object
        const dates = positions.map(p => new Date(p.position.createdDateUTC));

        // Compare each date with every other date
        for (let i = 0; i < dates.length; i++) {
            for (let j = i + 1; j < dates.length; j++) {

                const diff = Math.abs(dates[i] - dates[j]);

                // If difference <= 24 hours
                if (diff <= 24 * 60 * 60 * 1000) {
                    // Create objects for the conflicting positions
                    const positionDataI = { position: positions[i], reason: 'openPositionsConflict' };
                    const positionDataJ = { position: positions[j], reason: 'openPositionsConflict' };

                    // If this is the first conflict for this instrument, initialize an array
                    // Otherwise, add the positions to the existing array, if they are not already present
                    if (!positionsWithin24Hours[instrument]) {
                        positionsWithin24Hours[instrument] = [positionDataI, positionDataJ];
                    } else {
                        if (!positionsWithin24Hours[instrument].some(p => p.position === positions[i])) {
                            positionsWithin24Hours[instrument].push(positionDataI);
                        }
                        if (!positionsWithin24Hours[instrument].some(p => p.position === positions[j])) {
                            positionsWithin24Hours[instrument].push(positionDataJ);
                        }
                    }
                }
            }
        }
    }


    for (const closedInstrument in closedPositions) {
        // Convert the openDateUtc of each closed position to a Date object
        const closedPositionsOpenDates = closedPositions[closedInstrument].map(p => new Date(p.openDateUtc));

        // If there are open positions for this instrument
        if (openPositions[closedInstrument]) {
            // Convert the createdDateUTC of each open position to a Date object
            const openPositionsCreatedDates = openPositions[closedInstrument].positions.map(p => new Date(p.position.createdDateUTC));

            // Compare each open position date with every closed position date
            for (let i = 0; i < openPositionsCreatedDates.length; i++) {
                for (let j = 0; j < closedPositionsOpenDates.length; j++) {

                    const diff = Math.abs(openPositionsCreatedDates[i] - closedPositionsOpenDates[j]);

                    // If difference <= 24 hours
                    if (diff <= 24 * 60 * 60 * 1000) {
                        // Create an object for the conflicting (open) position
                        const positionData = { position: openPositions[closedInstrument].positions[i], reason: 'closedPositionsConflict' };

                        // If this is the first conflict for this instrument, initialize an array
                        // Otherwise, add the position to the existing array, if it is not already present
                        if (!positionsWithin24Hours[closedInstrument]) {
                            positionsWithin24Hours[closedInstrument] = [positionData];
                        } else if (!positionsWithin24Hours[closedInstrument].some(p => p.position === openPositions[closedInstrument].positions[i])) {
                            positionsWithin24Hours[closedInstrument].push(positionData);
                        }
                    }
                }
            }
        }
    }

    const positionsForClosure = [];

    for (const instrument in positionsWithin24Hours) {

        if (instrument !== 'Apple Inc (All Sessions)' && instrument !== 'EU Stocks 50' && instrument !== 'EUR/USD') {
            // Filter out positions with reason 'openPositionsConflict'
            const openPositionsConflicts = positionsWithin24Hours[instrument].filter(p => p.reason === 'openPositionsConflict');

            // Sort positions by createdDateUTC
            openPositionsConflicts.sort((a, b) => new Date(a.position.position.createdDateUTC) - new Date(b.position.position.createdDateUTC));

            // Push all positions except the first one into positionsForClosure
            positionsForClosure.push(...openPositionsConflicts.slice(1));

            // Filter out positions with reason 'closedPositionsConflict' and push them into positionsForClosure
            const closedPositionsConflicts = positionsWithin24Hours[instrument].filter(p => p.reason === 'closedPositionsConflict');
            positionsForClosure.push(...closedPositionsConflicts);
        }
    }
    
    // Create the array that contains the details needed for closure
    const positionsToClose = [];
    for (const item of positionsForClosure) {
        if (item.position.market.marketStatus === "TRADEABLE") {
            const positionDetailsForClosure = {
                dealId: item.position.position.dealId,
                epic: null,
                expiry: null,
                direction: item.position.position.direction === "BUY" ? "SELL" : "BUY",
                size: String(item.position.position.size),
                level: null,
                orderType: "MARKET",
                timeInForce: "FILL_OR_KILL",
                quoteId: null,
            };
            positionsToClose.push(positionDetailsForClosure);
        }
    }

    // Now close each position in positionsToClose
    
    const closePositionHeaders = {
        'Content-Type': 'application/json',
        'X-IG-API-KEY': env.IG_API_KEY,
        'Version': '1',
        'CST': CST,
        'X-SECURITY-TOKEN': X_SECURITY_TOKEN,
        '_method': 'DELETE'
    };

    // Iterate over positionsToClose and make a request for each
    for (const position of positionsToClose) {
        const response = await fetch(`${baseURL}/positions/otc`, {
            method: 'POST',
            headers: closePositionHeaders,
            body: JSON.stringify(position)
        });

        if (!response.ok) {
            console.error(`Failed to close position. Status code: ${response.status}`);
        } else {
            console.log(`Position closed successfully.`);
        }
    }

    //return positionsToClose;

}