export async function getOpenPositions(env, CST, X_SECURITY_TOKEN, baseURL) {

    const openPositionsResponse = await fetch(`${baseURL}/positions`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-IG-API-KEY': env.IG_API_KEY,
            'Version': '2',
            'CST': CST,
            'X-SECURITY-TOKEN': X_SECURITY_TOKEN
        }
    });

    if (!openPositionsResponse.ok) {
        throw new Error(`Error getting open positions. HTTP status: ${openPositionsResponse.status}`);
    }

    const openPositionsData = await openPositionsResponse.json();

    let openPositions = {};

    openPositionsData.positions.forEach(position => {

        const instrumentName = position.market.instrumentName;

        if (openPositions[instrumentName]) {
            openPositions[instrumentName].positions.push(position);
        } else {
            openPositions[instrumentName] = { positions: [position] };
        }

    });

    return openPositions;
}