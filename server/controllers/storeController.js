const Store = require('../models/Store');

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public (or Protected based on need)
const getStores = async (req, res) => {
    try {
        let query = {};

        // Role-based scoping
        if (req.user && req.user.role !== 'Super Admin') {
            // Brand Admin, Area Manager, etc. only see their brand's stores
            // Note: assignedBrand is the property used in User model
            const brandId = req.user.assignedBrand;
            if (brandId) {
                query.brandId = brandId;
            }
        }

        const stores = await Store.find(query);
        res.json(stores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get store by ID
// @route   GET /api/stores/:id
// @access  Public
const getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (store) {
            res.json(store);
        } else {
            res.status(404).json({ message: 'Store not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new store
// @route   POST /api/stores
// @access  Private (Admin)
const createStore = async (req, res) => {
    console.log('Create Store Request Body:', req.body);
    try {
        const { name, type, address, pincode, coordinates, brandId, status, timings, capabilities, geoFence } = req.body;

        const store = new Store({
            name,
            type,
            address,
            pincode,
            coordinates,
            brandId,
            status,
            timings,
            capabilities,
            geoFence
        });

        const createdStore = await store.save();
        console.log('Store created successfully:', createdStore._id);
        res.status(201).json(createdStore);
    } catch (error) {
        console.error('Create Store Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a store
// @route   PUT /api/stores/:id
// @access  Private (Admin)
const updateStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (store) {
            store.name = req.body.name || store.name;
            store.type = req.body.type || store.type;
            store.address = req.body.address || store.address;
            store.pincode = req.body.pincode || store.pincode;
            store.coordinates = req.body.coordinates || store.coordinates;
            store.brandId = req.body.brandId || store.brandId;
            store.status = req.body.status || store.status;
            store.timings = req.body.timings || store.timings;
            store.capabilities = req.body.capabilities || store.capabilities;
            store.geoFence = req.body.geoFence || store.geoFence;

            const updatedStore = await store.save();
            res.json(updatedStore);
        } else {
            res.status(404).json({ message: 'Store not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a store
// @route   DELETE /api/stores/:id
// @access  Private (Admin)
const deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (store) {
            await store.deleteOne();
            res.json({ message: 'Store removed' });
        } else {
            res.status(404).json({ message: 'Store not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Geocode address using Nominatim (Server-side Proxy)
// @route   POST /api/stores/geocode
// @access  Private
const geocodeAddress = async (req, res) => {
    try {
        const { address, pincode } = req.body;
        console.log(`[GEOCODE DEBUG] Request Received -> Address: "${address}", Pincode: "${pincode}"`);

        // Helper function to fetch from Nominatim with flexible params
        const fetchNominatim = async (params, strategyName) => {
            // Construct query string manually to avoid encoding issues with URLSearchParams
            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');

            // NOTE: Using addressdetails=1 to get extra info if needed later
            const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&${queryString}`;
            console.log(`[GEOCODE DEBUG] Strategy: ${strategyName} -> Querying: ${url}`);

            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'DokaCakeApp/1.0 (internal-usage)',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.error(`[GEOCODE ERROR] Strategy: ${strategyName} -> API Error: ${response.status} ${response.statusText}`);
                    return null;
                }

                const data = await response.json();
                console.log(`[GEOCODE DEBUG] Strategy: ${strategyName} -> Result Count: ${data.length}`);
                return (data && data.length > 0) ? data : null;
            } catch (networkError) {
                console.error(`[GEOCODE EXCEPTION] Strategy: ${strategyName} -> Network Error:`, networkError);
                return null;
            }
        };

        let result = null;

        // Strategy 1: Structured Search (Best for precise addresses)
        // Try street + postalcode + country
        if (address && pincode) {
            result = await fetchNominatim({
                street: address,
                postalcode: pincode,
                country: 'India'
            }, "1. Address + Pincode");
        }

        // Strategy 2: Structured Pincode Search (HIGH RELIABILITY for "nearest location")
        // If specific address fails, find the Pincode area
        if (!result && pincode) {
            result = await fetchNominatim({
                postalcode: pincode,
                country: 'India'
            }, "2. Pincode + India");
        }

        // Strategy 3: Loose Search (Fallback for edge cases)
        if (!result && (address || pincode)) {
            const q = `${address ? address + ', ' : ''}${pincode ? pincode : ''}`;
            result = await fetchNominatim({ q: q }, "3. Loose Search");
        }

        if (result) {
            console.log(`[GEOCODE SUCCESS] Found location: ${result[0].lat}, ${result[0].lon}`);
            res.json(result);
        } else {
            console.log("[GEOCODE FAILURE] All strategies failed.");
            res.json([]); // Return empty array to signify "Not Found" gracefully
        }

    } catch (error) {
        console.error('[GEOCODE CRITICAL ERROR]', error);
        res.status(500).json({ message: 'Failed to geocode address via server proxy', error: error.message });
    }
};

module.exports = {
    getStores,
    getStoreById,
    createStore,
    updateStore,
    deleteStore,
    geocodeAddress
};
