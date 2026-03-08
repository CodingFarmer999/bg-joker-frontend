import { useState, useEffect } from 'react';
import './StoreSelector.css';

const StoreSelector = () => {
    const [stores, setStores] = useState([]);
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const token = localStorage.getItem('joker_token');
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch('/api/stores', { headers });
                if (response.ok) {
                    const data = await response.json();
                    setStores(data);

                    // Retrieve previously selected store from local storage, or default to the first one
                    const savedStoreId = localStorage.getItem('joker_selected_store_id');
                    if (savedStoreId && data.some(s => s.id.toString() === savedStoreId)) {
                        setSelectedStoreId(savedStoreId);
                    } else if (data.length > 0) {
                        const firstId = data[0].id.toString();
                        setSelectedStoreId(firstId);
                        localStorage.setItem('joker_selected_store_id', firstId);

                        // We must trigger event because we auto-changed the selection context
                        window.dispatchEvent(new CustomEvent('storeChanged', { detail: { storeId: firstId } }));
                    } else if (data.length === 0) {
                        setSelectedStoreId('');
                        localStorage.removeItem('joker_selected_store_id');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch stores:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStores();
    }, []);

    const handleChange = (e) => {
        const newStoreId = e.target.value;
        setSelectedStoreId(newStoreId);
        localStorage.setItem('joker_selected_store_id', newStoreId);

        // Optionally trigger a custom event so other components can reload data based on the new store
        window.dispatchEvent(new CustomEvent('storeChanged', { detail: { storeId: newStoreId } }));
    };

    if (isLoading) {
        return <div className="store-selector-skeleton">Loading...</div>;
    }

    if (stores.length === 0) {
        return null; // Return nothing if no stores are available
    }

    return (
        <div className="store-selector-container">
            <span className="store-icon">📍</span>
            <select
                className="store-dropdown"
                value={selectedStoreId}
                onChange={handleChange}
                aria-label="Select Store"
            >
                {stores.map(store => (
                    <option key={store.id} value={store.id}>
                        {store.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default StoreSelector;
