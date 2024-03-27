import qs from 'qs';

export const get = async (url: string, params = {}) => {
    if (!url) return;
    try {
        const response = await fetch(`${url}${qs.stringify(params, { addQueryPrefix: true })}`);

        const resJson = await response.json()
        return resJson;
    } catch (error) {
        console.error(error)
    }
}

export const post = async (url: string, data = {}) => {
    if (!url) return;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data && typeof data === 'object'
                ? JSON.stringify(data)
                : undefined
        })
        const resJson = await response.json()
        return resJson;
    } catch (error) {
        console.error(error)
    }
}