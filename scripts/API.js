const API_URL = 'https://webproject-latest.onrender.com/api/';

const API = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}Account/Login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Email: email, Password: password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Помилка HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Помилка під час входу:', error);
            throw error;
        }
    },

    register: async (username, email, password) => {
        try {
            const response = await fetch(`${API_URL}Account/Create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Name: username, Email: email, Password: password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Помилка HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Помилка під час реєстрації:', error);
            throw error;
        }
    }
};