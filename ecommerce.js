// server.js
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/test/companies';

const COMPANIES = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
const CATEGORIES = ["Phone", "Computer", "TV", "Earphone", "Tablet", "Charger", "Mouse", "Keypad", "Bluetooth", "Pendrive", "Remote", "Speaker", "Headset", "Laptop", "PC"];

// Helper function to fetch products from all companies for a category
const fetchProducts = async (category, minPrice, maxPrice) => {
    const requests = COMPANIES.map(company => 
        axios.get(${TEST_SERVER_BASE_URL}/${company}/categories/${category}/products, {
            params: {
                top: 100,
                minPrice,
                maxPrice
            }
        }).then(response => response.data).catch(() => [])
    );
    const products = await Promise.all(requests);
    return products.flat();
};

// GET /categories/:categoryname/products
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { n, minPrice, maxPrice, page = 1, sort_by, sort_order } = req.query;
    const limit = parseInt(n) || 10;
    const offset = (page - 1) * limit;
    
    if (!CATEGORIES.includes(categoryname)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    try {
        const products = await fetchProducts(categoryname, minPrice, maxPrice);
        
        // Assign unique IDs to products
        const productsWithId = products.map(product => ({ ...product, id: uuidv4() }));

        // Sorting
        if (sort_by && ['price', 'rating', 'discount'].includes(sort_by)) {
            productsWithId.sort((a, b) => {
                if (sort_order === 'desc') {
                    return b[sort_by] - a[sort_by];
                } else {
                    return a[sort_by] - b[sort_by];
                }
            });
        }

        // Pagination
        const paginatedProducts = productsWithId.slice(offset, offset + limit);
        res.json(paginatedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /categories/:categoryname/products/:productid
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;

    if (!CATEGORIES.includes(categoryname)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    try {
        const products = await fetchProducts(categoryname);
        const product = products.find(p => p.id === productid);
        
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});