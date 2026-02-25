export function getAccessToken() {
    return localStorage.getItem('accessToken');
}

export function setAccessToken(token) {
    localStorage.setItem('accessToken', token);
}

export async function refreshAccessToken() {
    try {
        const response = await fetch('/admin/refresh-token', {
            method: 'POST',
            credentials: 'include', 
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setAccessToken(data.accessToken);
        return true;
    } catch (err) {
        console.error('Failed to refresh token:', err.message);
        return false;
    }
}
