export async function isMarketOpen(env, CST, X_SECURITY_TOKEN, baseURL) {

    let attempts = 1;
    while (attempts <= 3) {
    
        const response = await fetch(`${baseURL}/markets/IX.D.NASDAQ.CASH.IP`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-IG-API-KEY': env.IG_API_KEY,
                'CST': CST,
                'version': '3',
                'X-SECURITY-TOKEN': X_SECURITY_TOKEN
            }
        });

        if (response.ok) {
            console.log(`Market open check, attempt ${attempts} succeeded`);
            const data = await response.json();
            if (!data.snapshot || !data.snapshot.marketStatus) {
                throw new Error('Unexpected API response structure');
            }
            return data.snapshot.marketStatus;
        } else {
            const responseBody = await response.json();
            console.log(`Attempt ${attempts} failed with status: ${response.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            attempts++;
            if (attempts > 3) {
                throw new Error(`The check for market open failed with status: ${response.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            }
        }
    }

}