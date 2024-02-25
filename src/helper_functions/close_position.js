export async function closePosition(env, CST, X_SECURITY_TOKEN, baseURL, position) {

    const closePositionHeaders = {
        'Content-Type': 'application/json',
        'X-IG-API-KEY': env.IG_API_KEY,
        'Version': '1',
        'CST': CST,
        'X-SECURITY-TOKEN': X_SECURITY_TOKEN,
        '_method': 'DELETE'
    };

    let attempts = 1;
    while (attempts <= 3) {

        const response = await fetch(`${baseURL}/positions/otc`, {
            method: 'POST',
            headers: closePositionHeaders,
            body: JSON.stringify(position)
        });

        if (response.ok) {
            console.log(`Position close, attempt ${attempts} succeeded`);
            return "success";
        } else {
            const responseBody = await response.json();
            console.log(`Close position attempt ${attempts} failed with status: ${response.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            attempts++;
            if (attempts > 3) {
                throw new Error(`Closing position all attempts failed with status: ${response.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            }
        }
    }
}