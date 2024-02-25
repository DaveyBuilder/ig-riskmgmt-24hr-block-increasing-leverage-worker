export async function getOpenPositions(env, CST, X_SECURITY_TOKEN, baseURL) {

    let attempts = 1;
    let openPositionsResponse;
    while (attempts <= 3) {

        openPositionsResponse = await fetch(`${baseURL}/positions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-IG-API-KEY': env.IG_API_KEY,
                'Version': '2',
                'CST': CST,
                'X-SECURITY-TOKEN': X_SECURITY_TOKEN
            }
        });

        if (openPositionsResponse.ok) {
            console.log(`Get open positions API attempt ${attempts} succeeded`);
            const openPositionsData = await openPositionsResponse.json();
            return openPositionsData;
        } else {
            const responseBody = await openPositionsResponse.json();
            console.log(`Attempt ${attempts} failed with status: ${openPositionsResponse.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            attempts++;
            if (attempts > 3) {
                throw new Error(`Error getting open positions. HTTP status: ${openPositionsResponse.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            }
        }
    }

}