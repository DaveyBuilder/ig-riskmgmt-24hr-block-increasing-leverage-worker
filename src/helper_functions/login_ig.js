export async function loginIG(env, baseURL) {
    let attempts = 1;
    while (attempts <= 3) {
        const loginResponse = await fetch(`${baseURL}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-IG-API-KEY': env.IG_API_KEY,
                'Version': '2'
            },
            body: JSON.stringify({
                identifier: env.IG_IDENTIFIER,
                password: env.IG_PASSWORD,
            })
        });

        if (loginResponse.ok) {
            console.log(`Login attempt ${attempts} succeeded`);
            const CST = loginResponse.headers.get('CST');
            const X_SECURITY_TOKEN = loginResponse.headers.get('X-SECURITY-TOKEN');
            return { CST, X_SECURITY_TOKEN };
        } else {
            const responseBody = await loginResponse.json();
            console.log(`Login attempt ${attempts} failed with status: ${loginResponse.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            attempts++;
            if (attempts > 3) {
                throw new Error(`Login failed after ${attempts} attempts with status: ${loginResponse.status}, Response: ${JSON.stringify(responseBody, null, 2)}`);
            }
        }
    }
}